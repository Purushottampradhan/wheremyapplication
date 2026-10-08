import { Router } from 'express';
import { z } from 'zod';
import { Application } from '../models/Application.js';
import { TimelineEvent } from '../models/TimelineEvent.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
} from '../utils/constants.js';
import {
  extractJobFromPageText,
  isGroqConfigured,
  mergeScrapedWithAi,
} from '../services/groqExtract.js';
import { matchResumeToJd } from '../services/matchScore.js';
import { User } from '../models/User.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  company: z.string().trim().min(1).max(200),
  roleTitle: z.string().trim().min(1).max(200),
  location: z.string().trim().max(200).optional().default(''),
  jobUrl: z.string().trim().max(2000).optional().default(''),
  source: z.enum(APPLICATION_SOURCES).optional().default('manual'),
  status: z.enum(APPLICATION_STATUSES).optional().default('applied'),
  notes: z.string().max(5000).optional().default(''),
  salaryRange: z.string().max(200).optional().default(''),
  jobDescription: z.string().max(20000).optional().default(''),
  externalJobId: z.string().max(200).optional().default(''),
  appliedAt: z.coerce.date().optional(),
  followUpAt: z.coerce.date().nullable().optional(),
  pageTitle: z.string().max(500).optional().default(''),
  pageText: z.string().max(60000).optional().default(''),
  enrichWithAi: z.boolean().optional().default(true),
  employmentType: z.string().max(100).optional(),
  workplaceType: z.string().max(100).optional(),
  experienceLevel: z.string().max(100).optional(),
  requiredSkills: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  forceDuplicate: z.boolean().optional().default(false),
});

const updateSchema = createSchema.partial().extend({
  responsibilities: z.string().max(8000).optional(),
  requirements: z.string().max(8000).optional(),
  benefits: z.string().max(4000).optional(),
  companyDescription: z.string().max(4000).optional(),
  companyIndustry: z.string().max(200).optional(),
  companySize: z.string().max(100).optional(),
  recruiterName: z.string().max(200).optional(),
  recruiterEmail: z.string().max(200).optional(),
  applicationDeadline: z.string().max(100).optional(),
  aiSummary: z.string().max(2000).optional(),
  archived: z.boolean().optional(),
});

const statusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
  message: z.string().max(1000).optional(),
});

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  action: z.enum(['status', 'archive', 'unarchive', 'priority', 'delete']),
  value: z.string().optional(),
});

router.get('/', async (req: AuthedRequest, res) => {
  const {
    status,
    source,
    search,
    company,
    workplaceType,
    employmentType,
    priority,
    archived,
    sort = 'appliedAt',
    groupBy,
  } = req.query;

  const filter: Record<string, unknown> = { userId: req.user!.userId };
  if (archived === 'true') filter.archived = true;
  else if (archived === 'all') {
    /* no archived filter */
  } else filter.archived = { $ne: true };

  if (typeof status === 'string' && status) filter.status = status;
  if (typeof source === 'string' && source) filter.source = source;
  if (typeof company === 'string' && company.trim()) {
    filter.company = new RegExp(company.trim(), 'i');
  }
  if (typeof workplaceType === 'string' && workplaceType) {
    filter.workplaceType = new RegExp(workplaceType, 'i');
  }
  if (typeof employmentType === 'string' && employmentType) {
    filter.employmentType = new RegExp(employmentType, 'i');
  }
  if (typeof priority === 'string' && priority) filter.priority = priority;

  if (typeof search === 'string' && search.trim()) {
    const q = search.trim();
    filter.$or = [
      { company: new RegExp(q, 'i') },
      { roleTitle: new RegExp(q, 'i') },
      { location: new RegExp(q, 'i') },
      { notes: new RegExp(q, 'i') },
      { tags: new RegExp(q, 'i') },
      { requiredSkills: new RegExp(q, 'i') },
      { aiSummary: new RegExp(q, 'i') },
    ];
  }

  const sortField =
    sort === 'updatedAt'
      ? 'updatedAt'
      : sort === 'company'
        ? 'company'
        : sort === 'priority'
          ? 'priority'
          : 'appliedAt';
  const sortDir = sort === 'company' ? 1 : -1;

  const apps = await Application.find(filter)
    .sort({ [sortField]: sortDir })
    .limit(500);

  if (groupBy === 'company' || groupBy === 'status' || groupBy === 'source') {
    const map = new Map<string, typeof apps>();
    for (const app of apps) {
      const key = String(
        groupBy === 'company'
          ? app.company || 'Unknown'
          : groupBy === 'status'
            ? app.status
            : app.source || 'other'
      );
      if (!map.has(key)) map.set(key, [] as unknown as typeof apps);
      (map.get(key) as typeof apps).push(app);
    }
    const groups = [...map.entries()]
      .map(([key, items]) => ({ key, count: items.length, items }))
      .sort((a, b) => b.count - a.count);
    res.json({ applications: apps, groups, groqConfigured: isGroqConfigured() });
    return;
  }

  res.json({ applications: apps, groqConfigured: isGroqConfigured() });
});

