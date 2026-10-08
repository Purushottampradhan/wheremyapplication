const DEFAULT_API = 'http://127.0.0.1:5080';
const DEFAULT_WEB = 'http://127.0.0.1:5173';

const loginView = document.getElementById('loginView');
const mainView = document.getElementById('mainView');
const messageEl = document.getElementById('message');
const userLine = document.getElementById('userLine');
const apiLabel = document.getElementById('apiLabel');
const dashboardLink = document.getElementById('dashboardLink');
const apiInput = document.getElementById('apiBase');
const webInput = document.getElementById('webBase');
const easyApplyToggle = document.getElementById('easyApply');
const pageHint = document.getElementById('pageHint');

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

function normalizeWebBase(value) {
  return String(value || DEFAULT_WEB)
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
    return true;
  }
}

async function ensurePageAccess(pageUrl) {
  let originPattern;
  try {
    originPattern = `${new URL(pageUrl).origin}/*`;
  } catch {
    throw new Error('Invalid page URL');
  }
  try {
    const have = await chrome.permissions.contains({ origins: [originPattern] });
    if (have) return true;
    const granted = await chrome.permissions.request({ origins: [originPattern] });
    if (!granted) {
      throw new Error('Chrome blocked access to this site. Click Allow when asked, then Save again.');
    }
    return true;
  } catch (err) {
    if (err instanceof Error && /blocked access|Invalid page/.test(err.message)) throw err;
    return true; // host_permissions already cover *://*/*
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
      `Cannot reach ${url}. Set API base to your Render URL (or http://127.0.0.1:5080 locally) and Test API.`
    );
  }
}

function isBrowserPageUrl(url) {
  return Boolean(url && /^https?:\/\//i.test(url));
}

function isRestrictedUrl(url) {
  return /^(chrome|chrome-extension|edge|about|devtools|view-source|chrome-search|brave|opera):/i.test(
    url || ''
  );
}

/** Find the real job tab (side panel is not a tab — never use extension pages). */
async function getCaptureTab() {
  const candidates = [];

  try {
    const win = await chrome.windows.getLastFocused({ populate: true });
    const active = win?.tabs?.find((t) => t.active);
    if (active) candidates.push(active);
    if (win?.tabs) candidates.push(...win.tabs);
  } catch {
    /* ignore */
  }

  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    candidates.push(...tabs);
  } catch {
    /* ignore */
  }

  try {
    const tabs = await chrome.tabs.query({ active: true });
    candidates.push(...tabs);
  } catch {
    /* ignore */
  }

  const seen = new Set();
  const unique = [];
  for (const t of candidates) {
    if (!t?.id || seen.has(t.id)) continue;
    seen.add(t.id);
    unique.push(t);
  }

  const usable = unique.filter((t) => {
    const url = t.url || t.pendingUrl || '';
    return isBrowserPageUrl(url) && !isRestrictedUrl(url);
  });

  if (usable.length) {
    // Prefer active tab in last focused window
    const preferred =
      usable.find((t) => t.active && isBrowserPageUrl(t.url || t.pendingUrl)) || usable[0];
    return preferred;
  }

  const any = unique[0];
  const badUrl = any?.url || any?.pendingUrl || '';
  if (!any?.id) {
    throw new Error('No browser tab found. Open a job page in a normal Chrome tab, then click Save.');
  }
  if (isRestrictedUrl(badUrl) || !badUrl) {
    throw new Error(
      'Focus the job tab in Chrome (not chrome://extensions or Settings), then click Save. The side panel stays open on the side.'
    );
  }
  throw new Error(`Cannot capture from: ${badUrl}`);
}

