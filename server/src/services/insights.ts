import type { UserDoc } from '../models/User.js';
import { Application } from '../models/Application.js';

export type Tip = { id: string; title: string; detail: string; severity: 'info' | 'warn' };

export async function buildImprovementTips(user: UserDoc): Promise<Tip[]> {
  const tips: Tip[] = [];
  const profile = user.profile || {
    skills: [],
    preferredRoles: [],
    preferredLocations: [],
    experienceYears: 0,
    resumeUrl: '',
  };

  if (!profile.skills?.length) {
    tips.push({
      id: 'skills',
      title: 'Add your skills',
      detail: 'A complete skills list helps match saved job descriptions and suggestion tips.',
      severity: 'warn',
    });
  }
  if (!profile.preferredRoles?.length) {
    tips.push({
      id: 'roles',
      title: 'Set target roles',
      detail: 'Tell WhereMyApplication which roles you want so wishlist and suggestions stay focused.',
      severity: 'warn',
    });
  }
  if (!profile.resumeUrl) {
    tips.push({
      id: 'resume',
      title: 'Link your resume',
      detail: 'Store a resume URL in your profile for quick reference while applying.',
      severity: 'info',
    });
  }

  const apps = await Application.find({ userId: user._id }).select('status jobDescription company');
  const total = apps.length;
  const rejected = apps.filter((a) => a.status === 'rejected').length;
  if (total >= 5 && rejected / total >= 0.5) {
    tips.push({
      id: 'rejection-rate',
      title: 'High rejection rate',
      detail: `${rejected} of ${total} applications were rejected. Review job descriptions vs your skills and tighten targeting.`,
      severity: 'warn',
    });
  }

  const skillSet = new Set((profile.skills || []).map((s) => s.toLowerCase()));
  if (skillSet.size) {
    const missingCounts = new Map<string, number>();
    for (const app of apps) {
      const jd = (app.jobDescription || '').toLowerCase();
      if (!jd) continue;
      for (const skill of skillSet) {
        if (!jd.includes(skill)) {
          missingCounts.set(skill, (missingCounts.get(skill) || 0) + 1);
        }
      }
    }
    const rarelyMatched = [...missingCounts.entries()]
      .filter(([, count]) => count >= Math.max(2, Math.floor(total * 0.4)))
      .map(([skill]) => skill)
      .slice(0, 5);
    if (rarelyMatched.length) {
      tips.push({
        id: 'skill-gap',
        title: 'Skills rarely mentioned in your JDs',
        detail: `These profile skills rarely appear in saved job descriptions: ${rarelyMatched.join(', ')}. Consider roles that use them or update your profile.`,
        severity: 'info',
      });
    }
  }

  const interviews = apps.filter((a) => a.status === 'interview' || a.status === 'offer').length;
  if (total >= 3 && interviews === 0) {
    tips.push({
      id: 'no-interviews',
      title: 'No interviews yet',
      detail: 'Try following up after 7 days, tailor your resume to each JD, and use the extension to save full descriptions.',
      severity: 'info',
    });
  }

  return tips;
}

export async function buildWhereToApply(user: UserDoc) {
  const wishlist = await Application.find({
    userId: user._id,
    status: 'wishlist',
  })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('company roleTitle location jobUrl source');

  const roles = user.profile?.preferredRoles || [];
  const locations = user.profile?.preferredLocations || [];

  return {
    wishlist,
    suggestedSearches: roles.map((role) => ({
      role,
      locations,
      linkedInUrl: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}`,
      indeedUrl: `https://www.indeed.com/jobs?q=${encodeURIComponent(role)}`,
      naukriUrl: `https://www.naukri.com/${encodeURIComponent(role.replace(/\s+/g, '-'))}-jobs`,
    })),
  };
}
