/**
 * Lightweight LinkedIn Easy Apply success observer.
 * Only runs on LinkedIn jobs URLs (manifest content_scripts).
 * Does not inject into other sites.
 */
(function () {
  const SUCCESS_RE =
    /application (was )?sent|your application was submitted|applied successfully|application submitted/i;
  let lastCaptureKey = '';
  let lastCaptureAt = 0;
  let scanning = false;

  function textOf(node) {
    return (node?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function looksLikeSuccess() {
    const candidates = [
      ...document.querySelectorAll(
        '[role="alert"], .artdeco-toast-item, .artdeco-modal, .jobs-easy-apply-modal, .jpac-modal'
      ),
    ];
    for (const el of candidates) {
      const t = textOf(el);
      if (t && SUCCESS_RE.test(t) && t.length < 800) return true;
    }
    const bodySnippet = textOf(document.body).slice(0, 4000);
    return SUCCESS_RE.test(bodySnippet);
  }

  function scrape() {
    function text(el) {
      return (el?.textContent || '').replace(/\s+/g, ' ').trim();
    }
    function meta(property) {
      const el =
        document.querySelector(`meta[property="${property}"]`) ||
        document.querySelector(`meta[name="${property}"]`);
      return el?.getAttribute('content') || '';
    }
    const roleTitle =
      text(document.querySelector('.job-details-jobs-unified-top-card__job-title')) ||
      text(document.querySelector('h1')) ||
      document.title;
    const company = text(
      document.querySelector(
        '.job-details-jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name'
      )
    );
    const loc = text(
      document.querySelector(
        '.job-details-jobs-unified-top-card__tertiary-description-container, .jobs-unified-top-card__bullet'
      )
    );
    const jobDescription = text(
      document.querySelector('#job-details, .jobs-description__content, .jobs-box__html-content')
    );
    const externalJobId =
      new URLSearchParams(location.search).get('currentJobId') ||
      (location.pathname.match(/\/jobs\/view\/(\d+)/) || [])[1] ||
      '';
    return {
      company: company || 'Unknown company',
      roleTitle: roleTitle || document.title || 'Untitled role',
      location: (loc || '').split('·')[0].trim(),
      jobUrl: location.href.split('?')[0] + (externalJobId ? `?currentJobId=${externalJobId}` : ''),
      source: 'linkedin',
      jobDescription: (jobDescription || '').slice(0, 15000),
      externalJobId,
      pageTitle: document.title || '',
      pageText: (
        [document.title, meta('og:description'), jobDescription, text(document.querySelector('main'))]
          .filter(Boolean)
          .join('\n\n')
      ).slice(0, 50000),
      enrichWithAi: true,
      status: 'applied',
      notes: 'Auto-captured after LinkedIn Easy Apply success',
    };
  }

  async function captureIfReady() {
    if (scanning) return;
    scanning = true;
    try {
      const stored = await chrome.storage.local.get([
        'token',
        'apiBase',
        'easyApplyAutoCapture',
      ]);
      if (stored.easyApplyAutoCapture === false) return;
      if (!stored.token) return;
      if (!looksLikeSuccess()) return;

      const payload = scrape();
      const key = `${payload.externalJobId || payload.jobUrl}|${payload.roleTitle}`;
      const now = Date.now();
      if (key === lastCaptureKey && now - lastCaptureAt < 120000) return;
      lastCaptureKey = key;
      lastCaptureAt = now;

      let apiBase = String(stored.apiBase || 'http://127.0.0.1:5080')
        .trim()
        .replace(/\/$/, '')
        .replace('://localhost:', '://127.0.0.1:');

      const res = await fetch(`${apiBase}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${stored.token}`,
          'X-Client': 'extension-easy-apply',
        },
        body: JSON.stringify({ ...payload, forceDuplicate: false }),
      });

      if (res.status === 409) return; // already tracked
      if (!res.ok) {
        console.debug('[WhereMyApplication] Easy Apply save failed', res.status);
        return;
      }
      console.debug('[WhereMyApplication] Easy Apply auto-saved', payload.roleTitle);
    } catch (err) {
      console.debug('[WhereMyApplication] Easy Apply capture error', err);
    } finally {
      scanning = false;
    }
  }

  const observer = new MutationObserver(() => {
    window.clearTimeout(captureIfReady._t);
    captureIfReady._t = window.setTimeout(captureIfReady, 600);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // Also check shortly after load (toast may already be present)
  setTimeout(captureIfReady, 1500);
})();
