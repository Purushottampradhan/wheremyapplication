import { Application } from '../models/Application.js';

/** Parse rough mid salary from strings like "$120k-$150k", "15-20 LPA", "120000". */
export function parseSalaryMid(raw: string): number | null {
  if (!raw) return null;
  const s = raw.toLowerCase().replace(/,/g, '');
  const lpa = s.match(/(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*lpa/);
  if (lpa) {
    const a = Number(lpa[1]);
    const b = Number(lpa[2]);
    return ((a + b) / 2) * 100000; // INR rough
  }
  const singleLpa = s.match(/(\d+(?:\.\d+)?)\s*lpa/);
  if (singleLpa) return Number(singleLpa[1]) * 100000;

  const kRange = s.match(/\$?\s*(\d+(?:\.\d+)?)\s*k\s*[-–to]+\s*\$?\s*(\d+(?:\.\d+)?)\s*k/);
  if (kRange) {
    return ((Number(kRange[1]) + Number(kRange[2])) / 2) * 1000;
  }
  const singleK = s.match(/\$?\s*(\d+(?:\.\d+)?)\s*k\b/);
  if (singleK) return Number(singleK[1]) * 1000;

  const nums = s.match(/(\d{4,7})/g);
  if (nums && nums.length >= 2) {
    return (Number(nums[0]) + Number(nums[1])) / 2;
  }
  if (nums && nums.length === 1) return Number(nums[0]);
  return null;
}

export async function buildSalaryInsights(userId: string) {
  const apps = await Application.find({
    userId,
    archived: { $ne: true },
    salaryRange: { $nin: ['', null] },
  })
    .select('company roleTitle location salaryRange workplaceType status appliedAt')
    .sort({ appliedAt: -1 })
    .limit(200);

  const withMid = apps
    .map((a) => ({
      id: String(a._id),
      company: a.company,
      roleTitle: a.roleTitle,
      location: a.location || '',
      salaryRange: a.salaryRange || '',
      mid: parseSalaryMid(a.salaryRange || ''),
      workplaceType: a.workplaceType || '',
      status: a.status,
    }))
    .filter((a) => a.mid != null) as Array<{
    id: string;
    company: string;
    roleTitle: string;
    location: string;
    salaryRange: string;
    mid: number;
    workplaceType: string;
    status: string;
  }>;

  const mids = withMid.map((a) => a.mid).sort((a, b) => a - b);
  const avg = mids.length
    ? Math.round(mids.reduce((s, n) => s + n, 0) / mids.length)
    : null;
  const median = mids.length
    ? mids[Math.floor(mids.length / 2)]
    : null;

  const byRole = new Map<string, number[]>();
  for (const a of withMid) {
    const key = a.roleTitle.toLowerCase().slice(0, 60);
    if (!byRole.has(key)) byRole.set(key, []);
    byRole.get(key)!.push(a.mid);
  }
  const roleAverages = [...byRole.entries()]
    .map(([role, vals]) => ({
      role,
      count: vals.length,
      average: Math.round(vals.reduce((s, n) => s + n, 0) / vals.length),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // External comparison links (user opens these sites — we don't scrape them)
  const sampleRole = apps[0]?.roleTitle || 'software engineer';
  const sampleLoc = apps[0]?.location || '';
  const q = encodeURIComponent(sampleRole);
  const locQ = encodeURIComponent(sampleLoc || 'remote');

  return {
    counted: withMid.length,
    average: avg,
    median,
    roleAverages,
    recentWithSalary: withMid.slice(0, 12),
    externalLinks: [
      {
        name: 'Levels.fyi',
        url: `https://www.levels.fyi/t/${encodeURIComponent(sampleRole.replace(/\s+/g, '-').toLowerCase())}`,
      },
      {
        name: 'Glassdoor salaries',
        url: `https://www.glassdoor.com/Salaries/index.htm?autocomplete=${q}`,
      },
      {
        name: 'Indeed salary',
        url: `https://www.indeed.com/career/${q}/salaries?location=${locQ}`,
      },
      {
        name: 'AmbitionBox',
        url: `https://www.ambitionbox.com/salaries`,
      },
    ],
    note: 'Averages come from salaries saved/enriched in your apps. External links open comparison sites (not scraped).',
  };
}
