import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { CompanyMark } from '../components/visuals';
import type { Application, ApplicationStatus } from '../types';
import { STATUSES, STATUS_LABELS } from '../types';

const COLUMNS = STATUSES.filter((status) => status !== 'withdrawn');

export function KanbanPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<ApplicationStatus | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ applications: Application[] }>('/api/applications?sort=updatedAt')
      .then((data) => setApps(data.applications))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function moveTo(id: string, status: ApplicationStatus) {
    const app = apps.find((item) => item._id === id);
    if (!app || app.status === status) return;
    setApps((prev) => prev.map((item) => (item._id === id ? { ...item, status } : item)));
    setSavingId(id);
    setError('');
    setNotice('');
    try {
      await api(`/api/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setNotice(`${app.roleTitle} moved to ${STATUS_LABELS[status]}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Move failed');
      load();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="page wide">
      <div className="page-head">
        <div>
          <h2>Kanban</h2>
          <p className="muted">Drag cards between columns. The status saves when you drop a card.</p>
        </div>
        <Link className="btn ghost" to="/applications">List view</Link>
      </div>
      {error ? <p className="banner error" role="alert">{error}</p> : null}
      {notice ? <p className="banner ok" role="status">{notice}</p> : null}
      <div className="kanban-board">
        {COLUMNS.map((status) => {
          const items = apps.filter((app) => app.status === status);
          return (
            <section
              key={status}
              className={`kanban-col ${over === status ? 'is-over' : ''}`}
              data-status={status}
              onDragOver={(event) => {
                event.preventDefault();
                setOver(status);
              }}
              onDragLeave={() => setOver((current) => (current === status ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData('text/app-id') || dragging;
                if (id) void moveTo(id, status);
                setDragging(null);
                setOver(null);
              }}
            >
              <header>
                <strong>{STATUS_LABELS[status]}</strong>
                <span className="kanban-count">{items.length}</span>
              </header>
              <div className="kanban-cards">
                {items.length === 0 ? <p className="muted">Drop a card here.</p> : null}
                {items.map((app) => (
                  <article
                    key={app._id}
                    className={`kanban-card ${dragging === app._id ? 'is-dragging' : ''} ${savingId === app._id ? 'is-saving' : ''}`}
                    draggable
                    onDragStart={(event) => {
                      setDragging(app._id);
                      event.dataTransfer.setData('text/app-id', app._id);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setOver(null);
                    }}
                  >
                    <Link to={`/applications/${app._id}`}>
                      <strong>{app.roleTitle}</strong>
                      <span className="identity">
                        <CompanyMark name={app.company} />
                        <span>{app.company}{app.location ? ` · ${app.location}` : ''}</span>
                      </span>
                      <span className={`priority-badge ${app.priority || 'medium'}`}>{app.priority || 'medium'}</span>
                      {app.matchScore != null ? <span className="match-pill">Match {app.matchScore}</span> : null}
                      <span>{new Date(app.appliedAt).toLocaleDateString()}</span>
                      {savingId === app._id ? <span>Saving…</span> : null}
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
