import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { Application } from '../models/Application.js';
import { TimelineEvent } from '../models/TimelineEvent.js';
import { User } from '../models/User.js';
import type { InboxProvider } from '../models/User.js';
import { decryptSecret } from './inboxCrypto.js';
import { canAdvance, classifyMail, matchApplication, type MailMessage } from './inboxMatch.js';

export class InboxError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const INBOX_PRESETS: Record<Exclude<InboxProvider, 'imap'>, { host: string; port: number }> = {
  gmail: { host: 'imap.gmail.com', port: 993 },
  outlook: { host: 'outlook.office365.com', port: 993 },
  yahoo: { host: 'imap.mail.yahoo.com', port: 993 },
};

function friendlyImapError(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: unknown }).code || '') : '';
  const authenticationFailed =
    typeof err === 'object' && err != null && 'authenticationFailed' in err && Boolean((err as { authenticationFailed?: boolean }).authenticationFailed);
  const blob = `${message} ${code}`;
  if (authenticationFailed || /auth|invalid credentials|login failed/i.test(blob)) {
    return 'The mailbox rejected this sign-in. For Gmail, turn on IMAP and use an app password, not your normal password.';
  }
  if (/timeout|timed out|ENOTFOUND|ECONNREFUSED|EAI_AGAIN/i.test(blob)) {
    return 'Could not reach the mail server. Check the provider and that IMAP is enabled.';
  }
  return 'Could not read the mailbox. Check the address, app password, and IMAP setting.';
}

function clientFor(host: string, port: number, email: string, password: string, verifyOnly = false) {
  return new ImapFlow({
    host,
    port,
    secure: true,
    auth: { user: email, pass: password },
    logger: false,
    verifyOnly,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

export async function verifyMailbox(host: string, port: number, email: string, password: string) {
  const client = clientFor(host, port, email, password, true);
  try {
    await client.connect();
  } catch (err) {
    throw new InboxError(friendlyImapError(err));
  } finally {
    if (!client.isClosed) await client.logout().catch(() => undefined);
  }
}

async function readRecentMail(host: string, port: number, email: string, password: string): Promise<MailMessage[]> {
  const client = clientFor(host, port, email, password);
  const messages: MailMessage[] = [];
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const since = new Date();
      since.setDate(since.getDate() - 21);
      const uids = await client.search({ since });
      const list = Array.isArray(uids) ? uids.slice(-30) : [];
      if (list.length === 0) return messages;
      for await (const msg of client.fetch(list, { uid: true, envelope: true, source: true }, { uid: true })) {
        const parsed = msg.source ? await simpleParser(msg.source) : null;
        const from = msg.envelope?.from?.[0];
        const text = typeof parsed?.text === 'string' ? parsed.text.slice(0, 4000) : '';
        messages.push({
          id: msg.envelope?.messageId || `uid:${msg.uid}`,
          subject: msg.envelope?.subject || parsed?.subject || '',
          fromAddress: from?.address || parsed?.from?.value?.[0]?.address || '',
          fromName: from?.name || parsed?.from?.value?.[0]?.name || '',
          text,
        });
      }
    } finally {
      lock.release();
    }
  } catch (err) {
    if (err instanceof InboxError) throw err;
    throw new InboxError(friendlyImapError(err));
  } finally {
    if (!client.isClosed) await client.logout().catch(() => undefined);
  }
  return messages;
}

export async function syncUserInbox(userId: string) {
  const user = await User.findById(userId);
  if (!user?.inbox?.passwordEnc || !user.inbox.email || !user.inbox.host) {
    throw new InboxError('Connect a mailbox in Settings first.');
  }
  let password = '';
  try {
    password = decryptSecret(user.inbox.passwordEnc);
  } catch {
    throw new InboxError('The saved mailbox secret could not be read. Connect the mailbox again.');
  }
  const mail = await readRecentMail(user.inbox.host, user.inbox.port || 993, user.inbox.email, password);
  const apps = await Application.find({ userId, archived: { $ne: true } });
  const seen = new Set(user.inbox.seenMessageIds || []);
  const updated: Array<{
    applicationId: string;
    company: string;
    roleTitle: string;
    fromStatus: string;
    toStatus: string;
    subject: string;
  }> = [];
  let unchanged = 0;
  let unmatched = 0;
  let ambiguous = 0;

  for (const message of mail) {
    if (!message.id || seen.has(message.id)) continue;
    const match = matchApplication(apps, message);
    if (match.kind !== 'one') {
      if (match.kind === 'ambiguous') ambiguous += 1;
      else unmatched += 1;
      continue;
    }
    const app = match.app;
    seen.add(message.id);
    const next = classifyMail(`${message.subject}\n${message.text}`);
    const current = app.status;
    if (!next || !canAdvance(current, next)) {
      unchanged += 1;
      continue;
    }
    const fromStatus = current || 'applied';
    app.status = next;
    app.lastStatusAt = new Date();
    await app.save();
    await TimelineEvent.create({
      userId,
      applicationId: app._id,
      type: 'status_change',
      fromStatus,
      toStatus: next,
      message: `Inbox: ${message.subject || 'Job email'} → ${next}`,
      rawMeta: { source: 'inbox', from: message.fromAddress, subject: message.subject },
    });
    updated.push({
      applicationId: String(app._id),
      company: app.company,
      roleTitle: app.roleTitle,
      fromStatus,
      toStatus: next,
      subject: message.subject,
    });
  }

  user.inbox.seenMessageIds = [...seen].slice(-400);
  user.inbox.lastSyncAt = new Date();
  user.markModified('inbox');
  await user.save();

  return {
    checked: mail.length,
    updated,
    unchanged,
    unmatched,
    ambiguous,
    lastSyncAt: user.inbox.lastSyncAt,
  };
}
