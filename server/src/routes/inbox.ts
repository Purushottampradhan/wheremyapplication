import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { User, type InboxProvider } from '../models/User.js';
import { encryptSecret, decryptSecret } from '../services/inboxCrypto.js';
import { INBOX_PRESETS, InboxError, syncUserInbox, verifyMailbox } from '../services/inboxSync.js';

const router = Router();
router.use(requireAuth);

const inboxLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
  message: { error: 'Too many mailbox checks. Wait a few minutes and try again.' },
});

const connectSchema = z.object({
  provider: z.enum(['gmail', 'outlook', 'yahoo', 'imap']),
  email: z.string().trim().email().max(200),
  appPassword: z.string().max(200).optional().default(''),
  host: z.string().trim().max(200).optional().default(''),
  port: z.coerce.number().int().min(1).max(65535).optional(),
});

function publicInbox(user: { inbox?: { provider?: string; email?: string; passwordEnc?: string; host?: string; port?: number; lastSyncAt?: Date | null } }) {
  const inbox = user.inbox;
  const connected = Boolean(inbox?.passwordEnc && inbox.email);
  return {
    connected,
    provider: (inbox?.provider || 'gmail') as InboxProvider,
    email: connected ? inbox?.email || '' : '',
    host: connected ? inbox?.host || '' : '',
    port: inbox?.port || 993,
    lastSyncAt: inbox?.lastSyncAt || null,
  };
}

function mailboxTarget(provider: InboxProvider, host: string, port?: number) {
  if (provider === 'imap') {
    const cleanHost = host.trim().toLowerCase();
    if (!cleanHost || !/^[a-z0-9.-]+$/.test(cleanHost)) {
      throw new InboxError('Enter the IMAP hostname, such as imap.example.com.');
    }
    return { host: cleanHost, port: port || 993 };
  }
  return INBOX_PRESETS[provider];
}

router.get('/', async (req: AuthedRequest, res) => {
  const user = await User.findById(req.user!.userId).select('inbox');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ inbox: publicInbox(user) });
});

router.put('/', inboxLimiter, async (req: AuthedRequest, res) => {
  try {
    const body = connectSchema.parse(req.body);
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const target = mailboxTarget(body.provider, body.host, body.port);
    const password = body.appPassword.replace(/\s+/g, '');
    const previous = user.inbox;
    const sameMailbox = previous?.email === body.email.toLowerCase() && previous.host === target.host;
    let passwordEnc = previous?.passwordEnc || '';
    if (password) {
      await verifyMailbox(target.host, target.port, body.email, password);
      passwordEnc = encryptSecret(password);
    } else if (!passwordEnc || !sameMailbox) {
      throw new InboxError('Enter the app password for this mailbox.');
    } else {
      await verifyMailbox(target.host, target.port, body.email, decryptSecret(passwordEnc));
    }
    const emailChanged = previous?.email && previous.email !== body.email.toLowerCase();
    user.inbox = {
      provider: body.provider,
      email: body.email.toLowerCase(),
      passwordEnc,
      host: target.host,
      port: target.port,
      lastSyncAt: emailChanged ? null : previous?.lastSyncAt || null,
      seenMessageIds: emailChanged ? [] : previous?.seenMessageIds || [],
    };
    user.markModified('inbox');
    await user.save();
    res.json({ inbox: publicInbox(user) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0]?.message || 'Invalid mailbox details' });
      return;
    }
    if (err instanceof InboxError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Inbox connect failed');
    res.status(500).json({ error: 'Could not save the mailbox connection.' });
  }
});

router.delete('/', async (req: AuthedRequest, res) => {
  const user = await User.findById(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  user.inbox = {
    provider: 'gmail',
    email: '',
    passwordEnc: '',
    host: '',
    port: 993,
    lastSyncAt: null,
    seenMessageIds: [],
  };
  user.markModified('inbox');
  await user.save();
  res.json({ inbox: publicInbox(user) });
});

router.post('/sync', inboxLimiter, async (req: AuthedRequest, res) => {
  try {
    const result = await syncUserInbox(req.user!.userId);
    res.json(result);
  } catch (err) {
    if (err instanceof InboxError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Inbox sync failed');
    res.status(500).json({ error: 'Could not check the mailbox.' });
  }
});

export default router;