/**
 * Injected into the page. Works on LinkedIn / Indeed / Naukri / Greenhouse / Lever /
 * Workday / Ashby / any career page — always returns a payload; confidence says how good it is.
 */
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
  function firstText(selectors) {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        const t = text(el);
        if (t) return t;
      } catch {
        /* bad selector */
      }
    }
    return '';
  }

  const url = location.href;
  const host = location.hostname.toLowerCase();
  const path = location.pathname.toLowerCase();
  const full = `${host}${path}${location.search}`.toLowerCase();

  let source = 'career_site';
  if (host.includes('linkedin.com')) source = 'linkedin';
  else if (host.includes('indeed.')) source = 'indeed';
  else if (host.includes('naukri.com') || host.includes('foundit.')) source = 'naukri';
  else if (host.includes('glassdoor.')) source = 'glassdoor';
  else if (host.includes('wellfound.') || host.includes('angel.co')) source = 'wellfound';
  else if (host.includes('greenhouse.io') || host.includes('boards.greenhouse'))
    source = 'greenhouse';
  else if (host.includes('lever.co')) source = 'lever';
  else if (host.includes('ashbyhq.com')) source = 'ashby';
  else if (host.includes('myworkdayjobs.com') || host.includes('workday.')) source = 'workday';
  else if (host.includes('smartrecruiters.')) source = 'smartrecruiters';
  else if (host.includes('jobvite.')) source = 'jobvite';
  else if (host.includes('icims.')) source = 'icims';
  else if (host.includes('monster.')) source = 'monster';
  else if (host.includes('ziprecruiter.')) source = 'ziprecruiter';

  let roleTitle = '';
  let company = '';
  let loc = '';
  let jobDescription = '';
  let externalJobId = '';

  if (source === 'linkedin') {
    roleTitle =
      firstText([
        '.job-details-jobs-unified-top-card__job-title h1',
        '.job-details-jobs-unified-top-card__job-title a',
        '.job-details-jobs-unified-top-card__job-title',
        '.jobs-unified-top-card__job-title',
        'h1.t-24',
        'h1',
      ]) || document.title;
    company = firstText([
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
    ]);
    loc = firstText([
      '.job-details-jobs-unified-top-card__tertiary-description-container',
      '.jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__primary-description-container',
    ]);
    jobDescription = firstText([
      '#job-details',
      '.jobs-description__content',
      '.jobs-box__html-content',
      '.jobs-description-content__text',
    ]);
    externalJobId =
      new URLSearchParams(location.search).get('currentJobId') ||
      (location.pathname.match(/\/jobs\/view\/(\d+)/) || [])[1] ||
      '';
  } else if (source === 'indeed') {
    roleTitle =
      firstText([
        'h1.jobsearch-JobInfoHeader-title',
        'h2.jobsearch-JobInfoHeader-title',
        'h2.jobTitle',
        '[data-testid="jobsearch-JobInfoHeader-title"]',
        'h1',
      ]) || meta('og:title');
    company = firstText([
      '[data-company-name]',
      '[data-testid="inlineHeader-companyName"] a',
      '[data-testid="inlineHeader-companyName"]',
      '.jobsearch-InlineCompanyRating a',
      '.jobsearch-CompanyInfoContainer a',
    ]);
    loc = firstText([
      '[data-testid="job-location"]',
      '[data-testid="inlineHeader-companyLocation"]',
      '.jobsearch-JobInfoHeader-subtitle div',
    ]);
    jobDescription = firstText(['#jobDescriptionText', '.jobsearch-jobDescriptionText']);
    externalJobId = new URLSearchParams(location.search).get('vjk') || '';
  } else if (source === 'naukri') {
    roleTitle = firstText(['h1']) || meta('og:title');
    company = firstText([
      'a.styles_jd-header-comp-name__',
      '.jd-header-comp-name a',
      '.styles_jd-header-comp-name__',
    ]);
    loc = firstText(['.styles_jhc__location__', '.loc', '.location']);
    jobDescription = firstText([
      '.styles_job-desc-container__',
      '.dang-inner-html',
      '.job-desc',
    ]);
  } else if (source === 'greenhouse') {
    roleTitle = firstText(['h1.app-title', 'h1']) || meta('og:title');
    company =
      firstText(['.company-name', '#header .company-name']) ||
      meta('og:site_name') ||
      host.split('.')[0];
    jobDescription = firstText(['#content', '#app_body', '.content']);
  } else if (source === 'lever') {
    roleTitle = firstText(['.posting-headline h2', 'h2']) || meta('og:title');
    company = meta('og:site_name') || host.replace(/\.lever\.co.*/, '');
    loc = firstText(['.posting-categories .location', '.sorting-location']);
    jobDescription = firstText(['.content', '.section-wrapper']);
  } else if (source === 'ashby') {
    roleTitle = firstText(['h1', '[class*="JobTitle"]']) || meta('og:title');
    company = meta('og:site_name') || firstText(['[class*="CompanyName"]']);
    jobDescription = firstText(['[class*="JobDescription"]', 'main']);
  } else if (source === 'workday') {
    roleTitle =
      firstText(['h2[data-automation-id="jobPostingHeader"]', 'h1', 'h2']) || meta('og:title');
    company = meta('og:site_name') || host.split('.')[0];
    loc = firstText(['[data-automation-id="locations"]', '[data-automation-id="location"]']);
    jobDescription = firstText([
      '[data-automation-id="jobPostingDescription"]',
      '[data-automation-id="job-posting-details"]',
    ]);
  } else {
    roleTitle =
      meta('og:title') ||
      firstText([
        'h1',
        '[class*="job-title" i]',
        '[class*="JobTitle"]',
        '[data-testid*="job-title" i]',
        'header h1',
        'main h1',
      ]) ||
      document.title;
    company =
      meta('og:site_name') ||
      firstText([
        '[class*="company-name" i]',
        '[class*="CompanyName"]',
        '[data-company]',
        '[itemprop="hiringOrganization"]',
      ]) ||
      host.replace(/^www\./, '').split('.')[0];
    loc = firstText([
      '[class*="location" i]',
      '[data-testid*="location" i]',
      '[itemprop="jobLocation"]',
    ]);
    jobDescription =
      firstText([
        '[class*="job-description" i]',
        '[class*="JobDescription"]',
        '#job-description',
        '[itemprop="description"]',
        'article',
        'main',
      ]) || meta('og:description');
  }

  // Clean title (often "Role | Company | LinkedIn")
  let cleanTitle = (roleTitle || '').split('|')[0].split(' - ')[0].trim();
  if (cleanTitle.length < 3) cleanTitle = roleTitle || document.title || 'Untitled role';

  const pageText = [
    document.title,
    meta('og:title'),
    meta('og:description'),
    meta('description'),
    jobDescription,
    text(document.querySelector('main')) || text(document.body),
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 50000);

  const jobSignals = [
    /job|career|opening|position|apply|vacancy|hiring|requisition|opportunity/i.test(full),
    /job|career|apply|responsibilit|qualification|requirement|experience|salary|remote|full.?time/i.test(
      pageText.slice(0, 8000)
    ),
    Boolean(jobDescription && jobDescription.length > 120),
    Boolean(externalJobId),
    Boolean(document.querySelector('a[href*="apply" i], button[class*="apply" i]')),
  ];
  const confidence = jobSignals.filter(Boolean).length;
  const looksLikeJob = confidence >= 2 || ['linkedin', 'indeed', 'naukri'].includes(source);

  return {
    company: (company || 'Unknown company').slice(0, 200),
    roleTitle: cleanTitle.slice(0, 300),
    location: (loc || '').split('·')[0].trim().slice(0, 200),
    jobUrl: url,
    source,
    jobDescription: (jobDescription || '').slice(0, 15000),
    externalJobId: externalJobId || '',
    pageTitle: document.title || '',
    pageText,
    enrichWithAi: true,
    notes: `Captured via WhereMyApplication from ${source} (${host})`,
    captureMeta: {
      host,
      confidence,
      looksLikeJob,
      path: location.pathname,
    },
  };
}

