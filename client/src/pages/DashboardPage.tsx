import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Application } from '../types';
import { STATUS_LABELS, type ApplicationStatus } from '../types';

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

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="bar-value">{value}</span>
    </div>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [followUps, setFollowUps] = useState<Application[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api<Stats>('/api/dashboard/stats'),
      api<Insights>('/api/profile/insights'),
      api<FollowUps>('/api/applications/follow-ups'),
    ])
      .then(([s, i, f]) => {
        setStats(s);
        setInsights(i);
        setFollowUps(f.followUps);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats || !insights) return <p className="muted">Loading dashboard…</p>;

  const maxSource = Math.max(1, ...stats.bySource.map((s) => s.count));
  const maxCompany = Math.max(1, ...stats.byCompany.map((c) => c.count));
  const maxMonth = Math.max(1, ...stats.monthlyTrend.map((m) => m.count));

  return (
    <div className="page wide">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            {stats.totalActive} active · {stats.thisWeek} this week · {stats.thisMonth} this month
            {!stats.groqConfigured ? ' · Add GROQ_API_KEY for AI enrichment' : ' · AI ready'}
          </p>
        </div>
        <Link className="btn primary" to="/applications/new">
          Add application
        </Link>
      </div>

      <section className="status-grid">
        {(Object.keys(stats.counts) as ApplicationStatus[]).map((status) => (
          <Link key={status} to={`/applications?status=${status}`} className="stat-tile">
            <span className="stat-label">{STATUS_LABELS[status]}</span>
            <strong>{stats.counts[status]}</strong>
          </Link>
        ))}
      </section>

      <div className="insight-metrics">
        <div className="metric-card">
          <span className="metric-label">Interview rate</span>
          <strong>{stats.funnel.interviewRate}%</strong>
          <p className="muted">Of active pipeline reaching interview/offer</p>
        </div>
        <div className="metric-card">
          <span className="metric-label">Offer rate</span>
          <strong>{stats.funnel.offerRate}%</strong>
          <p className="muted">Offers among interview+offer</p>
        </div>
        <div className="metric-card">
          <span className="metric-label">Rejection rate</span>
          <strong>{stats.funnel.rejectionRate}%</strong>
          <p className="muted">Rejected vs pipeline</p>
        </div>
        <div className="metric-card">
          <span className="metric-label">AI enriched</span>
          <strong>{stats.enrichmentCoverage}%</strong>
          <p className="muted">
            {stats.enrichedCount} of {stats.totalActive} applications
          </p>
        </div>
      </div>

      <div className="two-col">
        <section className="panel">
          <h2>Pipeline funnel</h2>
          <Bar label="Wishlist" value={stats.funnel.wishlist} max={stats.totalActive || 1} />
          <Bar label="Applied" value={stats.funnel.applied} max={stats.totalActive || 1} />
          <Bar label="Screening" value={stats.funnel.screening} max={stats.totalActive || 1} />
          <Bar label="Interview" value={stats.funnel.interview} max={stats.totalActive || 1} />
          <Bar label="Offer" value={stats.funnel.offer} max={stats.totalActive || 1} />
          <Bar label="Rejected" value={stats.funnel.rejected} max={stats.totalActive || 1} />
        </section>

        <section className="panel">
          <h2>Applications by month</h2>
          {stats.monthlyTrend.length === 0 ? (
            <p className="muted">No applications in the last 6 months.</p>
          ) : (
            stats.monthlyTrend.map((m) => (
              <Bar key={m.label} label={m.label} value={m.count} max={maxMonth} />
            ))
          )}
        </section>
      </div>

      <div className="two-col">
        <section className="panel">
          <h2>Top companies</h2>
          {stats.byCompany.length === 0 ? (
            <p className="muted">No companies yet.</p>
          ) : (
            stats.byCompany.map((c) => (
              <div key={c.company} className="list-line">
                <Link to={`/applications?company=${encodeURIComponent(c.company)}`}>
                  {c.company}
                </Link>
                <span>{c.count}</span>
                <div className="mini-track">
                  <div
                    className="mini-fill"
                    style={{ width: `${Math.round((c.count / maxCompany) * 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </section>

        <section className="panel">
          <h2>By source</h2>
          {stats.bySource.map((s) => (
            <Bar key={s.source} label={s.source} value={s.count} max={maxSource} />
          ))}
        </section>
      </div>

      <div className="two-col">
        <section className="panel">
          <h2>Salary insights (from your saved JDs)</h2>
          {!stats.salaryInsights || stats.salaryInsights.counted === 0 ? (
            <p className="muted">
              Enrich applications that include salary text to build averages. External site
              links below help you compare market rates.
            </p>
          ) : (
            <>
              <div className="insight-metrics compact">
                <div className="metric-card">
                  <span className="metric-label">Average (parsed)</span>
                  <strong>{stats.salaryInsights.average?.toLocaleString()}</strong>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Median</span>
                  <strong>{stats.salaryInsights.median?.toLocaleString()}</strong>
                </div>
                <div className="metric-card">
                  <span className="metric-label">With salary</span>
                  <strong>{stats.salaryInsights.counted}</strong>
                </div>
              </div>
              <ul className="list compact">
                {stats.salaryInsights.recentWithSalary.slice(0, 6).map((r) => (
                  <li key={r.id}>
                    <Link to={`/applications/${r.id}`}>
                      <strong>
                        {r.roleTitle} · {r.salaryRange}
                      </strong>
                      <span>{r.company}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h3>Compare on other sites</h3>
          <div className="link-row">
            {(stats.salaryInsights?.externalLinks || []).map((l) => (
              <a key={l.name} href={l.url} target="_blank" rel="noreferrer">
                {l.name}
              </a>
            ))}
          </div>
          <p className="muted">{stats.salaryInsights?.note}</p>
        </section>

        <section className="panel">
          <h2>Skills appearing in your JDs</h2>
          {stats.topSkills.length === 0 ? (
            <p className="muted">
              Save jobs with the extension + Groq enrichment to build a skill demand map.
            </p>
          ) : (
            <div className="tag-cloud">
              {stats.topSkills.map((s) => (
                <span key={s.skill} className="tag">
                  {s.skill} · {s.count}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="two-col">
        <section className="panel">
          <h2>Workplace mix</h2>
          {stats.byWorkplace.length === 0 ? (
            <p className="muted">No workplace data yet.</p>
          ) : (
            stats.byWorkplace.map((w) => (
              <div key={w.workplace} className="list-line">
                <span>{w.workplace}</span>
                <span>{w.count}</span>
              </div>
            ))
          )}
        </section>
      </div>

      <div className="two-col">
        <section className="panel">
          <h2>Recent applications</h2>
          {stats.recent.length === 0 ? (
            <p className="muted">No applications yet. Add one or use the Chrome extension.</p>
          ) : (
            <ul className="list">
              {stats.recent.map((app) => (
                <li key={app._id}>
                  <Link to={`/applications/${app._id}`}>
                    <strong>
                      {app.roleTitle}
                      {app.aiEnrichedAt ? ' · AI' : ''}
                    </strong>
                    <span>
                      {app.company} · {STATUS_LABELS[app.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2>What you can improve</h2>
          {insights.tips.length === 0 ? (
            <p className="muted">Looking good — keep applying and updating statuses.</p>
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
      </div>

      <div className="two-col">
        <section className="panel">
          <h2>Where to apply</h2>
          {insights.whereToApply.suggestedSearches.length === 0 &&
          insights.whereToApply.wishlist.length === 0 ? (
            <p className="muted">
              Add preferred roles on your <Link to="/profile">Profile</Link> or save wishlist jobs.
            </p>
          ) : (
            <>
              {insights.whereToApply.wishlist.length > 0 && (
                <>
                  <h3>Wishlist</h3>
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
                </>
              )}
              {insights.whereToApply.suggestedSearches.map((s) => (
                <div key={s.role} className="search-row">
                  <strong>{s.role}</strong>
                  <div className="link-row">
                    <a href={s.linkedInUrl} target="_blank" rel="noreferrer">
                      LinkedIn
                    </a>
                    <a href={s.indeedUrl} target="_blank" rel="noreferrer">
                      Indeed
                    </a>
                    <a href={s.naukriUrl} target="_blank" rel="noreferrer">
                      Naukri
                    </a>
                  </div>
                </div>
              ))}
            </>
          )}
        </section>

        <section className="panel">
          <h2>Follow-ups due</h2>
          {followUps.length === 0 ? (
            <p className="muted">Nothing due. Follow-ups default to 7 days after apply.</p>
          ) : (
            <ul className="list">
              {followUps.map((app) => (
                <li key={app._id}>
                  <Link to={`/applications/${app._id}`}>
                    <strong>{app.roleTitle}</strong>
                    <span>
                      {app.company} · applied {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