router.post('/bulk', async (req: AuthedRequest, res) => {
  try {
    const body = bulkSchema.parse(req.body);
    const filter = { userId: req.user!.userId, _id: { $in: body.ids } };

    if (body.action === 'delete') {
      await TimelineEvent.deleteMany({
        userId: req.user!.userId,
        applicationId: { $in: body.ids },
      });
      const result = await Application.deleteMany(filter);
      res.json({ ok: true, modified: result.deletedCount });
      return;
    }

    if (body.action === 'archive') {
      const result = await Application.updateMany(filter, { $set: { archived: true } });
      res.json({ ok: true, modified: result.modifiedCount });
      return;
    }
    if (body.action === 'unarchive') {
      const result = await Application.updateMany(filter, { $set: { archived: false } });
      res.json({ ok: true, modified: result.modifiedCount });
      return;
    }
    if (body.action === 'priority') {
      const priority = body.value || 'medium';
      if (!['low', 'medium', 'high'].includes(priority)) {
        res.status(400).json({ error: 'Invalid priority' });
        return;
      }
      const result = await Application.updateMany(filter, { $set: { priority } });
      res.json({ ok: true, modified: result.modifiedCount });
      return;
    }
    if (body.action === 'status') {
      const status = body.value || '';
      if (!APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }
      const apps = await Application.find(filter);
      for (const app of apps) {
        if (app.status === status) continue;
        const fromStatus = app.status;
        app.status = status as typeof app.status;
        app.lastStatusAt = new Date();
        await app.save();
        await TimelineEvent.create({
          userId: req.user!.userId,
          applicationId: app._id,
          type: 'status_change',
          fromStatus,
          toStatus: status,
          message: `Bulk status → ${status}`,
        });
      }
      res.json({ ok: true, modified: apps.length });
      return;
    }
    res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0]?.message || 'Invalid input' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Bulk update failed' });
  }
});

