import { Link } from 'react-router-dom';
import { SAMPLE_NOTE, sampleHero, sampleRecent, sampleStatuses } from './sampleWorkspace';

const maxStatus = Math.max(...sampleStatuses.map((item) => item.value));

export function HeroSection() {
  return (
    <section className="landing-hero landing-section" aria-labelledby="hero-title">
      <div className="orb orb-a" aria-hidden="true" />
      <div className="orb orb-b" aria-hidden="true" />
      <div className="orb orb-c" aria-hidden="true" />
      <div className="hero-copy">
        <p className="eyebrow">Job application tracker</p>
        <h1 id="hero-title">Every Job Application. One Place.</h1>
        <p className="lede">
          Track every application, organize your interview pipeline, understand your job search,
          and stay on top of follow-ups — all from one simple workspace.
        </p>
        <p className="hero-support">Your job search, organized from application to offer.</p>
        <div className="hero-actions">
          <Link className="btn primary" to="/register">
            Get Started Free
          </Link>
          <a className="btn" href="#features">
            Explore Features
          </a>
        </div>
      </div>
      <figure className="preview-card">
        <figcaption className="preview-caption">
          <span>Sample workspace</span>
          <span className="preview-note">{SAMPLE_NOTE}</span>
        </figcaption>
        <div className="preview-stats">
          <div>
            <span>Total applications</span>
            <strong>{sampleHero.total}</strong>
          </div>
          <div>
            <span>In progress</span>
            <strong>{sampleHero.inProgress}</strong>
          </div>
          <div>
            <span>Interviews</span>
            <strong>{sampleHero.interviews}</strong>
          </div>
          <div>
            <span>Offers</span>
            <strong>{sampleHero.offers}</strong>
          </div>
        </div>
        <div className="preview-pipeline" aria-hidden="true">
          {sampleStatuses.map((item) => (
            <div key={item.label} className="preview-pipe">
              <span>{item.label}</span>
              <div className="bar-track">
                <div
                  className={`bar-fill tone-${item.tone}`}
                  style={{ width: `${Math.round((item.value / maxStatus) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <ul className="preview-rows">
          {sampleRecent.map((row) => (
            <li key={row.company}>
              <span>
                <strong>{row.role}</strong>
                <em>{row.company}</em>
              </span>
              <span className="status-pill">{row.status}</span>
            </li>
          ))}
        </ul>
      </figure>
    </section>
  );
}
