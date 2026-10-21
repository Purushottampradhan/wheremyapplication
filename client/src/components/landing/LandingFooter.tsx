import { Link } from 'react-router-dom';
import { BrandMark } from './BrandMark';

export function FinalCta() {
  return (
    <section className="landing-section closing" aria-labelledby="close-title">
      <h2 id="close-title">Take Control of Your Job Search.</h2>
      <p>Bring your applications, interviews, follow-ups, and career insights into one organized workspace.</p>
      <div className="hero-actions">
        <Link className="btn primary" to="/register">
          Get Started Free
        </Link>
        <Link className="btn" to="/login">
          Sign In
        </Link>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <BrandMark />
      <nav aria-label="Footer">
        <a href="#features">Features</a>
        <a href="#how-it-works">How It Works</a>
        <a href="#chrome-extension">Chrome Extension</a>
        <a href="#user-guide">User Guide</a>
        <Link to="/login">Sign In</Link>
        <Link to="/register">Register</Link>
        <a href="#privacy">Privacy</a>
      </nav>
      <p>WhereMyApplication. Job application tracking for your own account.</p>
    </footer>
  );
}
