import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRightLeft, ExternalLink, Plus, Puzzle, StickyNote } from 'lucide-react';
import { api } from '../api/client';
import { EmptyState, ScoreRing } from '../components/visuals';
import type { Application, TimelineEvent } from '../types';
import { SOURCES, SOURCE_LABELS, STATUSES, STATUS_LABELS, type ApplicationStatus } from '../types';

function listText(values: string[] = []) {
  return values.join(', ');
}

function timelineTone(type: string) {
  if (type === 'created') return { className: 'tl-created', label: 'Application created', icon: <Plus size={14} /> };
  if (type === 'status_change') return { className: 'tl-status', label: 'Status changed', icon: <ArrowRightLeft size={14} /> };
  if (type === 'note') return { className: 'tl-note', label: 'Note added', icon: <StickyNote size={14} /> };
  if (type === 'extension_capture') return { className: 'tl-capture', label: 'Chrome extension capture', icon: <Puzzle size={14} /> };
  return { className: 'tl-other', label: type.replace(/_/g, ' '), icon: <Plus size={14} /> };
}

export function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [matching, setMatching] = useState(false);
  const [groqConfigured, setGroqConfigured] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [application, timeline] = await Promise.all([
      api<{ application: Application; groqConfigured?: boolean }>(`/api/applications/${id}`),
      api<{ events: TimelineEvent[] }>(`/api/applications/${id}/timeline`),
    ]);
    setApp(application.application);
    setGroqConfigured(Boolean(application.groqConfigured));
    setEvents(timeline.events);
  }, [id]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, [load]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!app || !id) return;
    setSaving(true);
    setError('');
    setSaved('');
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
      setSaved('Changes saved');
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

  async function addNote(event: FormEvent) {
    event.preventDefault();
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

  const matched = app.matchDetails?.matchedSkills || [];
  const missing = app.matchDetails?.missingSkills || [];
  const hasMatch = app.matchScore != null || Boolean(app.matchDetails?.summary);

  return (
    <div className="page wide">
      <div className="detail-hero">
        <div>
          <p className="eyebrow"><Link to="/applications">Applications</Link></p>
          <h1>{app.roleTitle}</h1>
          <p className="muted">{app.company}{app.location ? ` · ${app.location}` : ''}</p>
          <p>
            <span className={`status-badge ${app.status}`}>{STATUS_LABELS[app.status]}</span>{' '}
            <span className={`priority-badge ${app.priority || 'medium'}`}>{app.priority || 'medium'} priority</span>
          </p>
        </div>
        <div className="actions">
          {app.jobUrl ? (
            <a className="btn ghost" href={app.jobUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={15} aria-hidden="true" /> Job link
            </a>
          ) : null}
          <button type="button" className="btn ghost" onClick={runMatch} disabled={matching || !groqConfigured}>
            {matching ? 'Matching…' : 'Resume match'}
          </button>
          <button type="button" className="btn ghost" onClick={enrich} disabled={enriching || !groqConfigured}>
            {enriching ? 'Enriching…' : 'AI enrich'}
          </button>
          <button type="button" className="btn danger" onClick={remove}>Delete</button>
        </div>
      </div>

      {error ? <p className="banner error">{error}</p> : null}
      {saved ? <p className="banner ok" role="status">{saved}</p> : null}

      <div className="fact-row">
        <div className="fact"><span>Salary</span><strong>{app.salaryRange || 'Not saved'}</strong></div>
        <div className="fact"><span>Workplace</span><strong>{app.workplaceType || 'Unknown'}</strong></div>
        <div className="fact"><span>Follow-up</span><strong>{app.followUpAt ? new Date(app.followUpAt).toLocaleDateString() : 'None set'}</strong></div>
        <div className="fact"><span>Deadline</span><strong>{app.applicationDeadline || 'None set'}</strong></div>
      </div>

      <div className="two-col">
        <section className="panel">
          <h2>Resume match</h2>
          {hasMatch && app.matchScore != null ? (
            <div className="match-layout">
              <ScoreRing score={app.matchScore} />
              <div>
                {app.matchDetails?.summary ? <p>{app.matchDetails.summary}</p> : null}
                <h3>Matched skills</h3>
                <div className="tag-cloud">
                  {matched.length ? matched.map((skill) => <span key={skill} className="skill-chip matched">{skill}</span>) : <span className="muted">None listed</span>}
                </div>
                <h3>Missing skills</h3>
                <div className="tag-cloud">
                  {missing.length ? missing.map((skill) => <span key={skill} className="skill-chip missing">{skill}</span>) : <span className="muted">None listed</span>}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title={groqConfigured ? 'Add resume text to unlock job-match insights.' : 'AI matching is not configured.'}
              detail={groqConfigured ? 'Paste resume text on your profile, then run Resume match. The score comes only from that response.' : 'Set GROQ_API_KEY on the server to score this job against your resume.'}
              action={<Link className="btn" to="/profile">Open profile</Link>}
            />
          )}
          {(app.matchDetails?.strengths || []).length > 0 ? (
            <>
              <h3>Strengths</h3>
              <ul>{app.matchDetails?.strengths?.map((item) => <li key={item}>{item}</li>)}</ul>
            </>
          ) : null}
          {(app.matchDetails?.gaps || []).length > 0 ? (
            <>
              <h3>Gaps</h3>
              <ul>{app.matchDetails?.gaps?.map((item) => <li key={item}>{item}</li>)}</ul>
            </>
          ) : null}
          {(app.matchDetails?.suggestions || []).length > 0 ? (
            <>
              <h3>Suggestions</h3>
              <ul>{app.matchDetails?.suggestions?.map((item) => <li key={item}>{item}</li>)}</ul>
            </>
          ) : null}
        </section>

        <section className="panel">
          <h2>AI summary</h2>
          {app.aiSummary ? <p>{app.aiSummary}</p> : (
            <EmptyState
              title={groqConfigured ? 'No AI summary yet.' : 'AI enrichment is not configured.'}
              detail={groqConfigured ? 'Run AI enrich to fill skills, salary, workplace, and a summary from the saved job text.' : 'Add a Groq API key on the server, then enrich this application.'}
            />
          )}
          {(app.requiredSkills || []).length > 0 ? (
            <>
              <h3>Extracted skills</h3>
              <div className="tag-cloud">{app.requiredSkills?.map((skill) => <span key={skill} className="tag">{skill}</span>)}</div>
            </>
          ) : null}
          <h3>Employment</h3>
          <p className="muted">{[app.employmentType, app.workplaceType, app.experienceLevel].filter(Boolean).join(' · ') || 'No employment details yet.'}</p>
          {app.responsibilities ? <><h3>Responsibilities</h3><p>{app.responsibilities}</p></> : null}
          {app.requirements ? <><h3>Requirements</h3><p>{app.requirements}</p></> : null}
          {app.benefits ? <><h3>Benefits</h3><p>{app.benefits}</p></> : null}
        </section>
      </div>

      <form className="stack" onSubmit={save}>
        <fieldset className="form-section">
          <legend>Basic job information</legend>
          <div className="form-grid">
            <label>Role title<input required value={app.roleTitle} onChange={(e) => setApp({ ...app, roleTitle: e.target.value })} /></label>
            <label>Company<input required value={app.company} onChange={(e) => setApp({ ...app, company: e.target.value })} /></label>
            <label>Location<input value={app.location || ''} onChange={(e) => setApp({ ...app, location: e.target.value })} /></label>
            <label className="span-2">Job URL<input value={app.jobUrl || ''} onChange={(e) => setApp({ ...app, jobUrl: e.target.value })} /></label>
          </div>
        </fieldset>
        <fieldset className="form-section">
          <legend>Status and priority</legend>
          <div className="form-grid">
            <label>
              Source
              <select value={app.source} onChange={(e) => setApp({ ...app, source: e.target.value as Application['source'] })}>
                {SOURCES.map((item) => <option key={item} value={item}>{SOURCE_LABELS[item]}</option>)}
              </select>
            </label>
            <label>
              Status
              <select value={app.status} onChange={(e) => setApp({ ...app, status: e.target.value as ApplicationStatus })}>
                {STATUSES.map((item) => <option key={item} value={item}>{STATUS_LABELS[item]}</option>)}
              </select>
            </label>
            <label>
              Priority
              <select value={app.priority || 'medium'} onChange={(e) => setApp({ ...app, priority: e.target.value as Application['priority'] })}>
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
            <label>Salary range<input value={app.salaryRange || ''} onChange={(e) => setApp({ ...app, salaryRange: e.target.value })} /></label>
            <label>Workplace<input value={app.workplaceType || ''} placeholder="Remote / Hybrid / On-site" onChange={(e) => setApp({ ...app, workplaceType: e.target.value })} /></label>
            <label>Employment type<input value={app.employmentType || ''} onChange={(e) => setApp({ ...app, employmentType: e.target.value })} /></label>
            <label>Experience level<input value={app.experienceLevel || ''} onChange={(e) => setApp({ ...app, experienceLevel: e.target.value })} /></label>
          </div>
        </fieldset>
        <fieldset className="form-section">
          <legend>Job description and skills</legend>
          <div className="stack">
            <label>Job description<textarea rows={8} value={app.jobDescription || ''} onChange={(e) => setApp({ ...app, jobDescription: e.target.value })} /></label>
            <label>
              Required skills
              <input value={listText(app.requiredSkills)} onChange={(e) => setApp({ ...app, requiredSkills: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} />
            </label>
            <label>
              Preferred skills
              <input value={listText(app.preferredSkills)} onChange={(e) => setApp({ ...app, preferredSkills: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} />
            </label>
          </div>
        </fieldset>
        <fieldset className="form-section">
          <legend>Recruiter and company</legend>
          <div className="form-grid">
            <label>Recruiter name<input value={app.recruiterName || ''} onChange={(e) => setApp({ ...app, recruiterName: e.target.value })} /></label>
            <label>Recruiter email<input type="email" value={app.recruiterEmail || ''} onChange={(e) => setApp({ ...app, recruiterEmail: e.target.value })} /></label>
            <label>Industry<input value={app.companyIndustry || ''} onChange={(e) => setApp({ ...app, companyIndustry: e.target.value })} /></label>
            <label>Company size<input value={app.companySize || ''} onChange={(e) => setApp({ ...app, companySize: e.target.value })} /></label>
            <label className="span-2">Company description<textarea rows={3} value={app.companyDescription || ''} onChange={(e) => setApp({ ...app, companyDescription: e.target.value })} /></label>
          </div>
        </fieldset>
        <details className="form-section">
          <summary className="section-label">Notes, tags, deadlines, and more</summary>
          <div className="stack" style={{ marginTop: '0.75rem' }}>
            <div className="form-grid">
              <label>
                Deadline
                <input value={app.applicationDeadline || ''} onChange={(e) => setApp({ ...app, applicationDeadline: e.target.value })} />
              </label>
              <label>
                Follow-up date
                <input
                  type="date"
                  value={app.followUpAt ? new Date(app.followUpAt).toISOString().slice(0, 10) : ''}
                  onChange={(e) => setApp({ ...app, followUpAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                />
              </label>
            </div>
            <label>Tags<input value={listText(app.tags)} onChange={(e) => setApp({ ...app, tags: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} /></label>
            <label>Notes<textarea rows={3} value={app.notes || ''} onChange={(e) => setApp({ ...app, notes: e.target.value })} /></label>
            <label>Responsibilities<textarea rows={4} value={app.responsibilities || ''} onChange={(e) => setApp({ ...app, responsibilities: e.target.value })} /></label>
            <label>Requirements<textarea rows={4} value={app.requirements || ''} onChange={(e) => setApp({ ...app, requirements: e.target.value })} /></label>
            <label>Benefits<textarea rows={3} value={app.benefits || ''} onChange={(e) => setApp({ ...app, benefits: e.target.value })} /></label>
            <label className="check-row">
              <input type="checkbox" checked={Boolean(app.archived)} onChange={(e) => setApp({ ...app, archived: e.target.checked })} />
              Archived
            </label>
          </div>
        </details>
        <div className="form-actions">
          <button className="btn primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          <Link className="btn ghost" to="/applications">Back to applications</Link>
        </div>
      </form>

      <div className="two-col" style={{ marginTop: '1rem' }}>
        <section className="panel">
          <h2>Activity</h2>
          {events.length === 0 ? <p className="muted">No activity yet.</p> : (
            <ul className="timeline">
              {events.map((event) => {
                const tone = timelineTone(event.type);
                return (
                  <li key={event._id}>
                    <span className={`tl-icon ${tone.className}`} aria-hidden="true">{tone.icon}</span>
                    <div>
                      <time>{new Date(event.createdAt).toLocaleString()}</time>
                      <strong>{tone.label}</strong>
                      <p>{event.message}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <form className="panel stack" onSubmit={addNote}>
          <h2>Add note</h2>
          <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Interview feedback, recruiter update…" />
          <button className="btn" type="submit">Add note</button>
        </form>
      </div>
    </div>
  );
}
