import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EXTENSION_ZIP = '/downloads/wheremyapplication-extension.zip';

const FEATURES = [
  {
    title: 'Job inbox',
    tone: 'teal',
    detail:
      'Connect Gmail, Outlook, Yahoo, or another IMAP mailbox with an app password. Check inbox matches recent mail to a saved job and can move status to screening, interview, offer, or rejected.',
  },
  {
    title: 'Chrome side panel capture',
    tone: 'blue',
    detail:
      'Toolbar icon opens a side panel that stays open. Click any job tab (LinkedIn, Indeed, Naukri, Greenhouse, Lever, Workday, or any career site), then Save. If the page does not look like a job, you confirm before saving.',
  },
  {
    title: 'LinkedIn Easy Apply auto-capture',
    tone: 'violet',
    detail:
      'Optional toggle in the side panel. When LinkedIn shows that your application was sent, the extension saves the job as Applied (skips duplicates).',
  },
  {
    title: 'AI enrich (Groq)',
    tone: 'teal',
    detail:
      'On save (or from application detail), Groq fills missing skills, salary, workplace type, employment type, summary, and tags from the job page text.',
  },
  {
    title: 'Resume ↔ JD match score',
    tone: 'amber',
    detail:
      'Paste resume text on Profile. Open any application → Resume↔JD match for a 0–100 score, matched/missing skills, and suggestions.',
  },
  {
    title: 'Duplicate detection',
    tone: 'blue',
    detail:
      'Saving the same job URL or company+role again prompts you. Confirm to force-save, or skip if it is already tracked.',
  },
  {
    title: 'Kanban by status',
    tone: 'violet',
    detail:
      'Drag cards between Wishlist → Applied → Screening → Interview → Offer / Rejected. Status updates immediately.',
  },
  {
    title: 'Salary insights',
    tone: 'teal',
    detail:
      'Dashboard averages salaries parsed from your saved JDs and links out to Levels.fyi, Glassdoor, and similar sites for market checks.',
  },
  {
    title: 'Dashboard & follow-ups',
    tone: 'amber',
    detail:
      'Pipeline counts, tips, where-to-apply search links, follow-up dates, and CSV export from Applications.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Create your account',
    body: (
      <>
        <Link to="/register">Register</Link> with email and password (min 8 characters). Only you
        see applications under your login.
      </>
    ),
  },
  {
    n: '02',
    title: 'Fill Profile',
    body: (
      <>
        Open <Link to="/profile">Profile</Link>: skills, preferred roles/locations, and paste your{' '}
        <strong>resume text</strong> (plain text). That unlocks match scores and smarter tips.
      </>
    ),
  },
  {
    n: '03',
    title: 'Install the Chrome extension',
    body: (
      <>
        Download the zip below, unzip it, then in Chrome open <code>chrome://extensions</code> →
        Developer mode → <strong>Load unpacked</strong> → select the unzipped folder. Pin the
        extension and click the icon to open the side panel.
      </>
    ),
  },
  {
    n: '04',
    title: 'Sign in on the side panel',
    body: (
      <>
        API base defaults to{' '}
        <code>https://wheremyapplication-api.onrender.com</code> (use{' '}
        <code>http://127.0.0.1:5080</code> only for local API). Web app URL defaults to this site
        (<code>/wma</code> on the portfolio). Sign in with the same email/password. Leave Easy Apply
        auto-capture on if you want LinkedIn auto-saves.
      </>
    ),
  },
  {
    n: '05',
    title: 'Save jobs as you apply',
    body: (
      <>
        On a job detail page, choose status (Applied / Wishlist) → <strong>Save this job</strong>.
        Or finish LinkedIn Easy Apply and let auto-capture run. Check{' '}
        <Link to="/applications">Applications</Link> and <Link to="/dashboard">Dashboard</Link>.
      </>
    ),
  },
  {
    n: '06',
    title: 'Enrich, match, and move pipeline',
    body: (
      <>
        Open a job → <strong>AI enrich</strong> and <strong>Resume↔JD match</strong>. Update status
        in the table, detail page, or drag on <Link to="/kanban">Kanban</Link>. Add notes and
        follow-up dates. Export CSV when you need a backup.
      </>
    ),
  },
];

