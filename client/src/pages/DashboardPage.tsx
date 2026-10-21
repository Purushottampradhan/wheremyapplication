import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Columns3,
  Plus,
  ScanSearch,
  Send,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { ActivityChart, ChartList, DonutChart, STATUS_COLOR, WORK_COLOR } from '../components/charts';
import { CountUp, EmptyState } from '../components/visuals';
import { useAuth } from '../context/AuthContext';
import type { Application, ApplicationStatus } from '../types';
import { SOURCE_LABELS, STATUS_LABELS, type ApplicationSource } from '../types';

type Stats = {
  counts: Record<ApplicationStatus, number>;
  total: number;
  totalActive: number;
  thisWeek: number;
  thisMonth: number;
  recent: Application[];
  bySource: Array<{ source: string; count: number }>;
  byCompany: Array<{ company: string; count: number }>;
  byWorkplace: Array<{ workplace: string; count: number }>;
  funnel: {
    interviewRate: number;
    offerRate: number;
    rejectionRate: number;
    wishlist: number;
    applied: number;
    screening: number;
    interview: number;
    offer: number;
    rejected: number;
  };
  topSkills: Array<{ skill: string; count: number }>;
  enrichedCount: number;
  enrichmentCoverage: number;
  monthlyTrend: Array<{ label: string; count: number }>;
  groqConfigured: boolean;
  salaryInsights?: {
    counted: number;
    average: number | null;
    median: number | null;
    roleAverages: Array<{ role: string; count: number; average: number }>;
    recentWithSalary: Array<{
      id: string;
      company: string;
      roleTitle: string;
      salaryRange: string;
      mid: number;
    }>;
    externalLinks: Array<{ name: string; url: string }>;
    note: string;
  };
};

type Insights = {
  tips: Array<{ id: string; title: string; detail: string; severity: string }>;
  whereToApply: {
    wishlist: Application[];
    suggestedSearches: Array<{
      role: string;
      locations: string[];
      linkedInUrl: string;
      indeedUrl: string;
      naukriUrl: string;
    }>;
  };
};

type FollowUps = { followUps: Application[] };
type SalaryRow = NonNullable<Stats['salaryInsights']>['recentWithSalary'][number];
type Unit = 'INR' | 'USD' | 'unspecified';

const SOURCE_ORDER: ApplicationSource[] = ['linkedin', 'indeed', 'naukri', 'career_site', 'manual', 'other'];
const SOURCE_COLOR: Record<string, string> = {
  linkedin: '#0a66c2',
  indeed: '#2557d6',
  naukri: '#6d28d9',
  career_site: '#0f766e',
  manual: '#d97706',
  other: '#64748b',
};
const PIPELINE: ApplicationStatus[] = ['wishlist', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'];
const FUNNEL: Array<{ key: 'applied' | 'screening' | 'interview' | 'offer'; label: string }> = [
  { key: 'applied', label: 'Applied' },
  { key: 'screening', label: 'Screening' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
];

function sourceLabel(source: string) {
  return SOURCE_LABELS[source as ApplicationSource] || source;
}

function monthSeries(trend: Array<{ label: string; count: number }>) {
  const map = new Map(trend.map((item) => [item.label, item.count]));
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return {
      label,
      name: date.toLocaleString(undefined, { month: 'short' }),
      count: map.get(label) || 0,
    };
  });
}

function workplaceBucket(name: string) {
  const value = name.trim().toLowerCase();
  if (!value || value === 'unknown') return 'Unknown';
  if (value.includes('hybrid')) return 'Hybrid';
  if (value.includes('remote')) return 'Remote';
  if (value.includes('on-site') || value.includes('onsite') || value.includes('on site')) return 'On-site';
  return name.trim();
}

function salaryUnit(range: string): Unit {
  const value = range.toLowerCase();
  if (/lpa|₹|inr|\blac\b|\blakh/.test(value)) return 'INR';
  if (/\$|usd|\bk\b/.test(value)) return 'USD';
  return 'unspecified';
}

