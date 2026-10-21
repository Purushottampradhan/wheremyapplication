import { Icon } from './icons';

const POINTS = [
  'Each signed-in user loads only the applications, timeline, and profile stored for that account.',
  'Dashboard, applications, Kanban, profile, settings, and application details require sign-in. The API for those records requires the same session.',
  'The Chrome extension sends captures to the API base you configure in the side panel, using your account.',
  'AI enrichment and resume matching run only when the server is configured with Groq. Tracking works without that configuration.',
  'Inbox reading is optional. You connect your own mailbox in Settings with an app password. The server reads recent inbox mail only when you choose Check inbox, and it does not send or delete messages.',
];

export function PrivacySection() {
  return (
    <section className="landing-section" id="privacy" aria-labelledby="privacy-title">
      <div className="section-intro">
        <p className="eyebrow">Privacy</p>
        <h2 id="privacy-title">Your applications stay on your account</h2>
      </div>
      <ul className="privacy-list">
        {POINTS.map((point) => (
          <li key={point}>
            <Icon name="shield" size={18} />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
