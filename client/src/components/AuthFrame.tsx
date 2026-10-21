import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <div className="orb orb-a" aria-hidden="true" />
        <div className="orb orb-b" aria-hidden="true" />
        <div>
          <Link to="/" className="brand brand-lockup">
            <img src="/WMA_Icon.png" alt="" width="36" height="36" />
            <span>WhereMyApplication</span>
          </Link>
          <h2>Every application. One workspace.</h2>
          <p>Track roles, move them through your pipeline, and keep follow-ups in view.</p>
          <ul>
            <li>Dashboard, list, and kanban stay in sync.</li>
            <li>Capture jobs from the Chrome extension.</li>
            <li>Your data stays on your account.</li>
          </ul>
        </div>
      </aside>
      <div className="auth-stage">{children}</div>
    </div>
  );
}
