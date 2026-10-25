const DEFAULT_API = 'https://wheremyapplication-api.onrender.com';

const loginView = document.getElementById('loginView');
const mainView = document.getElementById('mainView');
const messageEl = document.getElementById('message');
const userLine = document.getElementById('userLine');
const apiLabel = document.getElementById('apiLabel');
const dashboardLink = document.getElementById('dashboardLink');
const apiInput = document.getElementById('apiBase');

function showMessage(text, ok = true) {
  messageEl.textContent = text;
  messageEl.className = `msg ${ok ? 'ok' : 'err'}`;
}

function normalizeApiBase(value) {
  return String(value || DEFAULT_API)
    .trim()
    .replace(/\/$/, '')
    .replace('://localhost:', '://127.0.0.1:');
}

async function ensureHostAccess(apiBase) {
  const origin = `${new URL(apiBase).origin}/*`;
  try {
    const have = await chrome.permissions.contains({ origins: [origin] });
    if (have) return true;
    return await chrome.permissions.request({ origins: [origin] });
  } catch {
    return true; // host_permissions already declared for 5080
  }
}

async function apiFetch(apiBase, path, options = {}) {
  const base = normalizeApiBase(apiBase);
  await ensureHostAccess(base);
  const url = `${base}${path}`;
  try {
    return await fetch(url, options);
  } catch {
    throw new Error(
      `Cannot reach ${url}. Confirm http://127.0.0.1:5080/api/health works in a tab, then restart: cd WhereMyApplication && npm run dev`
    );
  }
}

