import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EXTENSION_ZIP } from '../../extensionLink';
import { GUIDE_TOPICS } from './guideContent';

export function UserGuideSection() {
  const [activeId, setActiveId] = useState(GUIDE_TOPICS[0].id);
  const active = GUIDE_TOPICS.find((topic) => topic.id === activeId) ?? GUIDE_TOPICS[0];

  useEffect(() => {
    function openFromHash() {
      const id = window.location.hash.replace('#', '');
      if (GUIDE_TOPICS.some((topic) => topic.id === id)) setActiveId(id);
    }
    function onGuide(event: Event) {
      const id = (event as CustomEvent<string>).detail;
      if (GUIDE_TOPICS.some((topic) => topic.id === id)) setActiveId(id);
    }
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    window.addEventListener('wma-guide', onGuide);
    return () => {
      window.removeEventListener('hashchange', openFromHash);
      window.removeEventListener('wma-guide', onGuide);
    };
  }, []);

  return (
    <section className="landing-section" id="user-guide" aria-labelledby="guide-title">
      <div className="section-intro">
        <p className="eyebrow">User guide</p>
        <h2 id="guide-title">How to use WhereMyApplication</h2>
        <p className="section-lead">
          The steps below match the current web app, API, and extension. The separate{' '}
          <Link to="/guide">guide page</Link> still hosts the same extension download.
        </p>
      </div>
      <span id="extension-install" className="anchor-target" />
      <div className="guide-shell">
        <div className="guide-switch">
          <label htmlFor="guide-topic">Guide topic</label>
          <select
            id="guide-topic"
            value={activeId}
            onChange={(event) => setActiveId(event.target.value)}
          >
            {GUIDE_TOPICS.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.title}
              </option>
            ))}
          </select>
        </div>
        <nav className="guide-side" aria-label="Guide topics">
          {GUIDE_TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              className={topic.id === activeId ? 'is-active' : ''}
              aria-current={topic.id === activeId ? 'true' : undefined}
              onClick={() => setActiveId(topic.id)}
            >
              {topic.title}
            </button>
          ))}
        </nav>
        <article className="guide-body">
          <h3>{active.title}</h3>
          {active.blocks.map((block, index) => {
            if (block.type === 'p') return <p key={index}>{block.text}</p>;
            if (block.type === 'note') {
              return (
                <p key={index} className="guide-note">
                  {block.text}
                </p>
              );
            }
            if (block.type === 'ul') {
              return (
                <ul key={index}>
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              );
            }
            return (
              <ol key={index}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            );
          })}
          {active.id === 'extension-install' ? (
            <p>
              <a className="btn primary" href={EXTENSION_ZIP} download>
                Download extension zip
              </a>
            </p>
          ) : null}
          {active.id === 'getting-started' ? (
            <p className="guide-links">
              <Link to="/register">Register</Link>
              <Link to="/login">Sign in</Link>
            </p>
          ) : null}
        </article>
      </div>
    </section>
  );
}
