import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, ExternalLink, Mail, Plus, Search } from 'lucide-react';
import { api, API_URL, getToken } from '../api/client';
import { CompanyMark, EmptyState } from '../components/visuals';
import type { Application, ApplicationStatus } from '../types';
import { SOURCE_LABELS, SOURCES, STATUSES, STATUS_LABELS } from '../types';

type Group = { key: string; count: number; items: Application[] };

export function ApplicationsPage() {
  const [params, setParams] = useSearchParams();
  const [apps, setApps] = useState<Application[]>([]);
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [inboxBusy, setInboxBusy] = useState(false);
  const [inboxNote, setInboxNote] = useState('');

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

  function clearFilters() {
    setParams(new URLSearchParams());
  }

  const load = useCallback(() => {
    api<{ applications: Application[]; groups?: Group[] }>(`/api/applications${query ? `?${query}` : ''}`)
      .then((data) => {
        setApps(data.applications);
        setGroups(data.groups || null);
        setSelected(new Set());
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

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
    if (list.every((a) => selected.has(a._id))) setSelected(new Set());
    else setSelected(new Set(list.map((a) => a._id)));
  }

  async function runBulk(action: string, value?: string) {
    if (!selected.size) return;
    setBulkBusy(true);
    setError('');
    try {
      await api('/api/applications/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids: [...selected], action, value }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setBulkBusy(false);
    }
  }

  async function checkInbox() {
    setError('');
    setInboxNote('');
    setInboxBusy(true);
    try {
      const result = await api<{
        checked: number;
        updated: Array<{ roleTitle: string; company: string; toStatus: string }>;
        unmatched: number;
      }>('/api/inbox/sync', { method: 'POST' });
      const changes = result.updated.map((item) => `${item.roleTitle} at ${item.company} → ${item.toStatus}`).join('; ');
      setInboxNote(
        result.updated.length
          ? `Updated ${result.updated.length} from ${result.checked} recent messages. ${changes}`
          : `Checked ${result.checked} recent messages. No status change. ${result.unmatched} did not match a saved job.`
      );
      if (result.updated.length) load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inbox check failed');
    } finally {
      setInboxBusy(false);
    }
  }

  function exportCsv() {
    const token = getToken();
    fetch(`${API_URL || ''}/api/applications/export.csv`, {
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

  const filtersOn = Boolean(status || source || search || company || groupBy || priority || archived || sort !== 'appliedAt');

  function renderRow(app: Application) {
    return (
      <tr key={app._id} className={selected.has(app._id) ? 'row-selected' : ''}>
        <td>
          <input type="checkbox" checked={selected.has(app._id)} onChange={() => toggleSelect(app._id)} aria-label={`Select ${app.roleTitle}`} />
        </td>
        <td>
          <div className="identity">
            <CompanyMark name={app.company} />
            <div>
              <div className="title-row">
                <Link to={`/applications/${app._id}`} className="app-title-link" title={app.roleTitle}>
                  <strong className="clip-text">{app.roleTitle}</strong>
                  {app.aiEnrichedAt ? <span className="badge ai">AI</span> : null}
                </Link>
                <JobLink url={app.jobUrl} label={app.roleTitle} />
              </div>
              <button type="button" className="linkish" title={app.company} onClick={() => setParam('company', app.company)}>
                {app.company}
              </button>
            </div>
          </div>
        </td>
        <td className="muted-cell">
          <span className="clip-text" title={app.location || ''}>{app.location || '—'}</span>
        </td>
        <td>{SOURCE_LABELS[app.source] || app.source}</td>
        <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
        <td>
          <select
            className={`status-select ${app.status}`}
            value={app.status}
            disabled={busyId === app._id}
            aria-label={`Status for ${app.roleTitle}`}
            onChange={(e) => changeStatus(app._id, e.target.value as ApplicationStatus)}
          >
            {STATUSES.map((item) => (
              <option key={item} value={item}>{STATUS_LABELS[item]}</option>
            ))}
          </select>
        </td>
        <td>
          <span className={`priority-badge ${app.priority || 'medium'}`}>{app.priority || 'medium'}</span>
        </td>
        <td>{app.workplaceType || '—'}</td>
        <td>{app.matchScore != null ? `${app.matchScore}` : '—'}</td>
      </tr>
    );
  }

  function renderCards(list: Application[]) {
    return (
      <div className="app-cards">
        {list.map((app) => (
          <article key={app._id} className={`job-card ${selected.has(app._id) ? 'row-selected' : ''}`}>
            <div className="identity">
              <input type="checkbox" checked={selected.has(app._id)} onChange={() => toggleSelect(app._id)} aria-label={`Select ${app.roleTitle}`} />
              <CompanyMark name={app.company} />
              <div>
                <div className="title-row">
                  <Link to={`/applications/${app._id}`}><strong>{app.roleTitle}</strong></Link>
                  <JobLink url={app.jobUrl} label={app.roleTitle} />
                </div>
                <span>{app.company}</span>
              </div>
            </div>
            <p className="muted">
              {app.location || 'Location unknown'} · {SOURCE_LABELS[app.source] || app.source} · {new Date(app.appliedAt).toLocaleDateString()}
            </p>
            <div className="chip-row">
              <span className={`priority-badge ${app.priority || 'medium'}`}>{app.priority || 'medium'}</span>
              <span className="status-badge">{app.workplaceType || 'Workplace unknown'}</span>
              {app.matchScore != null ? <span className="match-pill">Match {app.matchScore}</span> : null}
            </div>
            <select
              className={`status-select ${app.status}`}
              value={app.status}
              disabled={busyId === app._id}
              aria-label={`Status for ${app.roleTitle}`}
              onChange={(e) => changeStatus(app._id, e.target.value as ApplicationStatus)}
            >
              {STATUSES.map((item) => (
                <option key={item} value={item}>{STATUS_LABELS[item]}</option>
              ))}
            </select>
          </article>
        ))}
      </div>
    );
  }

  function renderTable(list: Application[]) {
    return (
      <>
        <div className="table-wrap apps-table-desktop">
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
                <th>Location</th>
                <th>Source</th>
                <th>Applied</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Workplace</th>
                <th>Match</th>
              </tr>
            </thead>
            <tbody>{list.map(renderRow)}</tbody>
          </table>
        </div>
        {renderCards(list)}
        {list.length === 0 ? (
          <EmptyState
            title={filtersOn ? 'No results match these filters.' : 'Your job pipeline starts here.'}
            detail={filtersOn ? 'Try clearing a filter or searching a different company.' : 'Add an application to start tracking it here.'}
            action={filtersOn ? <button type="button" className="btn" onClick={clearFilters}>Clear filters</button> : <Link className="btn primary" to="/applications/new">Add application</Link>}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className="page wide">
      <div className="page-head">
        <div>
          <h2>Applications</h2>
          <p className="muted">
            {apps.length} shown{selected.size ? ` · ${selected.size} selected` : ''}
          </p>
        </div>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={checkInbox} disabled={inboxBusy}>
            <Mail size={16} aria-hidden="true" /> {inboxBusy ? 'Checking inbox…' : 'Check inbox'}
          </button>
          <button type="button" className="btn ghost" onClick={exportCsv}>
            <Download size={16} aria-hidden="true" /> Export CSV
          </button>
          <Link className="btn primary" to="/applications/new">
            <Plus size={16} aria-hidden="true" /> Add application
          </Link>
        </div>
      </div>

      <form className="filter-bar panel" onSubmit={onSearch}>
        <div className="chip-row" role="group" aria-label="Filter by status">
          <button type="button" className={`chip ${status ? '' : 'is-on'}`} onClick={() => setParam('status', '')}>All</button>
          {STATUSES.map((item) => (
            <button
              key={item}
              type="button"
              className={`chip status-${item} ${status === item ? 'is-on' : ''}`}
              onClick={() => setParam('status', status === item ? '' : item)}
            >
              {STATUS_LABELS[item]}
            </button>
          ))}
        </div>
        <div className="filter-controls">
          <div className="search-field">
            <Search size={16} aria-hidden="true" />
            <input name="q" defaultValue={search} placeholder="Search role, company, skills, tags…" aria-label="Search applications" />
          </div>
          <select value={source} onChange={(e) => setParam('source', e.target.value)} aria-label="Source">
            <option value="">All sources</option>
            {SOURCES.map((item) => (
              <option key={item} value={item}>{SOURCE_LABELS[item]}</option>
            ))}
          </select>
          <select value={priority} onChange={(e) => setParam('priority', e.target.value)} aria-label="Priority">
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={groupBy} onChange={(e) => setParam('groupBy', e.target.value)} aria-label="Group">
            <option value="">No grouping</option>
            <option value="company">Group by company</option>
            <option value="status">Group by status</option>
            <option value="source">Group by source</option>
          </select>
          <select value={sort} onChange={(e) => setParam('sort', e.target.value)} aria-label="Sort">
            <option value="appliedAt">Sort: newest applied</option>
            <option value="updatedAt">Sort: recently updated</option>
            <option value="company">Sort: company A–Z</option>
          </select>
          <select value={archived} onChange={(e) => setParam('archived', e.target.value)} aria-label="Archive">
            <option value="">Active only</option>
            <option value="true">Archived only</option>
            <option value="all">Active + archived</option>
          </select>
          <button className="btn" type="submit">Search</button>
          {filtersOn ? (
            <button type="button" className="btn ghost" onClick={clearFilters}>Clear filters</button>
          ) : null}
        </div>
        {company ? <p className="muted">Company filter: {company}</p> : null}
      </form>

      {selected.size > 0 ? (
        <div className="bulk-bar">
          <span>{selected.size} selected</span>
          <select disabled={bulkBusy} defaultValue="" onChange={(e) => { if (e.target.value) runBulk('status', e.target.value); e.target.value = ''; }}>
            <option value="">Set status…</option>
            {STATUSES.map((item) => <option key={item} value={item}>{STATUS_LABELS[item]}</option>)}
          </select>
          <select disabled={bulkBusy} defaultValue="" onChange={(e) => { if (e.target.value) runBulk('priority', e.target.value); e.target.value = ''; }}>
            <option value="">Set priority…</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button type="button" className="btn ghost" disabled={bulkBusy} onClick={() => runBulk('archive')}>Archive</button>
          {archived === 'true' || archived === 'all' ? (
            <button type="button" className="btn ghost" disabled={bulkBusy} onClick={() => runBulk('unarchive')}>Restore</button>
          ) : null}
          <button type="button" className="btn danger" disabled={bulkBusy} onClick={() => { if (confirm(`Delete ${selected.size} applications?`)) runBulk('delete'); }}>
            Delete
          </button>
        </div>
      ) : null}

      {error ? <p className="banner error">{error}</p> : null}
      {inboxNote ? <p className="banner ok" role="status">{inboxNote}</p> : null}

      {groups ? (
        <div className="group-stack">
          {groups.map((group) => (
            <section key={group.key} className="panel group-panel">
              <div className="group-head">
                <h2>{group.key} <span className="muted">({group.count})</span></h2>
              </div>
              {renderTable(group.items)}
            </section>
          ))}
        </div>
      ) : (
        renderTable(apps)
      )}
    </div>
  );
}

function JobLink({ url, label }: { url: string; label: string }) {
  const href = url.trim();
  if (!href) return null;
  return (
    <a className="open-out" href={href} target="_blank" rel="noreferrer" aria-label={`Open job link for ${label}`} title="Open job link">
      <ExternalLink size={14} aria-hidden="true" />
    </a>
  );
}