/** Runs inside the job page — returns data, does not stay loaded on LinkedIn. */
function scrapeJobInPage() {
  function text(el) {
    return (el?.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function meta(property) {
    const el =
      document.querySelector(`meta[property="${property}"]`) ||
      document.querySelector(`meta[name="${property}"]`);
    return el?.getAttribute('content') || '';
  }
  const url = location.href;
  const host = location.hostname.toLowerCase();
  let source = 'career_site';
  if (host.includes('linkedin.com')) source = 'linkedin';
  else if (host.includes('indeed.')) source = 'indeed';
  else if (host.includes('naukri.com') || host.includes('foundit.')) source = 'naukri';
  else if (host.includes('wellfound.') || host.includes('angel.co')) source = 'wellfound';
  else if (host.includes('instahyre.com')) source = 'instahyre';

  let roleTitle = '';
  let company = '';
  let loc = '';
  let jobDescription = '';
  let externalJobId = '';

  if (source === 'linkedin') {
    roleTitle =
      text(document.querySelector('.job-details-jobs-unified-top-card__job-title')) ||
      text(document.querySelector('h1')) ||
      document.title;
    company = text(
      document.querySelector(
        '.job-details-jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name'
      )
    );
    loc = text(
      document.querySelector(
        '.job-details-jobs-unified-top-card__tertiary-description-container, .jobs-unified-top-card__bullet'
      )
    );
    jobDescription = text(
      document.querySelector('#job-details, .jobs-description__content, .jobs-box__html-content')
    );
    externalJobId =
      new URLSearchParams(location.search).get('currentJobId') ||
      (location.pathname.match(/\/jobs\/view\/(\d+)/) || [])[1] ||
      '';
  } else if (source === 'indeed') {
    roleTitle =
      text(document.querySelector('h1.jobsearch-JobInfoHeader-title, h2.jobTitle, h1')) ||
      meta('og:title');
    company = text(
      document.querySelector(
        '[data-company-name], .jobsearch-InlineCompanyRating a, .jobsearch-CompanyInfoContainer a'
      )
    );
    loc = text(
      document.querySelector('[data-testid="job-location"], .jobsearch-JobInfoHeader-subtitle div')
    );
    jobDescription = text(
      document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText')
    );
    externalJobId = new URLSearchParams(location.search).get('vjk') || '';
  } else if (source === 'naukri') {
    roleTitle = text(document.querySelector('h1')) || meta('og:title');
    company = text(
      document.querySelector('a.styles_jd-header-comp-name__, .jd-header-comp-name a')
    );
    loc = text(document.querySelector('.styles_jhc__location__, .loc'));
    jobDescription = text(
      document.querySelector('.styles_job-desc-container__, .dang-inner-html')
    );
  } else if (source === 'wellfound') {
    roleTitle =
      text(document.querySelector('h1, [data-test="JobTitle"]')) || meta('og:title');
    company =
      text(document.querySelector('[data-test="StartupLink"], a[href*="/company/"]')) ||
      meta('og:site_name');
    loc = text(document.querySelector('[class*="location" i], [data-test="JobLocation"]'));
    jobDescription = text(document.querySelector('[class*="description" i], article, main'));
  } else if (source === 'instahyre') {
    roleTitle =
      text(document.querySelector('h1, .opportunity-detail h1, [class*="job-title" i]')) ||
      meta('og:title');
    company =
      text(
        document.querySelector(
          '.opportunity-detail .company-name, [class*="company-name" i], a[href*="/company/"]'
        )
      ) || meta('og:site_name');
    loc = text(document.querySelector('[class*="location" i], .opportunity-location'));
    jobDescription = text(
      document.querySelector(
        '.opportunity-detail .job-description, [class*="job-description" i], article, main'
      )
    );
  } else {
    roleTitle = meta('og:title') || text(document.querySelector('h1')) || document.title;
    company = meta('og:site_name') || host.replace(/^www\./, '').split('.')[0];
    jobDescription = meta('og:description') || '';
  }

  return {
    company: company || 'Unknown company',
    roleTitle: roleTitle || document.title || 'Untitled role',
    location: (loc || '').split('·')[0].trim(),
    jobUrl: url,
    source,
    jobDescription: (jobDescription || '').slice(0, 15000),
    externalJobId: externalJobId || '',
    pageTitle: document.title || '',
    pageText: (
      [
        document.title,
        meta('og:title'),
        meta('og:description'),
        meta('description'),
        jobDescription,
        text(document.querySelector('main')) || text(document.body),
      ]
        .filter(Boolean)
        .join('\n\n')
    ).slice(0, 50000),
    enrichWithAi: true,
    notes: `Captured via WhereMyApplication extension from ${source}`,
  };
}

function setViews(session) {
  const loggedIn = Boolean(session?.token);
  loginView.classList.toggle('hidden', loggedIn);
  mainView.classList.toggle('hidden', !loggedIn);
  const apiBase = normalizeApiBase(session?.apiBase);
  apiLabel.textContent = apiBase;
  if (session?.user) {
    userLine.textContent = `Signed in as ${session.user.name || session.user.email}`;
  }
  dashboardLink.href = 'https://purushottampradhan.online/wma';
  if (apiInput) apiInput.value = apiBase;
}

function refresh() {
  chrome.storage.local.get(['token', 'user', 'apiBase'], (data) => {
    setViews(data || {});
  });
}

document.getElementById('pingBtn').addEventListener('click', async () => {
  const apiBase = normalizeApiBase(apiInput.value);
  apiInput.value = apiBase;
  await chrome.storage.local.set({ apiBase });
  showMessage('Testing API…');
  try {
    const res = await apiFetch(apiBase, '/api/health');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Health failed (${res.status})`);
    showMessage(`API OK — db: ${data.db || 'unknown'}`);
  } catch (err) {
    showMessage(err instanceof Error ? err.message : String(err), false);
  }
});

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const apiBase = normalizeApiBase(apiInput.value);
  apiInput.value = apiBase;
  await chrome.storage.local.set({ apiBase });
  showMessage('Signing in…');
  try {
    const res = await apiFetch(apiBase, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Login failed');
    await chrome.storage.local.set({
      token: data.token,
      user: data.user,
      apiBase,
    });
    showMessage('Signed in');
    refresh();
  } catch (err) {
    showMessage(err instanceof Error ? err.message : String(err), false);
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await chrome.storage.local.remove(['token', 'user']);
  showMessage('Logged out');
  refresh();
});

document.getElementById('saveBtn').addEventListener('click', async () => {
  showMessage('Capturing…');
  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');
    if (!tab.url || !/^https?:/i.test(tab.url)) {
      throw new Error('Open a job page (LinkedIn / Indeed / Naukri / career site), then click Save');
    }

    const injected = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeJobInPage,
    });
    const payloadBase = injected?.[0]?.result;
    if (!payloadBase?.roleTitle) {
      throw new Error(
        'Could not read job details. Open the job detail page (not the list), refresh once, then try Save again.'
      );
    }

    const status = document.getElementById('status').value;
    const payload = { ...payloadBase, status };

    const stored = await chrome.storage.local.get(['token', 'apiBase']);
    if (!stored.token) throw new Error('Not logged in — sign in first');

    const res = await apiFetch(normalizeApiBase(stored.apiBase), '/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${stored.token}`,
        'X-Client': 'extension',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Save failed');
    showMessage(
      `Saved: ${data.application.roleTitle} @ ${data.application.company}` +
        (data.aiEnriched ? ' (AI enriched)' : '')
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    showMessage(msg, false);
  } finally {
    saveBtn.disabled = false;
  }
});

refresh();
