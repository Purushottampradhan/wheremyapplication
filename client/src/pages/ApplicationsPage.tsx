import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, API_URL, getToken } from '../api/client';
import type { Application, ApplicationStatus } from '../types';
import { SOURCES, STATUSES, STATUS_LABELS } from '../types';

type Group = { key: string; count: number; items: Application[] };

export function ApplicationsPage() {
  const [params, setParams] = useSearchParams();
  const [apps, setApps] = useState<Application[]>([]);
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const status = params.get('status') || '';
  const source = params.get('source') || '';
  const search = params.get('q') || '';
  const company = params.get('company') || '';
  const groupBy = params.get('groupBy') || '';
  const sort = params.get('sort') || 'appliedAt';
  const archived = params.get('archived') || '';
  const priority = params.get('priority') || '';

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (source) q.set('source', source);
    if (search) q.set('search', search);
    if (company) q.set('company', company);
    if (groupBy) q.set('groupBy', groupBy);
    if (sort) q.set('sort', sort);
    if (archived) q.set('archived', archived);
    if (priority) q.set('priority', priority);
    return q.toString();
  }, [status, source, search, company, groupBy, sort, archived, priority]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  function load() {
    api<{ applications: Application[]; groups?: Group[] }>(
      `/api/applications${query ? `?${query}` : ''}`
    )
      .then((data) => {
        setApps(data.applications);
        setGroups(data.groups || null);
        setSelected(new Set());
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }

  useEffect(() => {
    load();
  }, [query]);

  async function changeStatus(id: string, next: ApplicationStatus) {
    setBusyId(id);
    try {
      await api(`/api/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setBusyId(null);
    }
  }

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setParam('q', String(fd.get('q') || ''));
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(list: Application[]) {
    if (list.every((a) => selected.has(a._id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(list.map((a) => a._id)));
    }
  }

  async function runBulk(action: string, value?: string) {
    if (!selected.size) return;
    setBulkBusy(true);
    setError('');
    try {
      await api('/api/applications/bulk', {
        method: 'POST',
        body: JSON.stringify({
          ids: [...selected],
          action,
          value,
        }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setBulkBusy(false);
    }
  }

  function exportCsv() {
    const token = getToken();
    const base = API_URL || '';
    fetch(`${base}/api/applications/export.csv`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'applications.csv';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => setError('Export failed'));
  }

  function renderRow(app: Application) {
    return (
      <tr key={app._id} className={selected.has(app._id) ? 'row-selected' : ''}>
        <td>
          <input
            type="checkbox"
            checked={selected.has(app._id)}
            onChange={() => toggleSelect(app._id)}
            aria-label={`Select ${app.roleTitle}`}
          />
        </td>
        <td>
          <Link to={`/applications/${app._id}`} className="app-title-link">
            <strong>{app.roleTitle}</strong>
            {app.aiEnrichedAt ? <span className="badge ai">AI</span> : null}
            {app.priority === 'high' ? <span className="badge high">High</span> : null}
          </Link>
          {app.tags && app.tags.length > 0 ? (
            <div className="tag-row">
              {app.tags.slice(0, 4).map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </td>
        <td>
          <button
            type="button"
            className="linkish"
            onClick={() => setParam('company', app.company)}
          >
            {app.company}
          </button>
        </td>
        <td className="muted-cell">
          {app.location || '—'}
          {app.workplaceType ? (
            <div className="sub">{app.workplaceType}</div>
          ) : null}
        </td>
        <td>{app.source}</td>
        <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
        <td>
          <select
            value={app.status}
            disabled={busyId === app._id}
            onChange={(e) => changeStatus(app._id, e.target.value as ApplicationStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </td>
      </tr>
    );
  }

  function renderTable(list: Application[]) {
    return (
      <div className="table-wrap">
        <table className="apps-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  checked={list.length > 0 && list.every((a) => selected.has(a._id))}
                  onChange={() => toggleSelectAll(list)}
                  aria-label="Select all"
                />
              </th>
              <th>Role</th>
              <th>Company</th>
              <th>Location</th>
              <th>Source</th>
              <th>Applied</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>{list.map(renderRow)}</tbody>
        </table>
        {list.length === 0 && <p className="muted pad">No applications match.</p>}
      </div>
    );
  }

  return (
    <div className="page wide">
      <div className="page-head">
        <div>
          <h1>Applications</h1>
          <p className="muted">
            {apps.length} shown
            {selected.size ? ` · ${selected.size} selected` : ''}
          </p>
        </div>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={exportCsv}>
            Export CSV
          </button>
          <Link className="btn primary" to="/applications/new">
            Add
          </Link>
        </div>
      </div>

      <form className="filters panel-filters" onSubmit={onSearch}>
        <input name="q" defaultValue={search} placeholder="Search role, company, skills, tags…" />
        <select value={status} onChange={(e) => setParam('status', e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select value={source} onChange={(e) => setParam('source', e.target.value)}>
          <option value="">All sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setParam('priority', e.target.value)}>
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={groupBy} onChange={(e) => setParam('groupBy', e.target.value)}>
          <option value="">No grouping</option>
          <option value="company">Group by company</option>
          <option value="status">Group by status</option>
          <option value="source">Group by source</option>
        </select>
        <select value={sort} onChange={(e) => setParam('sort', e.target.value)}>
          <option value="appliedAt">Sort: newest applied</option>
          <option value="updatedAt">Sort: recently updated</option>
          <option value="company">Sort: company A–Z</option>
        </select>
        <select value={archived} onChange={(e) => setParam('archived', e.target.value)}>
          <option value="">Active only</option>
          <option value="true">Archived only</option>
          <option value="all">Active + archived</option>
        </select>
        {company ? (
          <button type="button" className="btn ghost" onClick={() => setParam('company', '')}>
            Clear company: {company}
          </button>
        ) : null}
        <button className="btn" type="submit">
          Search
        </button>
      </form>

      {selected.size > 0 ? (
        <div className="bulk-bar">
          <span>{selected.size} selected</span>
          <select
            disabled={bulkBusy}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) runBulk('status', e.target.value);
              e.target.value = '';
            }}
          >
            <option value="">Set status…</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            disabled={bulkBusy}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) runBulk('priority', e.target.value);
              e.target.value = '';
            }}
          >
            <option value="">Set priority…</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button type="button" className="btn ghost" disabled={bulkBusy} onClick={() => runBulk('archive')}>
            Archive
          </button>
          <button
            type="button"
            className="btn danger"
            disabled={bulkBusy}
            onClick={() => {
              if (confirm(`Delete ${selected.size} applications?`)) runBulk('delete');
            }}
          >
            Delete
          </button>
        </div>
      ) : null}

      {error && <p className="error">{error}</p>}

      {groups ? (
        <div className="group-stack">
          {groups.map((g) => (
            <section key={g.key} className="panel group-panel">
              <div className="group-head">
                <h2>
                  {g.key} <span className="muted">({g.count})</span>
                </h2>
              </div>
              {renderTable(g.items)}
            </section>
          ))}
        </div>
      ) : (
        renderTable(apps)
      )}
    </div>
  );
}