function setViews(session) {
  const loggedIn = Boolean(session?.token);
  loginView.classList.toggle('hidden', loggedIn);
  mainView.classList.toggle('hidden', !loggedIn);
  const apiBase = normalizeApiBase(session?.apiBase);
  const webBase = normalizeWebBase(session?.webBase);
  apiLabel.textContent = apiBase;
  if (session?.user) {
    userLine.textContent = `Signed in as ${session.user.name || session.user.email}`;
  }
  dashboardLink.href = webBase;
  if (apiInput) apiInput.value = apiBase;
  if (webInput) webInput.value = webBase;
  if (easyApplyToggle) {
    easyApplyToggle.checked = session?.easyApplyAutoCapture !== false;
  }
}

function refresh() {
  chrome.storage.local.get(
    ['token', 'user', 'apiBase', 'webBase', 'easyApplyAutoCapture'],
    (data) => {
      setViews(data || {});
    }
  );
  refreshPageHint();
}

async function refreshPageHint() {
  if (!pageHint) return;
  try {
    const tab = await getCaptureTab();
    const url = tab.url || tab.pendingUrl || '';
    let host = '';
    try {
      host = new URL(url).hostname;
    } catch {
      host = url;
    }
    pageHint.textContent = `Will capture: ${host}`;
    pageHint.title = url;
    pageHint.className = 'page-hint ok';
  } catch (err) {
    pageHint.textContent =
      err instanceof Error ? err.message : 'Focus a job tab in Chrome, then Save';
    pageHint.className = 'page-hint warn';
  }
}

