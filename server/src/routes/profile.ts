import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { buildImprovementTips, buildWhereToApply } from '../services/insights.js';

const router = Router();
router.use(requireAuth);

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(100).optional(),
  preferredRoles: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  preferredLocations: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  experienceYears: z.number().min(0).max(60).optional(),
  resumeUrl: z.string().trim().max(2000).optional(),
  resumeText: z.string().max(50000).optional(),
});

router.get('/', async (req: AuthedRequest, res) => {
  const user = await User.findById(req.user!.userId).select('-passwordHash');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({
    name: user.name,
    email: user.email,
    profile: user.profile,
  });
});

router.put('/', async (req: AuthedRequest, res) => {
  try {
    const body = profileSchema.parse(req.body);
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (body.name) user.name = body.name;
    user.profile = {
      skills: body.skills ?? user.profile?.skills ?? [],
      preferredRoles: body.preferredRoles ?? user.profile?.preferredRoles ?? [],
      preferredLocations:
        body.preferredLocations ?? user.profile?.preferredLocations ?? [],
      experienceYears: body.experienceYears ?? user.profile?.experienceYears ?? 0,
      resumeUrl: body.resumeUrl ?? user.profile?.resumeUrl ?? '',
      resumeText: body.resumeText ?? user.profile?.resumeText ?? '',
    };
    await user.save();
    res.json({
      name: user.name,
      email: user.email,
      profile: user.profile,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0]?.message || 'Invalid input' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/insights', async (req: AuthedRequest, res) => {
  const user = await User.findById(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const [tips, whereToApply] = await Promise.all([
    buildImprovementTips(user),
    buildWhereToApply(user),
  ]);
  res.json({ tips, whereToApply });
});

export default router;
