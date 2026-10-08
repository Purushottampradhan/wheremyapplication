import { Router } from 'express';
import mongoose from 'mongoose';
import { Application } from '../models/Application.js';
import { TimelineEvent } from '../models/TimelineEvent.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { APPLICATION_STATUSES } from '../utils/constants.js';
import { isGroqConfigured } from '../services/groqExtract.js';
import { buildSalaryInsights } from '../services/salaryInsights.js';

const router = Router();
router.use(requireAuth);

router.get('/stats', async (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const oid = new mongoose.Types.ObjectId(userId);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const activeMatch = { userId: oid, archived: { $ne: true } };

  const [
    statusAgg,
    sourceAgg,
    companyAgg,
    recent,
    thisWeek,
    thisMonth,
    recentEvents,
    skillDocs,
    enrichedCount,
    totalActive,
    workplaceAgg,
  ] = await Promise.all([
    Application.aggregate([
      { $match: activeMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.aggregate([
      { $match: activeMatch },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Application.aggregate([
      { $match: activeMatch },
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Application.find({ userId, archived: { $ne: true } })
      .sort({ updatedAt: -1 })
      .limit(8),
    Application.countDocuments({
      userId,
      archived: { $ne: true },
      appliedAt: { $gte: weekAgo },
    }),
    Application.countDocuments({
      userId,
      archived: { $ne: true },
      appliedAt: { $gte: monthAgo },
    }),
    TimelineEvent.find({ userId }).sort({ createdAt: -1 }).limit(12),
    Application.find({ userId, archived: { $ne: true } })
      .select('requiredSkills preferredSkills status')
      .limit(500),
    Application.countDocuments({
      userId,
      archived: { $ne: true },
      aiEnrichedAt: { $ne: null },
    }),
    Application.countDocuments({ userId, archived: { $ne: true } }),
    Application.aggregate([
      { $match: activeMatch },
      {
        $group: {
          _id: {
            $cond: [
              { $or: [{ $eq: ['$workplaceType', ''] }, { $eq: ['$workplaceType', null] }] },
              'Unknown',
              '$workplaceType',
            ],
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  const counts: Record<string, number> = {};
  for (const s of APPLICATION_STATUSES) counts[s] = 0;
  for (const row of statusAgg) counts[row._id as string] = row.count as number;

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const pipelineEntered =
    (counts.applied || 0) +
    (counts.screening || 0) +
    (counts.interview || 0) +
    (counts.offer || 0) +
    (counts.rejected || 0);
  const interviewRate =
    pipelineEntered > 0
      ? Math.round(
          (((counts.interview || 0) + (counts.offer || 0)) / pipelineEntered) * 100
        )
      : 0;
  const offerRate =
    (counts.interview || 0) + (counts.offer || 0) > 0
      ? Math.round(
          ((counts.offer || 0) / ((counts.interview || 0) + (counts.offer || 0))) * 100
        )
      : 0;
  const rejectionRate =
    pipelineEntered > 0 ? Math.round(((counts.rejected || 0) / pipelineEntered) * 100) : 0;

  const skillCounts = new Map<string, number>();
  for (const doc of skillDocs) {
    for (const skill of [...(doc.requiredSkills || []), ...(doc.preferredSkills || [])]) {
      const key = skill.trim();
      if (!key) continue;
      skillCounts.set(key, (skillCounts.get(key) || 0) + 1);
    }
  }
  const topSkills = [...skillCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([skill, count]) => ({ skill, count }));

  // Last 6 months trend
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const monthly = await Application.aggregate([
    {
      $match: {
        userId: oid,
        archived: { $ne: true },
        appliedAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          y: { $year: '$appliedAt' },
          m: { $month: '$appliedAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);

  res.json({
    counts,
    total,
    totalActive,
    thisWeek,
    thisMonth,
    recent,
    recentEvents,
    bySource: sourceAgg.map((r) => ({ source: r._id || 'other', count: r.count })),
    byCompany: companyAgg.map((r) => ({ company: r._id || 'Unknown', count: r.count })),
    byWorkplace: workplaceAgg.map((r) => ({
      workplace: r._id || 'Unknown',
      count: r.count,
    })),
    funnel: {
      interviewRate,
      offerRate,
      rejectionRate,
      wishlist: counts.wishlist || 0,
      applied: counts.applied || 0,
      screening: counts.screening || 0,
      interview: counts.interview || 0,
      offer: counts.offer || 0,
      rejected: counts.rejected || 0,
    },
    topSkills,
    enrichedCount,
    enrichmentCoverage:
      totalActive > 0 ? Math.round((enrichedCount / totalActive) * 100) : 0,
    monthlyTrend: monthly.map((r) => ({
      label: `${r._id.y}-${String(r._id.m).padStart(2, '0')}`,
      count: r.count,
    })),
    salaryInsights: await buildSalaryInsights(userId),
    groqConfigured: isGroqConfigured(),
  });
});

export default router;
