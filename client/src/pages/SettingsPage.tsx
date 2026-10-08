import { type FormEvent, useState } from 'react';
import { api } from '../api/client';

export function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwdMsg('');
    setPwdErr('');
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPwdMsg('Password updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwdErr(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <div className="page narrow">
      <h1>Settings</h1>

      <section className="panel stack">
        <h2>Change password</h2>
        <form className="stack" onSubmit={changePassword}>
          <label>
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          {pwdErr && <p className="error">{pwdErr}</p>}
          {pwdMsg && <p className="success">{pwdMsg}</p>}
          <button className="btn primary" type="submit">
            Update password
          </button>
        </form>
      </section>

      <section className="panel stack">
        <h2>Chrome extension</h2>
        <p className="muted">
          Load the <code>extension/</code> folder as an unpacked extension in Chrome
          (<code>chrome://extensions</code> → Developer mode → Load unpacked). Sign in
          with the same WhereMyApplication account, open a LinkedIn / Indeed / Naukri / career
          job page, and click <strong>Save this job</strong>.
        </p>
        <p className="muted">
          Full steps are in <code>HOW_TO_TRACK.md</code> in the project folder.
        </p>
      </section>
    </div>
  );
}
