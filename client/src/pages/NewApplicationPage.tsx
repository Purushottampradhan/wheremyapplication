import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { SOURCES, STATUSES, STATUS_LABELS, type ApplicationSource, type ApplicationStatus } from '../types';

export function NewApplicationPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    company: '',
    roleTitle: '',
    location: '',
    jobUrl: '',
    source: 'manual' as ApplicationSource,
    status: 'applied' as ApplicationStatus,
    notes: '',
    salaryRange: '',
    jobDescription: '',
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api<{ application: { _id: string } }>('/api/applications', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      navigate(`/applications/${data.application._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>Add application</h1>
      <p className="muted">Manual entry for roles you did not capture with the extension.</p>
      <form className="panel stack" onSubmit={onSubmit}>
        <label>
          Role title
          <input
            required
            value={form.roleTitle}
            onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
          />
        </label>
        <label>
          Company
          <input
            required
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
        </label>
        <label>
          Location
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </label>
        <label>
          Job URL
          <input
            value={form.jobUrl}
            onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
          />
        </label>
        <div className="row">
          <label>
            Source
            <select
              value={form.source}
              onChange={(e) =>
                setForm({ ...form, source: e.target.value as ApplicationSource })
              }
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as ApplicationStatus })
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Salary range
          <input
            value={form.salaryRange}
            onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
          />
        </label>
        <label>
          Notes
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>
        <label>
          Job description
          <textarea
            rows={6}
            value={form.jobDescription}
            onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save application'}
        </button>
      </form>
    </div>
  );
}
