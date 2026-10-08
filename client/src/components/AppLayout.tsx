import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          WhereMyApplication
        </NavLink>
        <nav className="nav">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/applications">Applications</NavLink>
          <NavLink to="/kanban">Kanban</NavLink>
          <NavLink to="/applications/new">Add</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          <NavLink to="/guide">Guide</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div className="topbar-user">
          <span>{user?.name}</span>
          <button type="button" className="btn ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
