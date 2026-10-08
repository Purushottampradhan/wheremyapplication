import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Application, TimelineEvent } from '../types';
import {
  SOURCES,
  STATUSES,
  STATUS_LABELS,
  type ApplicationStatus,
} from '../types';

export function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [matching, setMatching] = useState(false);
  const [groqConfigured, setGroqConfigured] = useState(false);

  async function load() {
    if (!id) return;
    const [a, t] = await Promise.all([
      api<{ application: Application; groqConfigured?: boolean }>(
        `/api/applications/${id}`
      ),
      api<{ events: TimelineEvent[] }>(`/api/applications/${id}/timeline`),
    ]);
    setApp(a.application);
    setGroqConfigured(Boolean(a.groqConfigured));
    setEvents(t.events);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, [id]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!app || !id) return;
    setSaving(true);
    setError('');
    try {
      const data = await api<{ application: Application }>(`/api/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          company: app.company,
          roleTitle: app.roleTitle,
          location: app.location,
          jobUrl: app.jobUrl,
          source: app.source,
          status: app.status,
          notes: app.notes,
          salaryRange: app.salaryRange,
          jobDescription: app.jobDescription,
          followUpAt: app.followUpAt,
          employmentType: app.employmentType,
          workplaceType: app.workplaceType,
          experienceLevel: app.experienceLevel,
          requiredSkills: app.requiredSkills,
          preferredSkills: app.preferredSkills,
          responsibilities: app.responsibilities,
          requirements: app.requirements,
          benefits: app.benefits,
          companyDescription: app.companyDescription,
          companyIndustry: app.companyIndustry,
          companySize: app.companySize,
          recruiterName: app.recruiterName,
          recruiterEmail: app.recruiterEmail,
          applicationDeadline: app.applicationDeadline,
          aiSummary: app.aiSummary,
          tags: app.tags,
          priority: app.priority,
          archived: app.archived,
        }),
      });
      setApp(data.application);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function enrich() {
    if (!id) return;
    setEnriching(true);
    setError('');
    try {
      const data = await api<{ application: Application }>(`/api/applications/${id}/enrich`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setApp(data.application);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrich failed');
    } finally {
      setEnriching(false);
    }
  }

  async function runMatch() {
    if (!id) return;
    setMatching(true);
    setError('');
    try {
      const data = await api<{ application: Application }>(`/api/applications/${id}/match`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setApp(data.application);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Match failed');
    } finally {
      setMatching(false);
    }
  }

  async function addNote(e: FormEvent) {
    e.preventDefault();
    if (!id || !note.trim()) return;
    await api(`/api/applications/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ message: note.trim() }),
    });
    setNote('');
    await load();
  }

  async function remove() {
    if (!id || !confirm('Delete this application?')) return;
    await api(`/api/applications/${id}`, { method: 'DELETE' });
    navigate('/applications');
  }

  if (!app) return <p className="muted">{error || 'Loading…'}</p>;

  const skillsText = (app.requiredSkills || []).join(', ');
  const preferredText = (app.preferredSkills || []).join(', ');
  const tagsText = (app.tags || []).join(', ');

  return (
    <div className="page wide">
      <div className="page-head">
        <div>
          <p className="eyebrow">
            <Link to="/applications">Applications</Link>
          </p>
          <h1>{app.roleTitle}</h1>
          <p className="muted">
            {app.company}
            {app.location ? ` · ${app.location}` : ''}
            {app.aiEnrichedAt
              ? ` · AI enriched ${new Date(app.aiEnrichedAt).toLocaleDateString()}`
              : ''}
          </p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn ghost"
            onClick={runMatch}
            disabled={matching || !groqConfigured}
            title="Compare your resume text to this JD"
          >
            {matching ? 'Matching…' : 'Resume↔JD match'}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={enrich}
            disabled={enriching || !groqConfigured}
            title={
              groqConfigured
                ? 'Fill missing fields with Groq from saved page text'
                : 'Set GROQ_API_KEY in server/.env'
            }
          >
            {enriching ? 'Enriching…' : 'AI enrich'}
          </button>
          <button type="button" className="btn danger" onClick={remove}>
            Delete
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {app.aiSummary ? (
        <section className="panel ai-summary">
          <h2>AI summary</h2>
          <p>{app.aiSummary}</p>
        </section>
      ) : null}

      {app.matchScore != null || app.matchDetails?.summary ? (
        <section className="panel match-panel">
          <div className="match-head">
            <h2>Resume ↔ JD match</h2>
            {app.matchScore != null ? (
              <strong className="match-score">{app.matchScore}/100</strong>
            ) : null}
          </div>
          {app.matchDetails?.summary ? <p>{app.matchDetails.summary}</p> : null}
          <div className="two-col tight">
            <div>
              <h3>Matched skills</h3>
              <div className="tag-cloud">
                {(app.matchDetails?.matchedSkills || []).map((s) => (
                  <span key={s} className="tag">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3>Missing skills</h3>
              <div className="tag-cloud">
                {(app.matchDetails?.missingSkills || []).map((s) => (
                  <span key={s} className="tag">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {(app.matchDetails?.suggestions || []).length > 0 ? (
            <>
              <h3>Suggestions</h3>
              <ul>
                {(app.matchDetails?.suggestions || []).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}

      <div className="two-col">
        <form className="panel stack" onSubmit={save}>
          <div className="row">
            <label>
              Role title
              <input
                value={app.roleTitle}
                onChange={(e) => setApp({ ...app, roleTitle: e.target.value })}
                required
              />
            </label>
            <label>
              Company
              <input
                value={app.company}
                onChange={(e) => setApp({ ...app, company: e.target.value })}
                required
              />
            </label>
          </div>
          <div className="row">
            <label>
              Location
              <input
                value={app.location || ''}
                onChange={(e) => setApp({ ...app, location: e.target.value })}
              />
            </label>
            <label>
              Workplace
              <input
                value={app.workplaceType || ''}
                onChange={(e) => setApp({ ...app, workplaceType: e.target.value })}
                placeholder="Remote / Hybrid / On-site"
              />
            </label>
          </div>
          <div className="row">
            <label>
              Employment type
              <input
                value={app.employmentType || ''}
                onChange={(e) => setApp({ ...app, employmentType: e.target.value })}
              />
            </label>
            <label>
              Experience level
              <input
                value={app.experienceLevel || ''}
                onChange={(e) => setApp({ ...app, experienceLevel: e.target.value })}
              />
            </label>
          </div>
          <label>
            Job URL
            <input
              value={app.jobUrl || ''}
              onChange={(e) => setApp({ ...app, jobUrl: e.target.value })}
            />
          </label>
          <div className="row">
            <label>
              Source
              <select
                value={app.source}
                onChange={(e) =>
                  setApp({ ...app, source: e.target.value as Application['source'] })
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
                value={app.status}
                onChange={(e) =>
                  setApp({ ...app, status: e.target.value as ApplicationStatus })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select
                value={app.priority || 'medium'}
                onChange={(e) =>
                  setApp({
                    ...app,
                    priority: e.target.value as Application['priority'],
                  })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
          <div className="row">
            <label>
              Salary range
              <input
                value={app.salaryRange || ''}
                onChange={(e) => setApp({ ...app, salaryRange: e.target.value })}
              />
            </label>
            <label>
              Deadline
              <input
                value={app.applicationDeadline || ''}
                onChange={(e) =>
                  setApp({ ...app, applicationDeadline: e.target.value })
                }
              />
            </label>
            <label>
              Follow up date
              <input
                type="date"
                value={
                  app.followUpAt
                    ? new Date(app.followUpAt).toISOString().slice(0, 10)
                    : ''
                }
                onChange={(e) =>
                  setApp({
                    ...app,
                    followUpAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
              />
            </label>
          </div>
          <label>
            Required skills (comma separated)
            <input
              value={skillsText}
              onChange={(e) =>
                setApp({
                  ...app,
                  requiredSkills: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
          <label>
            Preferred skills
            <input
              value={preferredText}
              onChange={(e) =>
                setApp({
                  ...app,
                  preferredSkills: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
          <label>
            Tags
            <input
              value={tagsText}
              onChange={(e) =>
                setApp({
                  ...app,
                  tags: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
          <div className="row">
            <label>
              Industry
              <input
                value={app.companyIndustry || ''}
                onChange={(e) => setApp({ ...app, companyIndustry: e.target.value })}
              />
            </label>
            <label>
              Company size
              <input
                value={app.companySize || ''}
                onChange={(e) => setApp({ ...app, companySize: e.target.value })}
              />
            </label>
          </div>
          <label>
            Company description
            <textarea
              rows={3}
              value={app.companyDescription || ''}
              onChange={(e) => setApp({ ...app, companyDescription: e.target.value })}
            />
          </label>
          <label>
            Responsibilities
            <textarea
              rows={4}
              value={app.responsibilities || ''}
              onChange={(e) => setApp({ ...app, responsibilities: e.target.value })}
            />
          </label>
          <label>
            Requirements
            <textarea
              rows={4}
              value={app.requirements || ''}
              onChange={(e) => setApp({ ...app, requirements: e.target.value })}
            />
          </label>
          <label>
            Benefits
            <textarea
              rows={3}
              value={app.benefits || ''}
              onChange={(e) => setApp({ ...app, benefits: e.target.value })}
            />
          </label>
          <label>
            Notes
            <textarea
              rows={3}
              value={app.notes || ''}
              onChange={(e) => setApp({ ...app, notes: e.target.value })}
            />
          </label>
          <label>
            Job description
            <textarea
              rows={8}
              value={app.jobDescription || ''}
              onChange={(e) => setApp({ ...app, jobDescription: e.target.value })}
            />
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={Boolean(app.archived)}
              onChange={(e) => setApp({ ...app, archived: e.target.checked })}
            />
            Archived
          </label>
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {app.jobUrl && (
            <a className="btn ghost" href={app.jobUrl} target="_blank" rel="noreferrer">
              Open job page
            </a>
          )}
        </form>

        <div className="stack">
          <section className="panel">
            <h2>Timeline</h2>
            <ul className="timeline">
              {events.map((ev) => (
                <li key={ev._id}>
                  <time>{new Date(ev.createdAt).toLocaleString()}</time>
                  <strong>{ev.type.replace(/_/g, ' ')}</strong>
                  <p>{ev.message}</p>
                </li>
              ))}
            </ul>
          </section>
          <form className="panel stack" onSubmit={addNote}>
            <h2>Add note</h2>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Interview feedback, recruiter name…"
            />
            <button className="btn" type="submit">
              Add note
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