router.get('/export.csv', async (req: AuthedRequest, res) => {
  const apps = await Application.find({
    userId: req.user!.userId,
    archived: { $ne: true },
  }).sort({ appliedAt: -1 });
  const header = [
    'company',
    'roleTitle',
    'location',
    'status',
    'source',
    'priority',
    'workplaceType',
    'employmentType',
    'salaryRange',
    'requiredSkills',
    'appliedAt',
    'jobUrl',
    'aiSummary',
    'notes',
  ];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = apps.map((a) =>
    [
      a.company,
      a.roleTitle,
      a.location,
      a.status,
      a.source,
      a.priority,
      a.workplaceType,
      a.employmentType,
      a.salaryRange,
      (a.requiredSkills || []).join('; '),
      a.appliedAt?.toISOString?.() || '',
      a.jobUrl,
      a.aiSummary,
      a.notes,
    ]
      .map(escape)
      .join(',')
  );
  const csv = [header.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="applications.csv"');
  res.send(csv);
});

router.get('/follow-ups', async (req: AuthedRequest, res) => {
  const now = new Date();
  const due = await Application.find({
    userId: req.user!.userId,
    archived: { $ne: true },
    status: { $in: ['applied', 'screening', 'interview'] },
    $or: [
      { followUpAt: { $lte: now } },
      {
        followUpAt: null,
        appliedAt: { $lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    ],
  })
    .sort({ appliedAt: 1 })
    .limit(50);
  res.json({ followUps: due });
});

router.get('/:id', async (req: AuthedRequest, res) => {
  const app = await Application.findOne({ _id: req.params.id, userId: req.user!.userId });
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }
  res.json({ application: app, groqConfigured: isGroqConfigured() });
});

router.get('/:id/timeline', async (req: AuthedRequest, res) => {
  const app = await Application.findOne({ _id: req.params.id, userId: req.user!.userId });
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }
  const events = await TimelineEvent.find({
    userId: req.user!.userId,
    applicationId: app._id,
  }).sort({ createdAt: -1 });
  res.json({ events });
});

router.post('/', async (req: AuthedRequest, res) => {
  try {
    const body = createSchema.parse(req.body);
    const fromExtension = req.headers['x-client'] === 'extension';
    const appliedAt = body.appliedAt || new Date();
    const followUpAt =
      body.followUpAt !== undefined
        ? body.followUpAt
        : new Date(appliedAt.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Duplicate detection: same jobUrl or same company+role (case-insensitive)
    if (!body.forceDuplicate) {
      const dupFilter: Record<string, unknown>[] = [];
      if (body.jobUrl) {
        dupFilter.push({ jobUrl: body.jobUrl });
      }
      dupFilter.push({
        company: new RegExp(`^${escapeRegex(body.company)}$`, 'i'),
        roleTitle: new RegExp(`^${escapeRegex(body.roleTitle)}$`, 'i'),
      });
      const existing = await Application.findOne({
        userId: req.user!.userId,
        archived: { $ne: true },
        $or: dupFilter,
      }).sort({ createdAt: -1 });
      if (existing) {
        res.status(409).json({
          error: 'Possible duplicate application',
          duplicate: true,
          existing: {
            id: existing._id,
            company: existing.company,
            roleTitle: existing.roleTitle,
            status: existing.status,
            jobUrl: existing.jobUrl,
            appliedAt: existing.appliedAt,
          },
          hint: 'Send forceDuplicate: true to save anyway',
        });
        return;
      }
    }

    let enriched = {
      company: body.company,
      roleTitle: body.roleTitle,
      location: body.location || '',
      salaryRange: body.salaryRange || '',
      jobDescription: body.jobDescription || '',
      employmentType: body.employmentType || '',
      workplaceType: body.workplaceType || '',
      experienceLevel: body.experienceLevel || '',
      requiredSkills: body.requiredSkills || [],
      preferredSkills: body.preferredSkills || [],
      tags: body.tags || [],
      aiSummary: '',
      responsibilities: '',
      requirements: '',
      benefits: '',
      companyDescription: '',
      companyIndustry: '',
      companySize: '',
      recruiterName: '',
      recruiterEmail: '',
      applicationDeadline: '',
    };

    let aiExtracted: Record<string, unknown> = {};
    let aiEnrichedAt: Date | null = null;

    if (body.enrichWithAi !== false && body.pageText && isGroqConfigured()) {
      try {
        const ai = await extractJobFromPageText({
          pageText: body.pageText,
          pageTitle: body.pageTitle,
          jobUrl: body.jobUrl,
          scraped: enriched,
        });
        if (ai) {
          enriched = mergeScrapedWithAi(enriched, ai);
          aiExtracted = ai as unknown as Record<string, unknown>;
          aiEnrichedAt = new Date();
        }
      } catch (err) {
        console.error('Groq enrich on create failed', err);
      }
    }

    const app = await Application.create({
      ...enriched,
      jobUrl: body.jobUrl || '',
      source: body.source,
      status: body.status,
      notes: body.notes || '',
      externalJobId: body.externalJobId || '',
      pageTitle: body.pageTitle || '',
      pageText: body.pageText || '',
      priority: body.priority || 'medium',
      userId: req.user!.userId,
      appliedAt,
      lastStatusAt: appliedAt,
      followUpAt,
      aiExtracted,
      aiEnrichedAt,
    });

    await TimelineEvent.create({
      userId: req.user!.userId,
      applicationId: app._id,
      type: fromExtension ? 'extension_capture' : 'created',
      toStatus: app.status,
      message: fromExtension
        ? `Captured from ${app.source}${aiEnrichedAt ? ' + AI enriched' : ''}`
        : `Application created with status ${app.status}`,
      rawMeta: {
        source: app.source,
        jobUrl: app.jobUrl,
        aiEnriched: Boolean(aiEnrichedAt),
      },
    });

    // Auto match score if resume text exists
    try {
      const user = await User.findById(req.user!.userId);
      const resumeText = user?.profile?.resumeText || '';
      if (isGroqConfigured() && (resumeText.length > 40 || (user?.profile?.skills || []).length)) {
        const match = await matchResumeToJd({
          resumeText,
          skills: user?.profile?.skills || [],
          experienceYears: user?.profile?.experienceYears || 0,
          preferredRoles: user?.profile?.preferredRoles || [],
          jobDescription: app.jobDescription || app.pageText || '',
          roleTitle: app.roleTitle,
          company: app.company,
          requiredSkills: app.requiredSkills || [],
        });
        if (match) {
          app.matchScore = match.score;
          app.matchDetails = match as unknown as Record<string, unknown>;
          app.matchComputedAt = new Date();
          await app.save();
        }
      }
    } catch (err) {
      console.error('Auto match score failed', err);
    }

    res.status(201).json({
      application: app,
      aiEnriched: Boolean(aiEnrichedAt),
      groqConfigured: isGroqConfigured(),
      matchScore: app.matchScore ?? null,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0]?.message || 'Invalid input' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.post('/:id/match', async (req: AuthedRequest, res) => {
  try {
    if (!isGroqConfigured()) {
      res.status(503).json({ error: 'GROQ_API_KEY is not set on the server.' });
      return;
    }
    const app = await Application.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const resumeText = user.profile?.resumeText || '';
    if (resumeText.trim().length < 40 && !(user.profile?.skills || []).length) {
      res.status(400).json({
        error: 'Add resume text (or skills) on your Profile page before matching.',
      });
      return;
    }
    const match = await matchResumeToJd({
      resumeText,
      skills: user.profile?.skills || [],
      experienceYears: user.profile?.experienceYears || 0,
      preferredRoles: user.profile?.preferredRoles || [],
      jobDescription:
        app.jobDescription ||
        app.requirements ||
        app.responsibilities ||
        app.pageText ||
        '',
      roleTitle: app.roleTitle,
      company: app.company,
      requiredSkills: app.requiredSkills || [],
    });
    if (!match) {
      res.status(502).json({ error: 'Could not compute match score' });
      return;
    }
    app.matchScore = match.score;
    app.matchDetails = match as unknown as Record<string, unknown>;
    app.matchComputedAt = new Date();
    await app.save();
    await TimelineEvent.create({
      userId: req.user!.userId,
      applicationId: app._id,
      type: 'note',
      message: `Resume↔JD match score: ${match.score}/100`,
      rawMeta: { score: match.score },
    });
    res.json({ application: app, match });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Match failed',
    });
  }
});

router.post('/:id/enrich', async (req: AuthedRequest, res) => {
  try {
    if (!isGroqConfigured()) {
      res.status(503).json({
        error: 'GROQ_API_KEY is not set on the server. Add it to server/.env and restart.',
      });
      return;
    }
    const app = await Application.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    const pageText =
      String(req.body?.pageText || app.pageText || app.jobDescription || '').trim();
    if (pageText.length < 40) {
      res.status(400).json({
        error: 'Not enough page text to enrich. Re-save from the extension on the job page.',
      });
      return;
    }

    const scraped = {
      company: app.company,
      roleTitle: app.roleTitle,
      location: app.location || '',
      salaryRange: app.salaryRange || '',
      jobDescription: app.jobDescription || '',
      employmentType: app.employmentType || '',
      workplaceType: app.workplaceType || '',
      experienceLevel: app.experienceLevel || '',
      requiredSkills: app.requiredSkills || [],
      preferredSkills: app.preferredSkills || [],
      tags: app.tags || [],
    };

    const ai = await extractJobFromPageText({
      pageText,
      pageTitle: app.pageTitle,
      jobUrl: app.jobUrl,
      scraped,
    });
    if (!ai) {
      res.status(502).json({ error: 'AI returned no usable data' });
      return;
    }

    const merged = mergeScrapedWithAi(scraped, ai);
    Object.assign(app, merged);
    if (req.body?.pageText) app.pageText = String(req.body.pageText).slice(0, 60000);
    app.aiExtracted = ai as unknown as Record<string, unknown>;
    app.aiEnrichedAt = new Date();
    await app.save();

    await TimelineEvent.create({
      userId: req.user!.userId,
      applicationId: app._id,
      type: 'note',
      message: 'AI enriched job details via Groq',
      rawMeta: { tags: ai.tags },
    });

    res.json({ application: app, aiEnriched: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Enrichment failed',
    });
  }
});

router.put('/:id', async (req: AuthedRequest, res) => {
  try {
    const body = updateSchema.parse(req.body);
    const app = await Application.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    const prevStatus = app.status;
    Object.assign(app, body);
    if (body.status && body.status !== prevStatus) {
      app.lastStatusAt = new Date();
      await TimelineEvent.create({
        userId: req.user!.userId,
        applicationId: app._id,
        type: 'status_change',
        fromStatus: prevStatus,
        toStatus: body.status,
        message: `Status changed to ${body.status}`,
      });
    }
    await app.save();
    res.json({ application: app });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0]?.message || 'Invalid input' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

router.patch('/:id/status', async (req: AuthedRequest, res) => {
  try {
    const body = statusSchema.parse(req.body);
    const app = await Application.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    const fromStatus = app.status;
    if (fromStatus === body.status) {
      res.json({ application: app });
      return;
    }
    app.status = body.status;
    app.lastStatusAt = new Date();
    await app.save();
    await TimelineEvent.create({
      userId: req.user!.userId,
      applicationId: app._id,
      type: 'status_change',
      fromStatus,
      toStatus: body.status,
      message: body.message || `Status changed to ${body.status}`,
    });
    res.json({ application: app });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0]?.message || 'Invalid input' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.post('/:id/notes', async (req: AuthedRequest, res) => {
  const message = String(req.body?.message || '').trim();
  if (!message) {
    res.status(400).json({ error: 'message is required' });
    return;
  }
  const app = await Application.findOne({ _id: req.params.id, userId: req.user!.userId });
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }
  app.notes = app.notes ? `${app.notes}\n\n${message}` : message;
  await app.save();
  const event = await TimelineEvent.create({
    userId: req.user!.userId,
    applicationId: app._id,
    type: 'note',
    message,
  });
  res.status(201).json({ application: app, event });
});

router.delete('/:id', async (req: AuthedRequest, res) => {
  const app = await Application.findOneAndDelete({
    _id: req.params.id,
    userId: req.user!.userId,
  });
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }
  await TimelineEvent.deleteMany({ applicationId: app._id, userId: req.user!.userId });
  res.json({ ok: true });
});

export default router;