async function persistBases() {
  const apiBase = normalizeApiBase(apiInput.value);
  const webBase = normalizeWebBase(webInput?.value);
  apiInput.value = apiBase;
  if (webInput) webInput.value = webBase;
  await chrome.storage.local.set({ apiBase, webBase });
  return { apiBase, webBase };
}

document.getElementById('pingBtn').addEventListener('click', async () => {
  const { apiBase } = await persistBases();
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
  const { apiBase, webBase } = await persistBases();
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
      webBase,
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

if (easyApplyToggle) {
  easyApplyToggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ easyApplyAutoCapture: easyApplyToggle.checked });
    showMessage(
      easyApplyToggle.checked
        ? 'Easy Apply auto-capture on'
        : 'Easy Apply auto-capture off'
    );
  });
}

async function postApplication(payload, { forceDuplicate = false } = {}) {
  const stored = await chrome.storage.local.get(['token', 'apiBase']);
  if (!stored.token) throw new Error('Not logged in — sign in first');
  const body = { ...payload, forceDuplicate };
  delete body.captureMeta;
  const res = await apiFetch(normalizeApiBase(stored.apiBase), '/api/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${stored.token}`,
      'X-Client': 'extension',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

document.getElementById('saveBtn').addEventListener('click', async () => {
  showMessage('Capturing…');
  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  try {
    const tab = await getCaptureTab();
    const pageUrl = tab.url || tab.pendingUrl || '';
    await ensurePageAccess(pageUrl);

    let injected;
    try {
      injected = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrapeJobInPage,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Could not read this page (${detail}). Click the job tab once, allow site access if prompted, then Save again.`
      );
    }

    const payloadBase = injected?.[0]?.result;
    if (!payloadBase?.roleTitle) {
      throw new Error(
        'Nothing readable on this tab. Open the job detail page, wait for it to load, then Save.'
      );
    }

    const meta = payloadBase.captureMeta || {};
    if (meta.looksLikeJob === false) {
      const ok = window.confirm(
        `This page may not be a job posting:\n${payloadBase.roleTitle}\n${pageUrl}\n\nSave it anyway? AI can still try to extract fields from the page text.`
      );
      if (!ok) {
        showMessage('Cancelled — open a job detail page and try again', false);
        return;
      }
    }

    const status = document.getElementById('status').value;
    const payload = { ...payloadBase, status };

    let { res, data } = await postApplication(payload, { forceDuplicate: false });

    if (res.status === 409 && data.duplicate) {
      const existing = data.existing;
      const ok = window.confirm(
        `Possible duplicate:\n${existing.roleTitle} @ ${existing.company} (${existing.status})\n\nSave anyway?`
      );
      if (!ok) {
        showMessage('Skipped duplicate', false);
        return;
      }
      ({ res, data } = await postApplication(payload, { forceDuplicate: true }));
    }

    if (!res.ok) throw new Error(data.error || 'Save failed');
    showMessage(
      `Saved: ${data.application.roleTitle} @ ${data.application.company}` +
        (data.aiEnriched ? ' (AI enriched)' : '') +
        (data.matchScore != null ? ` · match ${data.matchScore}` : '')
    );
    refreshPageHint();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    showMessage(msg, false);
  } finally {
    saveBtn.disabled = false;
  }
});

// Keep "Will capture" line in sync when user switches tabs
try {
  chrome.tabs.onActivated.addListener(() => refreshPageHint());
  chrome.tabs.onUpdated.addListener((_id, change) => {
    if (change.status === 'complete' || change.url) refreshPageHint();
  });
  chrome.windows.onFocusChanged.addListener(() => refreshPageHint());
} catch {
  /* older chrome */
}

refresh();
setInterval(refreshPageHint, 3000);
