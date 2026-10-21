import { useId, useState } from 'react';

const QUESTIONS = [
  {
    q: 'Is WhereMyApplication free to use?',
    a: 'This application does not show a price or a checkout. Creating an account does not ask for payment. A public price for hosted use is not defined here.',
  },
  {
    q: 'Do I need an account?',
    a: 'You can read this page without an account. Saving applications, the dashboard, Kanban, profile, and settings require you to register and sign in.',
  },
  {
    q: 'Can I track jobs from multiple job portals?',
    a: 'Yes. Sources include LinkedIn, Indeed, Naukri, career sites, manual entry, and other. You can also capture a job detail page with the extension when the page can be read.',
  },
  {
    q: 'Does the Chrome extension work with the web app?',
    a: 'Yes. Sign in on the side panel with the same email and password, pointed at the same API. Saved jobs show up in that account’s workspace.',
  },
  {
    q: 'Do AI features work without Groq configuration?',
    a: 'No. Enrichment and resume matching need a Groq API key on the server. Saving jobs, statuses, notes, follow-ups, search, and CSV export do not.',
  },
  {
    q: 'Can I export my applications?',
    a: 'Yes. Applications → Export CSV downloads your active applications. Archived applications are excluded from that file.',
  },
  {
    q: 'Can other users see my applications?',
    a: 'The app loads applications for the signed-in user only. Another login does not receive your list through the product.',
  },
  {
    q: 'Can it read job email and update status?',
    a: 'Yes, after you connect that mailbox in Settings with an app password and turn on IMAP. Applications → Check inbox reads recent messages and can move a matching job to screening, interview, offer, or rejected. It does not run in the background, and the Chrome extension does not read your inbox.',
  },
  {
    q: 'Can I use the application on mobile?',
    a: 'The website is responsive, so you can review and update applications in a phone browser. The Chrome extension is a desktop side panel.',
  },
  {
    q: 'How can I delete an application?',
    a: 'Open the application and choose Delete. That removes the application and its timeline events. You can also select rows on the Applications page and use bulk delete, which asks you to confirm.',
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={`faq-item ${open ? 'is-open' : ''}`}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{question}</span>
          <span aria-hidden="true">{open ? '−' : '+'}</span>
        </button>
      </h3>
      <div id={panelId} role="region" hidden={!open}>
        <p>{answer}</p>
      </div>
    </div>
  );
}

export function FaqSection() {
  return (
    <section className="landing-section" id="faq" aria-labelledby="faq-title">
      <div className="section-intro">
        <p className="eyebrow">FAQ</p>
        <h2 id="faq-title">Practical questions</h2>
      </div>
      <div className="faq-list">
        {QUESTIONS.map((item) => (
          <FaqItem key={item.q} question={item.q} answer={item.a} />
        ))}
      </div>
    </section>
  );
}
