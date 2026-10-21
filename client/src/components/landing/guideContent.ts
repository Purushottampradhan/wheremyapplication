export type GuideBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'note'; text: string };

export type GuideTopic = {
  id: string;
  title: string;
  blocks: GuideBlock[];
};

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    blocks: [
      {
        type: 'p',
        text: 'WhereMyApplication is a private workspace for one person’s job search. You save applications, move them through a status pipeline, and review follow-ups and dashboard stats for your own account.',
      },
      {
        type: 'p',
        text: 'Status changes when you update them in the web app, when you save a job from the Chrome extension, or when you connect a mailbox and run Check inbox. The extension itself does not read email.',
      },
      {
        type: 'ul',
        items: [
          'Register with your name, email, and a password of at least 8 characters. Open Get Started Free or go to the Register page.',
          'Sign in with the same email and password. After sign-in you land on your Dashboard.',
          'Open Profile and add skills, preferred roles, preferred locations, years of experience, an optional resume URL, and resume text. Resume text is what powers resume-to-job matching when AI is configured.',
          'Only the signed-in account can see the applications stored under that login.',
        ],
      },
    ],
  },
  {
    id: 'adding-applications',
    title: 'Adding Job Applications',
    blocks: [
      {
        type: 'p',
        text: 'Use Add in the workspace when you want to enter a job yourself. This is the right path when a page does not read cleanly in the extension.',
      },
      {
        type: 'ul',
        items: [
          'Enter company and role. Those two fields are required.',
          'Add location, job URL, source (LinkedIn, Indeed, Naukri, career site, manual, or other), status, and notes.',
          'Save. A follow-up date is set to 7 days after the apply date unless you change it later.',
          'Open the application to edit salary, workplace type, employment type, skills, recruiter details, job description, tags, priority, and the archived flag.',
        ],
      },
      {
        type: 'note',
        text: 'Duplicate detection compares the job URL, or the same company and role (ignoring letter case), against your active applications. If it finds a match, saving asks you to confirm. Confirm only when you mean to keep a second record.',
      },
    ],
  },
  {
    id: 'statuses',
    title: 'Managing Application Status',
    blocks: [
      {
        type: 'ul',
        items: [
          'Wishlist — saved, not applied yet.',
          'Applied — you submitted the application.',
          'Screening — HR or recruiter screening.',
          'Interview — an interview is scheduled or finished.',
          'Offer — you received an offer.',
          'Rejected — the process is not moving forward.',
          'Withdrawn — you withdrew.',
        ],
      },
      {
        type: 'p',
        text: 'Change status from the dropdown on the Applications table, from the detail page (then Save changes), by dragging a card on the Kanban board, or by running Check inbox after a mailbox is connected. Each change is stored on that application’s timeline.',
      },
    ],
  },
  {
    id: 'job-email',
    title: 'Reading Job Email',
    blocks: [
      {
        type: 'p',
        text: 'Settings → Job inbox connects the mailbox that receives messages about jobs you already saved. Check inbox on the Applications page reads recent mail and can move a matching application to Screening, Interview, Offer, or Rejected.',
      },
      {
        type: 'ol',
        items: [
          'Use the email account where recruiters write to you. It can be different from the email you use to sign in here.',
          'Turn on 2-step verification for that account.',
          'Create an app password and name it WhereMyApplication. In Gmail, open Google Account → Security → App passwords. Google shows the password once.',
          'Turn on IMAP. In Gmail: Settings → See all settings → Forwarding and POP/IMAP → Enable IMAP → Save.',
          'In this app, open Settings → Job inbox, choose Gmail, Outlook, Yahoo, or Other IMAP, and paste the mailbox address plus the app password. Do not paste your normal email password.',
          'Save mailbox. The server signs in over IMAP to confirm the password, then stores it encrypted. It is not shown again.',
          'Open Applications → Check inbox. The check looks at about the last 21 days, up to 30 inbox messages.',
        ],
      },
      {
        type: 'ul',
        items: [
          'A message matches one application when the recruiter address equals the recruiter email on the record, or when the company name appears in the message. If several jobs at that company match and the role title does not, nothing is changed.',
          'Interview wording moves the status to Interview. Offer wording moves it to Offer. A clear rejection moves it to Rejected. “Thank you for applying” can move Wishlist to Applied. “Under review” can move it to Screening.',
          'Status does not move backward. Offer, Rejected, and Withdrawn are left as they are. Archived applications are skipped.',
          'The timeline records the status change and the email subject. The message body is not stored.',
          'Disconnect in Settings removes the saved app password. It does not delete applications or mail.',
        ],
      },
      {
        type: 'note',
        text: 'This does not run by itself in the background, and it does not send or delete email. Some Outlook accounts reject app-password IMAP; if Save mailbox fails, use Gmail or another host that allows IMAP. The Chrome extension still does not read your inbox.',
      },
    ],
  },
  {
    id: 'kanban',
    title: 'Using the Kanban Board',
    blocks: [
      {
        type: 'ol',
        items: [
          'Open Kanban from the workspace navigation.',
          'Columns are Wishlist, Applied, Screening, Interview, Offer, and Rejected. Withdrawn stays available in the list and on the detail page, and is not a Kanban column.',
          'Drag a card onto another column. The status updates immediately.',
          'A card shows the role, company, and match score when one has been saved.',
          'Open the card’s title to go to the full application.',
          'Use List view to return to the Applications table.',
        ],
      },
    ],
  },
  {
    id: 'extension-install',
    title: 'Installing the Chrome Extension',
    blocks: [
      {
        type: 'p',
        text: 'WhereMyApplication Capture is a Chrome Manifest V3 side panel (version 1.6.1 in this project). It is loaded unpacked from the extension folder or from the zip on this site. It is not listed here as a Chrome Web Store install.',
      },
      {
        type: 'ol',
        items: [
          'Download wheremyapplication-extension.zip from this page or from the Guide page, then unzip it. The folder you load must contain manifest.json.',
          'In Chrome, open chrome://extensions.',
          'Turn on Developer mode.',
          'Click Load unpacked and select the unzipped folder.',
          'Pin WhereMyApplication Capture. Click the toolbar icon to open the side panel. It stays open while you browse until you close it.',
          'Set API base to your API. Locally that is http://127.0.0.1:5080. Do not use port 5060 — Chrome blocks it. If you deploy the API, use that https URL instead.',
          'Set Web app URL to this site (locally http://127.0.0.1:5173).',
          'Click Test API connection, then Sign in with the same email and password as the web app.',
          'On a job detail page, choose Applied, Wishlist, or Screening, then click Save this job.',
          'If the page does not look like a job, confirm before saving. If the job is already tracked, you can skip it or save anyway.',
        ],
      },
      {
        type: 'p',
        text: 'The side panel is meant for job detail pages on LinkedIn, Indeed, Naukri, Greenhouse, Lever, Workday, and company career sites. It sends scraped fields plus the page title and page text. It does not read every listing page equally well — open the job itself, not only a search results list.',
      },
      {
        type: 'note',
        text: 'Optional: leave “Auto-capture LinkedIn Easy Apply success” on. When LinkedIn shows that the application was sent, the extension can save that job as Applied and skip a duplicate. It does not automatically track every application you make on the web.',
      },
    ],
  },
  {
    id: 'ai-features',
    title: 'Using AI Features',
    blocks: [
      {
        type: 'p',
        text: 'Tracking, Kanban, notes, follow-ups, search, and CSV export work without AI. Enrichment and resume matching run only when the server has a Groq API key configured (GROQ_API_KEY). You do not put that key in the browser.',
      },
      {
        type: 'ul',
        items: [
          'AI enrich reads saved page text and fills gaps such as skills, salary, workplace type, employment type, responsibilities, company details, tags, and a short summary. Existing scraped values are kept.',
          'Enrich can run when a capture includes page text, and again from the AI enrich button on an application.',
          'Resume matching needs resume text on your Profile (or a skills list) plus Groq. On create, a score may be saved automatically when that text is long enough or skills exist.',
          'On the application, Resume↔JD match stores a score from 0 to 100, a summary, matched skills, missing skills, strengths, gaps, and suggestions.',
          'If the match or enrich button is disabled, Groq is not configured on the server you are using, or the application has nothing to compare yet. Add resume text on Profile and try again after the key is set.',
        ],
      },
    ],
  },
  {
    id: 'dashboard-analytics',
    title: 'Dashboard and Analytics',
    blocks: [
      {
        type: 'p',
        text: 'The Dashboard summarizes your active (non-archived) applications. Counts, rates, and charts are calculated from your records only.',
      },
      {
        type: 'ul',
        items: [
          'Status counts show how many applications sit in each pipeline stage.',
          'Interview rate uses applications that entered the pipeline (applied, screening, interview, offer, rejected). Offer rate uses offers among interview plus offer. Rejection rate uses rejected applications in that same pipeline group.',
          'You also see applications this week and this month, a six-month trend, top companies, counts by source, and workplace mix.',
          'Skills that appear often are taken from required and preferred skills saved on your jobs.',
          'Salary insights parse ranges already stored on your applications, such as “$120k–$150k” or “15-20 LPA”, then show how many could be parsed, plus average, median, and averages by role when enough values exist. Links to Levels.fyi, Glassdoor, Indeed, and AmbitionBox open those sites. WhereMyApplication does not scrape them.',
          'Improvement tips can mention missing profile skills or target roles, a high share of rejections, profile skills that rarely appear in your saved descriptions, or a search that has not reached interviews yet. They are suggestions about your own data, not a guarantee of results.',
          'Where to apply lists recent wishlist jobs and builds LinkedIn, Indeed, and Naukri search links from your preferred roles.',
        ],
      },
    ],
  },
  {
    id: 'follow-ups',
    title: 'Follow-ups and Reminders',
    blocks: [
      {
        type: 'p',
        text: 'A new application gets a follow-up date 7 days after the apply date unless you set another date. There is no separate email or calendar push. The reminder lives in the product.',
      },
      {
        type: 'ul',
        items: [
          'Open an application, change Follow-up date, and save.',
          'The Dashboard lists follow-ups that are due so you can decide who to contact.',
          'Add a timeline note when you follow up, including recruiter name or what was discussed.',
        ],
      },
    ],
  },
  {
    id: 'search-export',
    title: 'Search, Archive, and Export',
    blocks: [
      {
        type: 'ul',
        items: [
          'Search looks through role, company, location, notes, tags, required skills, and the AI summary.',
          'Filter by status, source, priority, and archive state: active only, archived only, or both.',
          'Click a company name to filter to that company. Clear that filter from the filter bar.',
          'Group by company, status, or source. Sort by newest applied, recently updated, or company name.',
          'Select rows for bulk status, bulk priority, archive, or delete. Delete asks you to confirm and also removes those applications’ timeline events. Bulk actions cover up to 100 selected rows.',
          'Archive hides a job from the default list, Dashboard, Kanban, salary insights, and CSV export. To bring it back, filter to archived applications, open it, uncheck Archived, and save.',
          'Export CSV downloads active applications. Columns include company, role, location, status, source, priority, workplace and employment type, salary, required skills, applied date, job URL, AI summary, and notes.',
        ],
      },
    ],
  },
  {
    id: 'privacy-account',
    title: 'Privacy and Account Settings',
    blocks: [
      {
        type: 'ul',
        items: [
          'Applications, timeline events, and profile fields are stored for your user id. Another account does not receive them through the app.',
          'Sign-in uses a JWT kept for your session. Private pages and the API require that session.',
          'Change your password in Settings. You must enter the current password. The new password must be at least 8 characters.',
          'Log out from the top bar. Logging out clears the token in this browser.',
          'Delete an application from its detail page. That removes the application and its timeline events for your account.',
          'Register and login are rate-limited. A duplicate email cannot register twice.',
        ],
      },
      {
        type: 'note',
        text: 'The Chrome extension talks to the API base you type into the side panel and signs in with your account. It does not read your inbox. Inbox reading is a separate choice in Settings, and it uses an app password you create for that mailbox.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting and FAQ',
    blocks: [
      {
        type: 'ul',
        items: [
          'Registration says the email is already registered — sign in, or use a different email.',
          'Registration or login fails with a database message — the API cannot reach MongoDB. That is a server configuration issue, not a problem with your password format.',
          'Too many auth attempts — wait and try again. Register and login are limited to 40 attempts per 15 minutes.',
          'Extension cannot reach the API — use Test API connection. Locally use http://127.0.0.1:5080, not port 5060. The web app URL should be the site you sign in on.',
          'Could not read this page — refresh and open the job detail URL rather than a results list. You can still add the job manually.',
          'Saved title or company looks wrong — edit it on the application detail page.',
          'Duplicate warning — that URL or company and role is already in your active applications.',
          'AI enrich or match is unavailable — the server has no Groq key, or Profile has no resume text or skills to compare. Core tracking still works.',
          'You cannot see applications — confirm you are signed in to the same account that saved them.',
          'Mailbox sign-in failed — use an app password, not your normal email password, and turn IMAP on for that account. Gmail: Google Account → Security → App passwords, then Gmail Settings → Forwarding and POP/IMAP → Enable IMAP.',
          'Check inbox changed nothing — the company name on the application has to appear in the message, or the recruiter email has to match the sender. Offer, Rejected, and Withdrawn are not moved backward.',
        ],
      },
    ],
  },
];
