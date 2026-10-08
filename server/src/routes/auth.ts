import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { describeMongoError, isDbReady } from '../config/db.js';
import { User } from '../models/User.js';
import { requireAuth, signToken, type AuthedRequest } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  // Avoid crashes when trust proxy + local requests interact with rate-limit validation
  validate: { trustProxy: false, xForwardedForHeader: false },
  message: { error: 'Too many auth attempts, try again later' },
});

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

router.post('/register', authLimiter, async (req, res) => {
  try {
    if (!isDbReady()) {
      res.status(503).json({
        error:
          'Database unavailable. Check MongoDB Atlas Network Access (IP whitelist) and server/.env MONGODB_URI.',
      });
      return;
    }
    const body = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: body.email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash,
    });
    const token = signToken({ userId: String(user._id), email: user.email });
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issue = err.issues?.[0] || err.errors?.[0];
      res.status(400).json({
        error: issue?.message || 'Invalid input (name, email, password min 8 chars)',
      });
      return;
    }
    // Duplicate key race (unique email index)
    if ((err as { code?: number })?.code === 11000) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    console.error(err);
    const raw = err instanceof Error ? err.message : String(err);
    const friendly = describeMongoError(err);
    res.status(500).json({
      error:
        friendly !== raw
          ? `Registration failed: ${friendly}`
          : 'Registration failed',
    });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const token = signToken({ userId: String(user._id), email: user.email });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issue = err.issues?.[0] || err.errors?.[0];
      res.status(400).json({
        error: issue?.message || 'Invalid input (name, email, password min 8 chars)',
      });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await User.findById(req.user!.userId).select('-passwordHash');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profile: user.profile,
    },
  });
});

router.post('/change-password', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const body = passwordSchema.parse(req.body);
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const ok = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }
    user.passwordHash = await bcrypt.hash(body.newPassword, 12);
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issue = err.issues?.[0] || err.errors?.[0];
      res.status(400).json({
        error: issue?.message || 'Invalid input (name, email, password min 8 chars)',
      });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Password change failed' });
  }
});

export default router;
