import {
  SAMPLE_NOTE,
  sampleFollowUps,
  sampleMonths,
  sampleRates,
  sampleSalary,
  sampleSkills,
  sampleSources,
  sampleStatuses,
  sampleWorkplace,
} from './sampleWorkspace';

function Bars({
  rows,
  max,
}: {
  rows: Array<{ label: string; count: number }>;
  max: number;
}) {
  return (
    <div className="mini-bars">
      {rows.map((row) => (
        <div key={row.label} className="mini-bar">
          <span>{row.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${Math.round((row.count / max) * 100)}%` }} />
          </div>
          <strong>{row.count}</strong>
        </div>
      ))}
    </div>
  );
}

const monthMax = Math.max(...sampleMonths.map((item) => item.count));

export function DashboardShowcase() {
  return (
    <section className="landing-section" id="analytics" aria-labelledby="analytics-title">
      <div className="section-intro">
        <p className="eyebrow">Dashboard</p>
        <h2 id="analytics-title">See your own search, not a generic scoreboard</h2>
        <p className="section-lead">
          After you sign in, the dashboard is built from your active applications: status counts,
          rates, sources, skills, salaries you saved, recent roles, due follow-ups, and tips.
        </p>
      </div>
      <p className="sample-banner">{SAMPLE_NOTE}</p>
      <div className="showcase-grid">
        <article className="showcase-card">
          <h3>Applications by status</h3>
          <Bars
            rows={sampleStatuses.map((item) => ({ label: item.label, count: item.value }))}
            max={9}
          />
        </article>
        <article className="showcase-card">
          <h3>Applications by month</h3>
          <div className="month-chart" aria-hidden="true">
            {sampleMonths.map((month) => (
              <div key={month.label} className="month-col">
                <div
                  className="month-bar"
                  style={{ height: `${Math.round((month.count / monthMax) * 100)}%` }}
                />
                <span>{month.label}</span>
              </div>
            ))}
          </div>
          <p className="fine">Six-month view in the live dashboard. These bars are the sample set.</p>
        </article>
        <article className="showcase-card">
          <h3>Rates in this sample</h3>
          <ul className="rate-list">
            <li>
              Interview rate <strong>{sampleRates.interview}%</strong>
            </li>
            <li>
              Offer rate <strong>{sampleRates.offer}%</strong>
            </li>
            <li>
              Rejection rate <strong>{sampleRates.rejection}%</strong>
            </li>
          </ul>
          <p className="fine">
            Live rates use your pipeline only. Interview rate counts interviews and offers against
            applications that left wishlist. Offer rate counts offers among interviews and offers.
          </p>
        </article>
        <article className="showcase-card">
          <h3>By source</h3>
          <Bars rows={sampleSources} max={12} />
        </article>
        <article className="showcase-card">
          <h3>Workplace mix</h3>
          <Bars rows={sampleWorkplace} max={10} />
        </article>
        <article className="showcase-card">
          <h3>Skills in saved descriptions</h3>
          <div className="skill-cloud">
            {sampleSkills.map((skill) => (
              <span key={skill.skill}>
                {skill.skill} <em>{skill.count}</em>
              </span>
            ))}
          </div>
        </article>
        <article className="showcase-card">
          <h3>Salary insights</h3>
          <p className="salary-line">
            Sample average ${sampleSalary.average.toLocaleString()} · median $
            {sampleSalary.median.toLocaleString()} · {sampleSalary.counted} parsed ranges
          </p>
          <ul className="plain-list">
            {sampleSalary.rows.map((row) => (
              <li key={row.company}>
                {row.company} · {row.range}
              </li>
            ))}
          </ul>
        </article>
        <article className="showcase-card">
          <h3>Follow-ups due</h3>
          <ul className="plain-list">
            {sampleFollowUps.map((item) => (
              <li key={item.company}>
                <strong>{item.role}</strong> at {item.company} · {item.when}
              </li>
            ))}
          </ul>
        </article>
        <article className="showcase-card showcase-wide">
          <h3>Suggestions</h3>
          <p>
            The live dashboard can suggest completing skills or target roles, reviewing a high
            rejection share, or following up when interviews have not started. Those tips are
            generated from your profile and your applications. They are not shown here as if they
            came from a real account.
          </p>
        </article>
      </div>
    </section>
  );
}
