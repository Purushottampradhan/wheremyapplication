export function AiShowcase() {
  return (
    <section className="landing-section" id="ai-insights" aria-labelledby="ai-title">
      <div className="section-intro">
        <p className="eyebrow">AI insights</p>
        <h2 id="ai-title">Optional help reading a job against your resume</h2>
        <p className="section-lead">
          Enrichment and matching call Groq from the server when GROQ_API_KEY is set. You can
          track every application without that key. Nothing below is a live model result.
        </p>
      </div>
      <p className="sample-banner">
        Sample preview of how a saved match and summary are laid out. This score was not generated
        for a real resume.
      </p>
      <div className="ai-layout">
        <article className="showcase-card">
          <div className="match-top">
            <h3>Resume to job match</h3>
            <p className="score">
              72<span>/100</span>
            </p>
          </div>
          <p>
            Sample summary: the resume covers the core web stack named in the description and is
            lighter on the stated data-modeling work.
          </p>
          <h4>Matched skills</h4>
          <div className="skill-cloud">
            <span>TypeScript</span>
            <span>React</span>
            <span>REST APIs</span>
          </div>
          <h4>Missing skills</h4>
          <div className="skill-cloud muted-cloud">
            <span>PostgreSQL</span>
            <span>System design</span>
          </div>
          <h4>Suggestions</h4>
          <ul className="plain-list">
            <li>Add a short project note where you modeled relational data.</li>
            <li>Mirror the job’s testing tools if you have used them.</li>
          </ul>
        </article>
        <article className="showcase-card">
          <h3>Extracted job information</h3>
          <dl className="extract-list">
            <div>
              <dt>Role</dt>
              <dd>Frontend Engineer</dd>
            </div>
            <div>
              <dt>Workplace</dt>
              <dd>Hybrid</dd>
            </div>
            <div>
              <dt>Employment</dt>
              <dd>Full-time</dd>
            </div>
            <div>
              <dt>Salary text</dt>
              <dd>$120k–$150k</dd>
            </div>
          </dl>
          <h4>AI summary</h4>
          <p>
            Sample summary text: a product-engineering role focused on a TypeScript interface,
            with collaboration across design and a stated preference for people who have shipped
            responsive web apps.
          </p>
        </article>
      </div>
    </section>
  );
}
