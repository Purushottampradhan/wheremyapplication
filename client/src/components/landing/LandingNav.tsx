import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandMark } from './BrandMark';
import { Icon } from './icons';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#ai-insights', label: 'AI Insights' },
  { href: '#chrome-extension', label: 'Chrome Extension' },
  { href: '#user-guide', label: 'User Guide' },
  { href: '#faq', label: 'FAQ' },
];

export function LandingNav() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function close() {
    setOpen(false);
  }

  return (
    <header className={`landing-nav ${open ? 'is-open' : ''}`}>
      <div className="landing-nav-bar">
        <BrandMark />
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="landing-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name={open ? 'close' : 'menu'} size={20} />
          <span className="visually-hidden">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
        <div id="landing-menu" className="landing-menu">
          <nav aria-label="Page">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={close}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="landing-nav-actions">
            {user ? (
              <Link className="btn primary" to="/dashboard" onClick={close}>
                Open workspace
              </Link>
            ) : (
              <>
                <Link className="btn ghost" to="/login" onClick={close}>
                  Sign In
                </Link>
                <Link className="btn primary" to="/register" onClick={close}>
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
