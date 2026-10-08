import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { UserProfile } from '../types';

function listToText(arr: string[] = []) {
  return arr.join(', ');
}

function textToList(value: string) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ProfilePage() {
  const { refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [skills, setSkills] = useState('');
  const [roles, setRoles] = useState('');
  const [locations, setLocations] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ name: string; profile: UserProfile }>('/api/profile')
      .then((data) => {
        setName(data.name);
        setSkills(listToText(data.profile?.skills));
        setRoles(listToText(data.profile?.preferredRoles));
        setLocations(listToText(data.profile?.preferredLocations));
        setExperienceYears(data.profile?.experienceYears || 0);
        setResumeUrl(data.profile?.resumeUrl || '');
        setResumeText(data.profile?.resumeText || '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          skills: textToList(skills),
          preferredRoles: textToList(roles),
          preferredLocations: textToList(locations),
          experienceYears,
          resumeUrl,
          resumeText,
        }),
      });
      await refreshUser();
      setMessage('Profile saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  return (
    <div className="page narrow">
      <h1>Profile</h1>
      <p className="muted">
        Paste your resume text for Resume↔JD match scores. Skills also help matching.
      </p>
      <form className="panel stack" onSubmit={onSubmit}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Skills (comma separated)
          <textarea rows={3} value={skills} onChange={(e) => setSkills(e.target.value)} />
        </label>
        <label>
          Preferred roles
          <textarea rows={2} value={roles} onChange={(e) => setRoles(e.target.value)} />
        </label>
        <label>
          Preferred locations
          <textarea
            rows={2}
            value={locations}
            onChange={(e) => setLocations(e.target.value)}
          />
        </label>
        <label>
          Experience (years)
          <input
            type="number"
            min={0}
            max={60}
            value={experienceYears}
            onChange={(e) => setExperienceYears(Number(e.target.value))}
          />
        </label>
        <label>
          Resume URL
          <input value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} />
        </label>
        <label>
          Resume text (paste full resume for AI match)
          <textarea
            rows={12}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume here…"
          />
        </label>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button className="btn primary" type="submit">
          Save profile
        </button>
      </form>
    </div>
  );
}
