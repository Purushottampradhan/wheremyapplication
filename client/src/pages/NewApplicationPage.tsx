import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import {
  SOURCES,
  SOURCE_LABELS,
  STATUSES,
  STATUS_LABELS,
  type ApplicationSource,
  type ApplicationStatus,
} from '../types';

const empty = {
  company: '',
  roleTitle: '',
  location: '',
  jobUrl: '',
  source: 'manual' as ApplicationSource,
  status: 'applied' as ApplicationStatus,
  notes: '',
  salaryRange: '',
  jobDescription: '',
  employmentType: '',
  workplaceType: '',
  experienceLevel: '',
  priority: 'medium',
  followUpAt: '',
  requiredSkills: '',
  preferredSkills: '',
  tags: '',
};

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function NewApplicationPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [duplicate, setDuplicate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(empty);

  function set<K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDuplicate(false);
  }

  async function onSubmit(event: { preventDefault(): void }, forceDuplicate = false) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api<{ application: { _id: string } }>('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          company: form.company,
          roleTitle: form.roleTitle,
          location: form.location,
          jobUrl: form.jobUrl,
          source: form.source,
          status: form.status,
          notes: form.notes,
          salaryRange: form.salaryRange,
          jobDescription: form.jobDescription,
          employmentType: form.employmentType,
          workplaceType: form.workplaceType,
          experienceLevel: form.experienceLevel,
          priority: form.priority,
          forceDuplicate,
          followUpAt: form.followUpAt ? new Date(form.followUpAt).toISOString() : undefined,
          requiredSkills: splitList(form.requiredSkills),
          preferredSkills: splitList(form.preferredSkills),
          tags: splitList(form.tags),
        }),
      });
      navigate(`/applications/${data.application._id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setDuplicate(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page form-page">
      <div className="page-head">
        <div>
          <h2>New application</h2>
          <p className="muted">Company and role are required. Recruiter details can be added after you save.</p>
        </div>
        <Link className="btn ghost" to="/applications">Cancel</Link>
      </div>
      <form className="stack" onSubmit={(event) => onSubmit(event, false)}>
        <fieldset className="form-section">
          <legend>Basic job information</legend>
          <div className="form-grid">
            <label>
              Company
              <input required value={form.company} onChange={(e) => set('company', e.target.value)} />
            </label>
            <label>
              Job title
              <input required value={form.roleTitle} onChange={(e) => set('roleTitle', e.target.value)} />
            </label>
            <label className="span-2">
              Job URL
              <input type="url" placeholder="https://" value={form.jobUrl} onChange={(e) => set('jobUrl', e.target.value)} />
            </label>
            <label>
              Location
              <input value={form.location} onChange={(e) => set('location', e.target.value)} />
            </label>
            <label>
              Source
              <select value={form.source} onChange={(e) => set('source', e.target.value as ApplicationSource)}>
                {SOURCES.map((item) => <option key={item} value={item}>{SOURCE_LABELS[item]}</option>)}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Status and priority</legend>
          <div className="form-grid">
            <label>
              Status
              <select value={form.status} onChange={(e) => set('status', e.target.value as ApplicationStatus)}>
                {STATUSES.map((item) => <option key={item} value={item}>{STATUS_LABELS[item]}</option>)}
              </select>
            </label>
            <label>
              Priority
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Salary and employment</legend>
          <div className="form-grid">
            <label className="span-2">
              Salary range
              <input placeholder="15-20 LPA or $120k–$150k" value={form.salaryRange} onChange={(e) => set('salaryRange', e.target.value)} />
            </label>
            <label>
              Employment type
              <input value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)} />
            </label>
            <label>
              Workplace type
              <input placeholder="Remote, hybrid, on-site" value={form.workplaceType} onChange={(e) => set('workplaceType', e.target.value)} />
            </label>
            <label>
              Experience level
              <input value={form.experienceLevel} onChange={(e) => set('experienceLevel', e.target.value)} />
            </label>
          </div>
        </fieldset>

        <details className="form-section">
          <summary className="section-label">Job description and skills</summary>
          <div className="stack" style={{ marginTop: '0.75rem' }}>
            <label>
              Job description
              <textarea rows={6} value={form.jobDescription} onChange={(e) => set('jobDescription', e.target.value)} />
            </label>
            <label>
              Required skills
              <input placeholder="Comma separated" value={form.requiredSkills} onChange={(e) => set('requiredSkills', e.target.value)} />
            </label>
            <label>
              Preferred skills
              <input placeholder="Comma separated" value={form.preferredSkills} onChange={(e) => set('preferredSkills', e.target.value)} />
            </label>
          </div>
        </details>

        <details className="form-section">
          <summary className="section-label">Notes, tags, and follow-up</summary>
          <div className="stack" style={{ marginTop: '0.75rem' }}>
            <label>
              Follow-up date
              <input type="date" value={form.followUpAt} onChange={(e) => set('followUpAt', e.target.value)} />
            </label>
            <label>
              Notes
              <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </label>
            <label>
              Tags
              <input placeholder="Comma separated" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
            </label>
          </div>
        </details>

        {duplicate ? (
          <div className="banner info" role="status">
            <p>This company and role, or this job URL, is already in your active applications.</p>
            <button type="button" className="btn primary" disabled={busy} onClick={(event) => onSubmit(event, true)}>
              {busy ? 'Saving…' : 'Save anyway'}
            </button>
          </div>
        ) : null}
        {error ? <p className="banner error">{error}</p> : null}
        <div className="form-actions">
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save application'}
          </button>
          <Link className="btn ghost" to="/applications">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
