import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label>
      {label}
      <span className="pwd-field">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required={required}
          minLength={required ? 8 : undefined}
        />
        <button type="button" className="pwd-toggle" onClick={() => setVisible((current) => !current)}>
          {visible ? 'Hide' : 'Show'}
        </button>
      </span>
    </label>
  );
}

export function SettingsPage() {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState<'gmail' | 'outlook' | 'yahoo' | 'imap'>('gmail');
  const [mailboxEmail, setMailboxEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [imapHost, setImapHost] = useState('');
  const [inboxConnected, setInboxConnected] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [inboxMsg, setInboxMsg] = useState('');
  const [inboxErr, setInboxErr] = useState('');
  const [inboxBusy, setInboxBusy] = useState(false);

  useEffect(() => {
    api<{ inbox: { connected: boolean; provider: typeof provider; email: string; host: string; lastSyncAt: string | null } }>('/api/inbox')
      .then(({ inbox }) => {
        setInboxConnected(inbox.connected);
        setProvider(inbox.provider || 'gmail');
        setMailboxEmail(inbox.email || '');
        setImapHost(inbox.provider === 'imap' ? inbox.host : '');
        setLastSyncAt(inbox.lastSyncAt);
      })
      .catch(() => setInboxErr('Could not load the mailbox connection.'));
  }, []);

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setPwdMsg('');
    setPwdErr('');
    if (newPassword.length < 8) {
      setPwdErr('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdErr('New password and confirmation do not match.');
      return;
    }
    setBusy(true);
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPwdMsg('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdErr(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function saveInbox(event: FormEvent) {
    event.preventDefault();
    setInboxMsg('');
    setInboxErr('');
    setInboxBusy(true);
    try {
      const saved = await api<{ inbox: { connected: boolean; lastSyncAt: string | null } }>('/api/inbox', {
        method: 'PUT',
        body: JSON.stringify({
          provider,
          email: mailboxEmail,
          appPassword,
          host: provider === 'imap' ? imapHost : '',
        }),
      });
      setInboxConnected(saved.inbox.connected);
      setLastSyncAt(saved.inbox.lastSyncAt);
      setAppPassword('');
      setInboxMsg('Mailbox connected. Open Applications and choose Check inbox.');
    } catch (err) {
      setInboxErr(err instanceof Error ? err.message : 'Could not connect the mailbox');
    } finally {
      setInboxBusy(false);
    }
  }

  async function disconnectInbox() {
    setInboxMsg('');
    setInboxErr('');
    setInboxBusy(true);
    try {
      await api('/api/inbox', { method: 'DELETE' });
      setInboxConnected(false);
      setMailboxEmail('');
      setAppPassword('');
      setImapHost('');
      setLastSyncAt(null);
      setInboxMsg('Mailbox disconnected. Saved applications were not deleted.');
    } catch (err) {
      setInboxErr(err instanceof Error ? err.message : 'Could not disconnect');
    } finally {
      setInboxBusy(false);
    }
  }

  return (
    <div className="page form-page">
      <h2>Settings</h2>
      <section className="panel stack">
        <h3>Appearance</h3>
        <p className="muted">Light is the default. Dark mode stays on this browser.</p>
        <div className="chip-row" role="group" aria-label="Theme">
          <button type="button" className={`chip ${theme === 'light' ? 'is-on' : ''}`} onClick={() => setTheme('light')}>Light</button>
          <button type="button" className={`chip ${theme === 'dark' ? 'is-on' : ''}`} onClick={() => setTheme('dark')}>Dark</button>
        </div>
      </section>
      <section className="panel stack">
        <h3>Change password</h3>
        <p className="muted">Enter your current password. The new password must be at least 8 characters.</p>
        <form className="stack" onSubmit={changePassword}>
          <PasswordField label="Current password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
          <PasswordField label="New password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
          <PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
          {pwdErr ? <p className="banner error">{pwdErr}</p> : null}
          {pwdMsg ? <p className="banner ok" role="status">{pwdMsg}</p> : null}
          <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
        </form>
      </section>
      <section className="panel stack">
        <h3>Job inbox</h3>
        <p className="muted">
          Connect the mailbox that receives job mail. WhereMyApplication reads recent inbox messages and moves a matching application forward when the wording is clear.
        </p>
        <ol className="inbox-steps">
          <li>Use the email account where interview, rejection, and offer messages arrive. It can be different from your login here.</li>
          <li>Turn on 2-step verification, then create an app password. For Gmail that is Google Account, Security, App passwords. Name it WhereMyApplication.</li>
          <li>Turn on IMAP. In Gmail: Settings, See all settings, Forwarding and POP/IMAP, Enable IMAP, then Save.</li>
          <li>Paste that mailbox address and the app password below. Do not use your normal email password.</li>
          <li>Save, then open Applications and choose Check inbox. Status moves only forward, or to Rejected or Offer when the message says so.</li>
        </ol>
        <form className="stack" onSubmit={saveInbox}>
          <div className="chip-row" role="group" aria-label="Mailbox provider">
            {(['gmail', 'outlook', 'yahoo', 'imap'] as const).map((item) => (
              <button key={item} type="button" className={`chip ${provider === item ? 'is-on' : ''}`} onClick={() => setProvider(item)}>
                {item === 'imap' ? 'Other IMAP' : item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
          <label>
            Mailbox address
            <input type="email" value={mailboxEmail} onChange={(event) => setMailboxEmail(event.target.value)} autoComplete="off" required />
          </label>
          {provider === 'imap' ? (
            <label>
              IMAP host
              <input value={imapHost} onChange={(event) => setImapHost(event.target.value)} placeholder="imap.example.com" required />
            </label>
          ) : null}
          <PasswordField
            label={inboxConnected ? 'New app password' : 'App password'}
            value={appPassword}
            onChange={setAppPassword}
            autoComplete="new-password"
            required={!inboxConnected}
          />
          {inboxConnected ? <p className="muted">A password is already saved. Leave this blank to keep it, or paste a new app password.</p> : null}
          {lastSyncAt ? <p className="muted">Last check: {new Date(lastSyncAt).toLocaleString()}</p> : null}
          {inboxErr ? <p className="banner error">{inboxErr}</p> : null}
          {inboxMsg ? <p className="banner ok" role="status">{inboxMsg}</p> : null}
          <div className="actions">
            <button className="btn primary" type="submit" disabled={inboxBusy}>{inboxBusy ? 'Checking mailbox…' : 'Save mailbox'}</button>
            {inboxConnected ? (
              <button className="btn ghost" type="button" disabled={inboxBusy} onClick={disconnectInbox}>Disconnect</button>
            ) : null}
          </div>
        </form>
      </section>
      <section className="panel stack">
        <h3>Session</h3>
        <p className="muted">Logging out clears this browser’s session. Passwords and tokens are not shown here.</p>
        <button type="button" className="btn" onClick={logout}>Log out</button>
      </section>
    </div>
  );
}
