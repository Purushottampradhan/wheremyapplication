import { Link } from 'react-router-dom';
import { EXTENSION_ZIP } from '../../extensionLink';

const FLOW = [
  'Open a job detail page.',
  'Open the WhereMyApplication side panel.',
  'Sign in with the same email and password as the web app.',
  'Choose Applied, Wishlist, or Screening.',
  'Save this job.',
  'Open the dashboard and manage the record there.',
];

export function ExtensionShowcase() {
  return (
    <section className="landing-section" id="chrome-extension" aria-labelledby="extension-title">
      <div className="extension-layout">
        <div>
          <p className="eyebrow">Chrome extension</p>
          <h2 id="extension-title">WhereMyApplication Capture</h2>
          <p className="section-lead">
            The side panel reads the job tab you are on and sends it to your API. It is built for
            detail pages on LinkedIn, Indeed, Naukri, Greenhouse, Lever, Workday, and company
            career sites. Results depend on the page structure, so a messy page can still be added
            by hand.
          </p>
          <ol className="flow-list">
            {FLOW.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="section-note">
            Install it from the project zip with Chrome’s Load unpacked flow. This site does not
            offer a Chrome Web Store listing. Optional LinkedIn Easy Apply auto-capture saves a
            job as Applied only after LinkedIn shows the application was sent, and it skips
            duplicates.
          </p>
          <div className="hero-actions">
            <a className="btn primary" href={EXTENSION_ZIP} download>
              Download extension zip
            </a>
            <a
              className="btn"
              href="#extension-install"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('wma-guide', { detail: 'extension-install' })
                );
              }}
            >
              Installation steps
            </a>
            <Link className="btn ghost" to="/guide">
              Open the guide page
            </Link>
          </div>
        </div>
        <aside className="extension-preview" aria-label="Side panel preview">
          <header>
            <strong>WhereMyApplication</strong>
            <span>Side panel</span>
          </header>
          <p className="fine">Preview of the panel. Not connected to an account.</p>
          <label>
            Status when saving
            <span className="fake-select">Applied</span>
          </label>
          <p className="check-line">Auto-capture LinkedIn Easy Apply success</p>
          <span className="fake-button">Save this job</span>
          <span className="fake-link">Open dashboard</span>
        </aside>
      </div>
    </section>
  );
}