export function GuidePage({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const features = useMemo(
    () => FEATURES.filter((item) => !needle || `${item.title} ${item.detail}`.toLowerCase().includes(needle)),
    [needle]
  );
  const steps = useMemo(
    () => STEPS.filter((item) => !needle || item.title.toLowerCase().includes(needle)),
    [needle]
  );

  return (
    <div className="guide-page">
      {embedded ? null : (
      <header className="guide-top">
        <Link to={user ? '/dashboard' : '/'} className="brand brand-lockup">
          <img src="/WMA_Icon.png" alt="" width="36" height="36" />
          <span>WhereMyApplication</span>
        </Link>
        <div className="guide-top-actions">
          <a className="btn primary" href={EXTENSION_ZIP} download>
            Download extension
          </a>
          {user ? (
            <Link className="btn ghost" to="/dashboard">
              Back to app
            </Link>
          ) : (
            <>
              <Link className="btn ghost" to="/login">
                Sign in
              </Link>
              <Link className="btn ghost" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </header>
      )}

      <section className="guide-hero">
        <p className="eyebrow">How to use</p>
        <h1>Complete guide</h1>
        <p className="lead">
          Track every job application in one private workspace — capture from the browser, enrich
          with AI, score resume fit, and move roles across a kanban pipeline.
        </p>
        <div className="guide-cta-row">
          <a className="btn primary" href={EXTENSION_ZIP} download>
            Download Chrome extension (.zip)
          </a>
          <a className="btn ghost" href="#install-extension">
            Install steps
          </a>
        </div>
        <label className="guide-search">
          Search the guide
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Extension, match score, privacy…" />
        </label>
      </section>

      <section className="guide-section" id="features">
        <h2>Features</h2>
        <p className="muted">Tracking, capture, and an optional mailbox check for job email you connect yourself.</p>
        <div className="guide-feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="guide-feature" data-tone={feature.tone}>
              <h3>{feature.title}</h3>
              <p>{feature.detail}</p>
            </article>
          ))}
        </div>
        {features.length === 0 ? <p className="muted">No guide topics match that search.</p> : null}
      </section>

      <section className="guide-section" id="setup">
        <h2>Setup & daily use</h2>
        <div className="guide-steps">
          {steps.map((step) => (
            <details key={step.n} open>
              <summary>
                <span className="guide-step-n">{step.n}</span> {step.title}
              </summary>
              <p>{step.body}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="guide-section" id="install-extension">
        <h2>Install the extension</h2>
        <div className="panel guide-install">
          <div>
            <p>
              Package: <strong>wheremyapplication-extension.zip</strong> (Chrome MV3 side panel,
              v1.5+)
            </p>
            <ol>
              <li>
                <a href={EXTENSION_ZIP} download>
                  Download the zip
                </a>{' '}
                and unzip it on your computer
              </li>
              <li>
                Open Chrome → go to <code>chrome://extensions</code>
              </li>
              <li>Turn on <strong>Developer mode</strong> (top right)</li>
              <li>
                Click <strong>Load unpacked</strong> → select the unzipped folder (the one that
                contains <code>manifest.json</code>)
              </li>
              <li>Pin WhereMyApplication Capture → click the icon to open the side panel</li>
              <li>
                Sign in with the same account as this web app; set API base if you use a hosted
                backend
              </li>
            </ol>
            <p className="muted">
              When the Chrome Web Store listing is live, you can install from the store instead of
              Load unpacked. Until then, this zip is the download link.
            </p>
          </div>
          <a className="btn primary guide-download-btn" href={EXTENSION_ZIP} download>
            Download extension
          </a>
        </div>
      </section>

      <section className="guide-section" id="statuses">
        <h2>Status meanings</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Wishlist</td>
                <td>Saved, not applied yet</td>
              </tr>
              <tr>
                <td>Applied</td>
                <td>Application submitted</td>
              </tr>
              <tr>
                <td>Screening</td>
                <td>HR / recruiter screen</td>
              </tr>
              <tr>
                <td>Interview</td>
                <td>Interview scheduled or done</td>
              </tr>
              <tr>
                <td>Offer</td>
                <td>You received an offer</td>
              </tr>
              <tr>
                <td>Rejected</td>
                <td>Not moving forward</td>
              </tr>
              <tr>
                <td>Withdrawn</td>
                <td>You withdrew</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="guide-section" id="job-email">
        <h2>Reading job email</h2>
        <ol className="guide-list">
          <li>Use the mailbox where recruiters write to you. It can differ from your sign-in email.</li>
          <li>Turn on 2-step verification, then create an app password named WhereMyApplication. In Gmail: Google Account → Security → App passwords.</li>
          <li>Turn on IMAP. In Gmail: Settings → See all settings → Forwarding and POP/IMAP → Enable IMAP → Save.</li>
          <li>In this app, open Settings → Job inbox. Choose Gmail, Outlook, Yahoo, or Other IMAP. Paste the mailbox address and the app password, not your normal password.</li>
          <li>Save mailbox. Then open Applications → Check inbox.</li>
        </ol>
        <p className="muted">
          A message updates one saved job when the company name is in the mail, or the sender matches the recruiter email on that job. Interview, offer, and rejection wording move the status. Status does not move backward, and Offer, Rejected, and Withdrawn stay put. The check reads about 21 days of inbox mail, up to 30 messages, and does not send or delete email.
        </p>
      </section>

      <section className="guide-section" id="habits">
        <h2>Recommended habit</h2>
        <ul className="guide-list">
          <li>After every apply → extension Save (or Add in the web app)</li>
          <li>Connect the job mailbox in Settings, then use Check inbox on Applications when new mail arrives</li>
          <li>Once a week → Dashboard → clear follow-ups</li>
          <li>Keep Profile resume text and skills updated for better match scores</li>
        </ul>
      </section>

      <section className="guide-section" id="troubleshoot">
        <h2>Troubleshooting</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Problem</th>
                <th>Fix</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Extension cannot reach API</td>
                <td>
                  Test API in the side panel. Use <code>127.0.0.1:5080</code> locally (not port
                  5060). Allow host permission for your Render URL.
                </td>
              </tr>
              <tr>
                <td>Could not read job details</td>
                <td>Open the job detail page (not the list), refresh once, try Save again.</td>
              </tr>
              <tr>
                <td>Match button errors</td>
                <td>Paste resume text (40+ characters) or skills on Profile first.</td>
              </tr>
              <tr>
                <td>Duplicate warning</td>
                <td>You already saved that URL or company+role — save anyway only if intentional.</td>
              </tr>
              <tr>
                <td>LinkedIn chrome-extension://invalid</td>
                <td>
                  Often LinkedIn probing extensions. Reload unpacked; Save still works via on-demand
                  inject.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer className="guide-footer">
        <a className="btn primary" href={EXTENSION_ZIP} download>
          Download extension
        </a>
        {user ? (
          <Link to="/dashboard">Go to Dashboard</Link>
        ) : (
          <Link to="/register">Create an account</Link>
        )}
      </footer>
    </div>
  );
}
