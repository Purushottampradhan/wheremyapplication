import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { UserProfile } from '../types';

function ChipField({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');

  function add(raw: string) {
    const next = raw.split(',').map((item) => item.trim()).filter(Boolean);
    if (!next.length) return;
    const merged = [...values];
    for (const item of next) {
      if (!merged.some((current) => current.toLowerCase() === item.toLowerCase())) merged.push(item);
    }
    onChange(merged);
    setDraft('');
  }

  return (
    <label>
      {label}
      <span className="chip-editor">
        {values.map((value) => (
          <span key={value} className="tag">
            {value}
            <button type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((item) => item !== value))}>
              ×
            </button>
          </span>
        ))}
      </span>
      <input
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            add(draft);
          }
        }}
        onBlur={() => add(draft)}
      />
    </label>
  );
}

export function ProfilePage() {
  const { refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState(0);
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function applyProfile(data: { name: string; profile: UserProfile }) {
    setName(data.name);
    setSkills(data.profile?.skills || []);
    setRoles(data.profile?.preferredRoles || []);
    setLocations(data.profile?.preferredLocations || []);
    setExperienceYears(data.profile?.experienceYears || 0);
    setResumeUrl(data.profile?.resumeUrl || '');
    setResumeText(data.profile?.resumeText || '');
  }

  useEffect(() => {
    api<{ name: string; profile: UserProfile }>('/api/profile')
      .then(applyProfile)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    setError('');
    setBusy(true);
    try {
      await api('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          skills,
          preferredRoles: roles,
          preferredLocations: locations,
          experienceYears,
          resumeUrl,
          resumeText,
        }),
      });
      await refreshUser();
      setMessage('Profile saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page form-page">
      <h2>Profile</h2>
      <p className="muted">
        Skills, preferred roles, and resume text stay on your account. Resume text is used for matching when Groq is configured. It is not shown on the dashboard.
      </p>
      <form className="stack" onSubmit={onSubmit}>
        <fieldset className="form-section">
          <legend>Account</legend>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        </fieldset>
        <fieldset className="form-section">
          <legend>Career</legend>
          <div className="stack">
            <ChipField label="Skills" values={skills} onChange={setSkills} placeholder="Type a skill and press Enter" />
            <ChipField label="Preferred roles" values={roles} onChange={setRoles} placeholder="Type a role and press Enter" />
            <ChipField label="Preferred locations" values={locations} onChange={setLocations} placeholder="Type a location and press Enter" />
            <label>
              Experience (years)
              <input type="number" min={0} max={60} value={experienceYears} onChange={(e) => setExperienceYears(Number(e.target.value))} />
            </label>
          </div>
        </fieldset>
        <fieldset className="form-section">
          <legend>Resume</legend>
          <div className="stack">
            <label>
              Resume URL
              <input value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} />
            </label>
            <label>
              Resume text
              <textarea rows={12} value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste plain text. Used only for matching." />
            </label>
          </div>
        </fieldset>
        {error ? <p className="banner error">{error}</p> : null}
        {message ? <p className="banner ok" role="status">{message}</p> : null}
        <div className="form-actions">
          <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              setMessage('');
              setError('');
              api<{ name: string; profile: UserProfile }>('/api/profile').then(applyProfile);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
