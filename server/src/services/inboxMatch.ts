import type { ApplicationStatus } from '../utils/constants.js';

export type MailStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';

export type MailMessage = {
  id: string;
  subject: string;
  fromAddress: string;
  fromName: string;
  text: string;
};

export type MatchApp = {
  _id: { toString(): string };
  company: string;
  roleTitle: string;
  recruiterEmail?: string;
  status?: ApplicationStatus;
};

const RANK: Record<string, number> = {
  wishlist: 0,
  applied: 1,
  screening: 2,
  interview: 3,
  offer: 4,
};

export function classifyMail(text: string): MailStatus | null {
  const value = text.toLowerCase();
  if (
    /unable to offer|not be offering|cannot offer|unfortunately|not moving forward|not be moving forward|other candidates|not selected|regret to inform|decided not to|application was unsuccessful|will not be proceeding|position has been filled|we regret/.test(
      value
    )
  ) {
    return 'rejected';
  }
  if (/offer letter|pleased to offer|like to offer you|offer of employment|job offer|congratulations[^\n]{0,48}offer/.test(value)) {
    return 'offer';
  }
  if (
    /interview invitation|invite you to (an? )?(interview|call|chat)|schedule a (call|chat|interview)|phone screen|coding (challenge|round|interview)|your availability for/.test(
      value
    )
  ) {
    return 'interview';
  }
  if (/under review|recruiter screen|screening call|next steps/.test(value)) return 'screening';
  if (/application received|thank you for applying|we have received your application|thanks for applying/.test(value)) {
    return 'applied';
  }
  return null;
}

export function canAdvance(current: ApplicationStatus | undefined, next: MailStatus): boolean {
  if (!current || current === 'withdrawn' || current === 'rejected' || current === 'offer') return false;
  if (next === 'rejected') return current !== 'wishlist';
  const nextRank = RANK[next];
  const currentRank = RANK[current];
  if (nextRank == null || currentRank == null) return false;
  return nextRank > currentRank;
}

function norm(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(inc|llc|ltd|limited|pvt|private|corp|corporation|co|company|technologies|technology|labs|lab)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasPhrase(haystack: string, phrase: string) {
  if (phrase.length < 3) return false;
  return haystack.split(' ').join(' ').includes(phrase);
}

export function matchApplication<T extends MatchApp>(apps: T[], message: MailMessage): { kind: 'none' | 'ambiguous' } | { kind: 'one'; app: T } {
  const blob = norm(`${message.subject} ${message.fromName} ${message.fromAddress} ${message.text.slice(0, 1800)}`);
  const from = message.fromAddress.trim().toLowerCase();
  const byRecruiter = from
    ? apps.filter((app) => (app.recruiterEmail || '').trim().toLowerCase() === from)
    : [];
  if (byRecruiter.length === 1) return { kind: 'one', app: byRecruiter[0] };
  if (byRecruiter.length > 1) return { kind: 'ambiguous' };

  const companyHits = apps.filter((app) => {
    const company = norm(app.company);
    return company.length >= 3 && hasPhrase(blob, company);
  });
  if (companyHits.length === 0) return { kind: 'none' };
  if (companyHits.length === 1) return { kind: 'one', app: companyHits[0] };

  const roleHits = companyHits.filter((app) => {
    const role = norm(app.roleTitle);
    return role.length >= 8 && hasPhrase(blob, role);
  });
  if (roleHits.length === 1) return { kind: 'one', app: roleHits[0] };
  return { kind: 'ambiguous' };
}