function formatMid(unit: Unit, mid: number) {
  if (unit === 'INR') return `₹${mid.toLocaleString('en-IN')}`;
  if (unit === 'USD') return `$${mid.toLocaleString('en-US')}`;
  return mid.toLocaleString();
}

function medianOf(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function localKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function heatmap(apps: Application[]) {
  const counts = new Map<string, number>();
  for (const app of apps) {
    const date = new Date(app.appliedAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = localKey(date);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 11 * 7);
  const weeks = Array.from({ length: 12 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = new Date(start);
      date.setDate(start.getDate() + week * 7 + day);
      const key = localKey(date);
      return { date, key, count: counts.get(key) || 0, future: date > today };
    })
  );
  const max = Math.max(1, ...weeks.flat().filter((cell) => !cell.future).map((cell) => cell.count));
  return { weeks, max };
}

function heatLevel(count: number, max: number) {
  if (count <= 0) return 0;
  const ratio = count / max;
  if (ratio < 0.34) return 1;
  if (ratio < 0.67) return 2;
  if (ratio < 1) return 3;
  return 4;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [followUps, setFollowUps] = useState<Application[]>([]);
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api<Stats>('/api/dashboard/stats'),
      api<Insights>('/api/profile/insights'),
      api<FollowUps>('/api/applications/follow-ups'),
      api<{ applications: Application[] }>('/api/applications?sort=appliedAt'),
    ])
      .then(([nextStats, nextInsights, nextFollowUps, nextApps]) => {
        setStats(nextStats);
        setInsights(nextInsights);
        setFollowUps(nextFollowUps.followUps);
        setApps(nextApps.applications);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, []);

  const months = useMemo(() => (stats ? monthSeries(stats.monthlyTrend) : []), [stats]);
  const heat = useMemo(() => (apps ? heatmap(apps) : null), [apps]);

  if (error) return <p className="banner error">{error}</p>;
  if (!stats || !insights) {
    return (
      <div className="page wide">
        <p className="muted">Loading dashboard…</p>
        <div className="skeleton-grid" aria-hidden="true">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'there';
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const pipelineCounts = PIPELINE.map((status) => ({
    name: STATUS_LABELS[status],
    count: stats.counts[status] || 0,
    fill: STATUS_COLOR[status],
  })).filter((item) => item.count > 0);
  const sourceCounts: Array<{ key: string; name: string; count: number }> = SOURCE_ORDER.map((source) => ({
    key: source,
    name: SOURCE_LABELS[source],
    count: stats.bySource.find((item) => item.source === source)?.count || 0,
  }));
  for (const item of stats.bySource) {
    if (!SOURCE_ORDER.includes(item.source as ApplicationSource)) {
      sourceCounts.push({ key: item.source, name: sourceLabel(item.source), count: item.count });
    }
  }
  const sourceMax = Math.max(1, ...sourceCounts.map((row) => row.count));
  const workplaceMap = new Map<string, number>();
  for (const item of stats.byWorkplace) {
    const bucket = workplaceBucket(item.workplace);
    workplaceMap.set(bucket, (workplaceMap.get(bucket) || 0) + item.count);
  }
  const workplace = [...workplaceMap.entries()].map(([name, count]) => ({
    name,
    count,
    fill: WORK_COLOR[name] || '#7c3aed',
  }));
  const funnelMax = Math.max(1, ...FUNNEL.map((step) => stats.funnel[step.key]));
  const entered =
    stats.funnel.applied +
    stats.funnel.screening +
    stats.funnel.interview +
    stats.funnel.offer +
    stats.funnel.rejected;
  const priority = { high: 0, medium: 0, low: 0 };
  for (const app of apps || []) {
    if (app.priority === 'high' || app.priority === 'medium' || app.priority === 'low') priority[app.priority] += 1;
  }
  const priorityTotal = priority.high + priority.medium + priority.low;
  const profileSkills = user?.profile?.skills || [];
  const jdSkills = new Set(stats.topSkills.map((item) => item.skill.toLowerCase()));
  const overlap = profileSkills.filter((skill) => jdSkills.has(skill.toLowerCase()));
  const unseen = profileSkills.filter((skill) => !jdSkills.has(skill.toLowerCase()));
  const salaryRows = stats.salaryInsights?.recentWithSalary || [];
  const salaryGroups = new Map<Unit, SalaryRow[]>();
  for (const row of salaryRows) {
    const unit = salaryUnit(row.salaryRange);
    salaryGroups.set(unit, [...(salaryGroups.get(unit) || []), row]);
  }
  const showCombined =
    salaryGroups.size === 1 && salaryRows.length > 0 && salaryRows.length === (stats.salaryInsights?.counted || 0);

  return (
    <div className="page wide">
      <section className="welcome">
        <div>
          <p className="welcome-date">{today}</p>
          <h2>Hello, {firstName}</h2>
          <p className="welcome-copy">
            {stats.totalActive === 0
              ? 'Your job pipeline starts here. Save a role to see trends, follow-ups, and match insights.'
              : followUps.length > 0
                ? `${followUps.length} follow-up${followUps.length === 1 ? '' : 's'} due. A short note keeps the pipeline moving.`
                : `${stats.totalActive} active application${stats.totalActive === 1 ? '' : 's'} in your pipeline.`}
          </p>
        </div>
        <div className="welcome-actions">
          <Link className="btn primary" to="/applications/new">
            <Plus size={16} aria-hidden="true" /> Add application
          </Link>
          <Link className="btn ghost" to="/kanban">
            <Columns3 size={16} aria-hidden="true" /> Kanban board
          </Link>
        </div>
      </section>

      {!stats.groqConfigured ? (
        <p className="banner info">AI matching and enrichment need a Groq key on the server. The rest of your pipeline still works.</p>
      ) : null}

      <section className="metric-row kpi-row stagger">
        <Kpi to="/applications" tone="tone-indigo" icon={<Briefcase size={16} />} label="Active" value={stats.totalActive} detail={`${stats.thisWeek} this week · ${stats.thisMonth} this month`} />
        <Kpi to="/applications?status=applied" tone="tone-blue" icon={<Send size={16} />} label="Applied" value={stats.counts.applied} />
        <Kpi to="/applications?status=screening" tone="tone-cyan" icon={<ScanSearch size={16} />} label="Screening" value={stats.counts.screening} />
        <Kpi to="/applications?status=interview" tone="tone-amber" icon={<Sparkles size={16} />} label="Interviews" value={stats.counts.interview} />
        <Kpi to="/applications?status=offer" tone="tone-teal" icon={<BadgeCheck size={16} />} label="Offers" value={stats.counts.offer} />
        <Kpi to="/dashboard#follow-ups" tone="tone-rose" icon={<CalendarClock size={16} />} label="Follow-ups due" value={followUps.length} />
      </section>

      <div className="dash-grid dash-main">
        <section className="panel">
          <header className="section-head">
            <div>
              <h2>Application activity</h2>
              <p className="muted">Saved applications by applied month. Months with none are shown as zero.</p>
            </div>
          </header>
          {stats.totalActive === 0 ? (
            <EmptyState title="Save your first job to see your application trends." detail="Add an application or capture one with the Chrome extension." action={<Link className="btn primary" to="/applications/new">Add application</Link>} />
          ) : (
            <>
              <ActivityChart data={months} />
              <ChartList items={months.map((item) => ({ name: item.name, count: item.count }))} />
            </>
          )}
        </section>
        <section className="panel">
          <header className="section-head">
            <div>
              <h2>Pipeline</h2>
              <p className="muted">Current status of active applications.</p>
            </div>
          </header>
          {pipelineCounts.length === 0 ? (
            <EmptyState title="Your job pipeline starts here." detail="Statuses will appear after you save an application." />
          ) : (
            <>
              <DonutChart data={pipelineCounts} label="Applications by status" />
              <ChartList items={PIPELINE.map((status) => ({ name: STATUS_LABELS[status], count: stats.counts[status] || 0 }))} />
            </>
          )}
        </section>
      </div>

      <div className="dash-grid dash-three">
        <section className="panel">
          <header className="section-head">
            <div>
              <h2>Current funnel</h2>
              <p className="muted">Snapshot counts, not a historical path through each stage.</p>
            </div>
          </header>
          <div className="funnel">
            {FUNNEL.map((step) => {
              const count = stats.funnel[step.key];
              const width = count === 0 ? 0 : Math.round((count / funnelMax) * 100);
              return (
                <div key={step.key} className="funnel-step">
                  <span>{step.label}</span>
                  <div className="funnel-track">
                    <div
                      className="funnel-fill"
                      data-on={count > 0 ? 'true' : 'false'}
                      style={{ width: `${width}%`, background: STATUS_COLOR[step.key] }}
                    />
                  </div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
          <div className="rate-pills">
            <div className="rate-pill">
              <strong>{stats.funnel.interviewRate}%</strong>
              <span>Interview rate</span>
              <em>{entered > 0 ? `${stats.funnel.interview + stats.funnel.offer} of ${entered}` : 'No past-wishlist roles'}</em>
            </div>
            <div className="rate-pill">
              <strong>{stats.funnel.offerRate}%</strong>
              <span>Offer rate</span>
              <em>
                {stats.funnel.interview + stats.funnel.offer > 0
                  ? `${stats.funnel.offer} of ${stats.funnel.interview + stats.funnel.offer}`
                  : 'No interviews yet'}
              </em>
            </div>
            <div className="rate-pill">
              <strong>{stats.funnel.rejectionRate}%</strong>
              <span>Rejection rate</span>
              <em>{entered > 0 ? `${stats.funnel.rejected} of ${entered}` : 'No past-wishlist roles'}</em>
            </div>
          </div>
          <p className="muted rate-note">Counts are the current status of each application, not a path through every stage.</p>
        </section>
        <section className="panel">
          <header className="section-head">
            <div>
              <h2>By source</h2>
              <p className="muted">Where saved applications came from.</p>
            </div>
          </header>
          {sourceCounts.every((item) => item.count === 0) ? (
            <EmptyState title="No sources yet." detail="Source is stored when you add or capture a job." />
          ) : (
            <ul className="meter-list">
              {sourceCounts.filter((item) => item.count > 0).map((item) => (
                <li key={item.key}>
                  <span className="meter-dot" style={{ background: SOURCE_COLOR[item.key] || '#3b5bff' }} />
                  <div className="meter-copy">
                    <div className="meter-top">
                      <span>{item.name}</span>
                      <strong>{item.count}</strong>
                    </div>
                    <div className="meter-track">
                      <div
                        className="meter-fill"
                        style={{ width: `${Math.round((item.count / sourceMax) * 100)}%`, background: SOURCE_COLOR[item.key] || '#3b5bff' }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <header className="section-head">
            <div>
              <h2>Workplace</h2>
              <p className="muted">Remote, hybrid, on-site, or unknown.</p>
            </div>
          </header>
          {workplace.length === 0 ? (
            <EmptyState title="No workplace data yet." detail="Enrich a job or add a workplace type to see this mix." />
          ) : (
            <>
              <DonutChart data={workplace} label="Workplace distribution" />
              <ChartList items={workplace} />
            </>
          )}
        </section>
      </div>

      <div className="dash-grid dash-main">
        <section className="panel">
          <header className="section-head">
            <div>
              <h2>Priority</h2>
              <p className="muted">From the applications currently returned for your account.</p>
            </div>
          </header>
          {priorityTotal === 0 ? (
            <EmptyState title="No priority set yet." detail="Set high, medium, or low on an application to see the mix." />
          ) : (
            <ul className="priority-list">
              {([
                ['High', priority.high, 'priority-high'],
                ['Medium', priority.medium, 'priority-medium'],
                ['Low', priority.low, 'priority-low'],
              ] as const).map(([label, count, tone]) => (
                <li key={label}>
                  <div className="meter-top">
                    <span><i className={tone} /> {label}</span>
                    <strong>{count} · {Math.round((count / priorityTotal) * 100)}%</strong>
                  </div>
                  <div className="meter-track">
                    <div className={`meter-fill ${tone}`} style={{ width: `${Math.round((count / priorityTotal) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <header className="section-head">
            <div>
              <h2>Activity by day</h2>
              <p className="muted">Last 12 weeks, counted from each application’s applied date.</p>
            </div>
          </header>
          {!heat || (apps && apps.length === 0) ? (
            <EmptyState title="No daily activity yet." detail="Dates appear here after you save applications." />
          ) : (
            <Heatmap weeks={heat.weeks} max={heat.max} capped={apps?.length === 500} />
          )}
        </section>
      </div>

      <div className="dash-grid dash-main">
        <section className="panel">
          <header className="section-head">
            <div>
              <h2>Salary insights</h2>
              <p className="muted">Averages stay inside one currency. The saved range is shown as written.</p>
            </div>
          </header>
          {!stats.salaryInsights || stats.salaryInsights.counted === 0 ? (
            <EmptyState title="No saved salaries." detail="Add a salary range, including Indian LPA values, to compare roles you have already saved." />
          ) : (
            [...salaryGroups.entries()].map(([unit, rows]) => {
              const mids = rows.map((row) => row.mid);
              const average = Math.round(mids.reduce((sum, value) => sum + value, 0) / mids.length);
              const median = medianOf(mids);
              const peak = Math.max(1, ...mids);
              const unitLabel = unit === 'unspecified' ? 'Unspecified currency' : unit;
              return (
                <div key={unit} className="pay-group">
                  <p className="muted">
                    {unitLabel} · {rows.length} recent record{rows.length === 1 ? '' : 's'}
                    {showCombined ? ' · this is every parsed salary on the account' : ` · ${stats.salaryInsights?.counted} parsed in total`}
                  </p>
                  {salaryGroups.size > 1 ? (
                    <p className="muted">Mixed currencies stay separate. There is no combined average.</p>
                  ) : null}
                  <div className="pay-stats">
                    <div className="pay-stat">
                      <span>Average</span>
                      <strong>{formatMid(unit, showCombined && stats.salaryInsights?.average != null ? stats.salaryInsights.average : average)}</strong>
                    </div>
                    <div className="pay-stat">
                      <span>Median</span>
                      <strong>{formatMid(unit, showCombined && stats.salaryInsights?.median != null ? stats.salaryInsights.median : median || 0)}</strong>
                    </div>
                  </div>
                  <ul className="pay-list">
                    {rows.slice(0, 5).map((row) => (
                      <li key={row.id}>
                        <Link to={`/applications/${row.id}`}>
                          <span>
                            <strong>{row.roleTitle}</strong>
                            <em>{row.company}</em>
                          </span>
                          <b>{row.salaryRange}</b>
                        </Link>
                        <div className="meter-track">
                          <div className="meter-fill" style={{ width: `${Math.round((row.mid / peak) * 100)}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
          {(stats.salaryInsights?.externalLinks || []).length > 0 ? (
            <div className="link-row">
              {stats.salaryInsights?.externalLinks.map((link) => (
                <a key={link.name} href={link.url} target="_blank" rel="noreferrer">{link.name}</a>
              ))}
            </div>
          ) : null}
          {stats.salaryInsights?.note ? <p className="muted rate-note">{stats.salaryInsights.note}</p> : null}
          {stats.byCompany.length > 0 ? (
            <>
              <h3>Top companies</h3>
              <ul className="chart-list">
                {stats.byCompany.map((company) => (
                  <li key={company.company}>
                    <Link to={`/applications?company=${encodeURIComponent(company.company)}`}>{company.company}</Link>
                    <strong>{company.count}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
        <section className="panel">
          <header className="section-head">
            <div>
              <h2>Skills in saved descriptions</h2>
              <p className="muted">Counted from skills stored on your applications.</p>
            </div>
          </header>
          {stats.topSkills.length === 0 ? (
            <EmptyState title="No skills data yet." detail="Save jobs with descriptions, or run AI enrich, to see which skills show up most." action={<Link className="btn" to="/profile">Update profile</Link>} />
          ) : (
            <ul className="skill-list">
              {stats.topSkills.map((item) => {
                const skillMax = Math.max(1, ...stats.topSkills.map((skill) => skill.count));
                return (
                  <li key={item.skill}>
                    <div className="meter-top">
                      <span>{item.skill}</span>
                      <strong>{item.count}</strong>
                    </div>
                    <div className="meter-track">
                      <div className="meter-fill skill" style={{ width: `${Math.round((item.count / skillMax) * 100)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <h3>Profile skills in those descriptions</h3>
          {profileSkills.length === 0 ? (
            <EmptyState title="Add resume text to unlock job-match insights." detail="Profile skills are also compared with skills extracted from saved descriptions." action={<Link className="btn" to="/profile">Add skills</Link>} />
          ) : (
            <>
              <p className="muted">This compares your profile skills with the extracted skill list above. It is not a full-text scan of every description.</p>
              <div className="tag-cloud">
                {overlap.map((skill) => <span key={skill} className="skill-chip matched">{skill}</span>)}
                {unseen.map((skill) => <span key={skill} className="skill-chip missing">{skill}</span>)}
              </div>
              <p className="muted">Green chips appear in the extracted list. Rose chips do not.</p>
            </>
          )}
          <div className="enrich-meter">
            <div className="meter-top">
              <span>AI enriched</span>
              <strong>{stats.enrichedCount} / {stats.totalActive}</strong>
            </div>
            <div className="meter-track">
              <div className="meter-fill enrich" style={{ width: `${stats.totalActive === 0 ? 0 : stats.enrichmentCoverage}%` }} />
            </div>
            <p className="muted">{stats.enrichmentCoverage}% of active applications have an AI enrichment.</p>
          </div>
        </section>
      </div>

      <div className="dash-grid dash-main">
        <section className="panel">
          <h2>Recent applications</h2>
          {stats.recent.length === 0 ? (
            <EmptyState title="No applications yet." detail="Add one here or save a job from the Chrome extension." action={<Link className="btn primary" to="/applications/new">Add application</Link>} />
          ) : (
            <ul className="list">
              {stats.recent.map((app) => (
                <li key={app._id}>
                  <Link to={`/applications/${app._id}`}>
                    <strong>{app.roleTitle}</strong>
                    <span>
                      {app.company} · {STATUS_LABELS[app.status]} · {new Date(app.appliedAt).toLocaleDateString()}
                      {app.matchScore != null ? ` · Match ${app.matchScore}` : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel" id="follow-ups">
          <h2>Follow-ups due</h2>
          {followUps.length === 0 ? (
            <EmptyState title="No follow-ups due." detail="Follow-ups default to 7 days after you apply." />
          ) : (
            <ul className="list">
              {followUps.map((app) => (
                <li key={app._id}>
                  <Link to={`/applications/${app._id}`}>
                    <strong>{app.roleTitle}</strong>
                    <span>{app.company} · applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="dash-grid dash-main">
        <section className="panel">
          <h2>What you can improve</h2>
          {insights.tips.length === 0 ? (
            <p className="muted">Nothing urgent from your current profile and pipeline.</p>
          ) : (
            <ul className="tips">
              {insights.tips.map((tip) => (
                <li key={tip.id} className={tip.severity}>
                  <strong>{tip.title}</strong>
                  <p>{tip.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <h2>Where to apply</h2>
          {insights.whereToApply.suggestedSearches.length === 0 && insights.whereToApply.wishlist.length === 0 ? (
            <EmptyState title="No target roles yet." detail="Add preferred roles on your profile, or save wishlist jobs." action={<Link className="btn" to="/profile">Edit profile</Link>} />
          ) : (
            <>
              {insights.whereToApply.wishlist.length > 0 ? (
                <ul className="list">
                  {insights.whereToApply.wishlist.map((app) => (
                    <li key={app._id}>
                      <Link to={`/applications/${app._id}`}>
                        <strong>{app.roleTitle}</strong>
                        <span>{app.company}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              {insights.whereToApply.suggestedSearches.map((search) => (
                <div key={search.role} className="search-row">
                  <strong>{search.role}</strong>
                  <div className="link-row">
                    <a href={search.linkedInUrl} target="_blank" rel="noreferrer">LinkedIn</a>
                    <a href={search.indeedUrl} target="_blank" rel="noreferrer">Indeed</a>
                    <a href={search.naukriUrl} target="_blank" rel="noreferrer">Naukri</a>
                  </div>
                </div>
              ))}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({
  to,
  tone,
  icon,
  label,
  value,
  detail,
}: {
  to: string;
  tone: string;
  icon: ReactNode;
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <Link to={to} className="stat-tile kpi-card lift">
      <span className={`kpi-icon ${tone}`}>{icon}</span>
      <strong><CountUp value={value} /></strong>
      <span className="stat-label">{label}</span>
      {detail ? <span className="kpi-sub">{detail}</span> : null}
    </Link>
  );
}

function Heatmap({
  weeks,
  max,
  capped,
}: {
  weeks: Array<Array<{ date: Date; key: string; count: number; future: boolean }>>;
  max: number;
  capped: boolean;
}) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <>
      <div className="heat-scroll">
        <div className="heat" role="img" aria-label="Applications by day for the last 12 weeks">
          <span />
          {weeks.map((week, index) => {
            const prev = index > 0 ? weeks[index - 1][0].date : null;
            const showMonth = !prev || prev.getMonth() !== week[0].date.getMonth();
            return (
              <span key={week[0].key} className="heat-label">
                {showMonth ? week[0].date.toLocaleString(undefined, { month: 'short' }) : ''}
              </span>
            );
          })}
          {days.map((day, dayIndex) => (
            <span key={day} style={{ display: 'contents' }}>
              <span className="heat-label">{day}</span>
              {weeks.map((week) => {
                const cell = week[dayIndex];
                const level = cell.future ? 0 : heatLevel(cell.count, max);
                const label = `${cell.date.toLocaleDateString()}: ${cell.count} application${cell.count === 1 ? '' : 's'}`;
                return (
                  <span
                    key={cell.key}
                    className={`heat-cell lv${level} ${cell.future ? 'is-future' : ''}`}
                    title={cell.future ? '' : label}
                    role="img"
                    aria-label={cell.future ? undefined : label}
                  />
                );
              })}
            </span>
          ))}
        </div>
      </div>
      <div className="heat-legend" aria-hidden="true">
        <span>Less</span>
        <i className="heat-cell" />
        <i className="heat-cell lv1" />
        <i className="heat-cell lv2" />
        <i className="heat-cell lv3" />
        <i className="heat-cell lv4" />
        <span>More</span>
      </div>
      <p className="muted rate-note">
        Each square is one day, from the applied date. Future days are outlined.
        {capped ? ' This uses the 500 most recently applied records returned by the API.' : ''}
      </p>
    </>
  );
}
