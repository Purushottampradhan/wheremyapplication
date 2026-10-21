import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  Columns3,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import '../app-shell.css';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tone: 'tone-indigo' },
  { to: '/applications', label: 'Applications', icon: Briefcase, tone: 'tone-blue' },
  { to: '/kanban', label: 'Kanban Board', icon: Columns3, tone: 'tone-violet' },
  { to: '/applications/new', label: 'Add Application', icon: Plus, tone: 'tone-teal' },
  { to: '/profile', label: 'Profile', icon: UserRound, tone: 'tone-amber' },
  { to: '/settings', label: 'Settings', icon: Settings, tone: 'tone-rose' },
] as const;

function titleFor(pathname: string) {
  if (pathname.startsWith('/applications/') && pathname !== '/applications/new') return 'Application';
  return NAV.find((item) => item.to === pathname)?.label || 'Workspace';
}

function crumbFor(pathname: string) {
  if (pathname.startsWith('/applications/') && pathname !== '/applications/new') return 'Applications';
  return 'Workspace';
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('wma-sidebar') === 'collapsed');
  const [menuOpen, setMenuOpen] = useState(false);
  const [navPath, setNavPath] = useState(location.pathname);
  const [due, setDue] = useState<number | null>(null);

  if (navPath !== location.pathname) {
    setNavPath(location.pathname);
    setOpen(false);
    setMenuOpen(false);
  }

  useEffect(() => {
    localStorage.setItem('wma-sidebar', collapsed ? 'collapsed' : 'open');
  }, [collapsed]);

  useEffect(() => {
    let cancelled = false;
    api<{ followUps: unknown[] }>('/api/applications/follow-ups')
      .then((data) => {
        if (!cancelled) setDue(data.followUps.length);
      })
      .catch(() => {
        if (!cancelled) setDue(null);
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/applications?q=${encodeURIComponent(q)}` : '/applications');
    setOpen(false);
  }

  const initials = (user?.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''} ${collapsed ? 'is-collapsed' : ''} ${open ? 'nav-open' : ''}`}>
      <aside id="app-sidebar" className="app-sidebar" aria-label="Workspace">
        <NavLink to="/dashboard" className="side-brand">
          <img src="/WMA_Icon.png" alt="" width="32" height="32" />
          <span>WhereMyApplication</span>
        </NavLink>
        <nav className="side-nav">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} title={item.label} end={item.to === '/applications'}>
                <span className={`nav-ico ${item.tone}`}>
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="side-account">
          <span className="avatar" aria-hidden="true">
            {initials}
          </span>
          <div>
            <strong>{user?.name}</strong>
            <em>{user?.email}</em>
          </div>
          <button type="button" className="btn ghost" onClick={logout}>
            <LogOut size={14} aria-hidden="true" /> Log out
          </button>
        </div>
      </aside>
      {open ? (
        <button type="button" className="nav-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />
      ) : null}
      <div className="app-main">
        <header className="app-top">
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="app-sidebar"
            onClick={() => setOpen((value) => !value)}
          >
            <Menu size={18} aria-hidden="true" />
            <span className="visually-hidden">Menu</span>
          </button>
          <button
            type="button"
            className="collapse-toggle"
            aria-pressed={collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span className="visually-hidden">{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
          </button>
          <div className="app-heading">
            <p>{crumbFor(location.pathname)}</p>
            <h1>{titleFor(location.pathname)}</h1>
          </div>
          <form className="app-search" onSubmit={onSearch} role="search">
            <label className="visually-hidden" htmlFor="app-q">
              Search applications
            </label>
            <Search size={16} aria-hidden="true" />
            <input
              id="app-q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search applications"
            />
          </form>
          {due != null && due > 0 ? (
            <NavLink className="due-chip" to="/dashboard#follow-ups">
              <Bell size={14} aria-hidden="true" />
              <span>
                {due} follow-up{due === 1 ? '' : 's'}
              </span>
            </NavLink>
          ) : null}
          <NavLink className="btn primary add-link" to="/applications/new">
            Add application
          </NavLink>
          <button type="button" className="theme-btn" onClick={toggle} aria-pressed={theme === 'dark'}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span className="visually-hidden">{theme === 'dark' ? 'Use light theme' : 'Use dark theme'}</span>
          </button>
          <div className={`user-menu ${menuOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="avatar-btn"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((value) => !value)}
            >
              <span className="avatar">{initials}</span>
              <span className="user-menu-name">{user?.name}</span>
            </button>
            {menuOpen ? (
              <div className="user-popover" role="menu">
                <p>
                  <strong>{user?.name}</strong>
                  <span>{user?.email}</span>
                </p>
                <NavLink to="/profile" role="menuitem">
                  Profile
                </NavLink>
                <NavLink to="/settings" role="menuitem">
                  Settings
                </NavLink>
                <button type="button" role="menuitem" onClick={logout}>
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <div className="app-content">
          <div key={location.pathname} className="app-stage">
            {children ?? <Outlet />}
          </div>
        </div>
      </div>
    </div>
  );
}
