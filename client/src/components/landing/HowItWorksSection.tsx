import { Link } from 'react-router-dom';

const STEPS = [
  {
    n: '01',
    title: 'Create your workspace',
    text: 'Register, then add career preferences and resume details on your Profile. That information stays on your account.',
  },
  {
    n: '02',
    title: 'Save your applications',
    text: 'Add a role manually, or use the Chrome side panel on a job detail page and choose a status before you save.',
  },
  {
    n: '03',
    title: 'Track and improve',
    text: 'Update statuses, read match results when AI is configured, review your dashboard, and clear follow-ups that are due.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="landing-section" id="how-it-works" aria-labelledby="how-title">
      <div className="section-intro">
        <p className="eyebrow">How it works</p>
        <h2 id="how-title">Three steps from an empty account to a pipeline</h2>
      </div>
      <ol className="steps">
        {STEPS.map((step) => (
          <li key={step.n}>
            <span>{step.n}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
      <p className="section-note">
        The extension saves the job you capture. It does not automatically record every
        application. Job email is optional: connect a mailbox in Settings, then use Check inbox.
      </p>
      <Link className="btn primary" to="/register">
        Create your account
      </Link>
    </section>
  );
}
