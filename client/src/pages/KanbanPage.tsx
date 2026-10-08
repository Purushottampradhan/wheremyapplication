import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Application, ApplicationStatus } from '../types';
import { STATUSES, STATUS_LABELS } from '../types';

export function KanbanPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ applications: Application[] }>('/api/applications?sort=updatedAt')
      .then((data) => setApps(data.applications))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function moveTo(id: string, status: ApplicationStatus) {
    const app = apps.find((a) => a._id === id);
    if (!app || app.status === status) return;
    setApps((prev) => prev.map((a) => (a._id === id ? { ...a, status } : a)));
    try {
      await api(`/api/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Move failed');
      load();
    }
  }

  const columns = STATUSES.filter((s) => s !== 'withdrawn');

  return (
    <div className="page wide">
      <div className="page-head">
        <div>
          <h1>Kanban</h1>
          <p className="muted">Drag cards between columns to update status.</p>
        </div>
        <Link className="btn ghost" to="/applications">
          List view
        </Link>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="kanban-board">
        {columns.map((status) => {
          const items = apps.filter((a) => a.status === status);
          return (
            <section
              key={status}
              className="kanban-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/app-id') || dragging;
                if (id) moveTo(id, status);
                setDragging(null);
              }}
            >
              <header>
                <strong>{STATUS_LABELS[status]}</strong>
                <span>{items.length}</span>
              </header>
              <div className="kanban-cards">
                {items.map((app) => (
                  <article
                    key={app._id}
                    className="kanban-card"
                    draggable
                    onDragStart={(e) => {
                      setDragging(app._id);
                      e.dataTransfer.setData('text/app-id', app._id);
                    }}
                  >
                    <Link to={`/applications/${app._id}`}>
                      <strong>{app.roleTitle}</strong>
                      <span>{app.company}</span>
                      {app.matchScore != null ? (
                        <span className="match-pill">Match {app.matchScore}%</span>
                      ) : null}
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
