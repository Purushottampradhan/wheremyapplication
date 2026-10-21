const PROBLEMS = [
  {
    title: 'Scattered records',
    text: 'Applications live across job portals, email, and spreadsheets, so the full list is hard to see.',
  },
  {
    title: 'Missed follow-ups',
    text: 'Interview dates and the “check back in a week” note get lost once you move on to the next role.',
  },
  {
    title: 'Unclear status',
    text: 'Wishlist, applied, screening, and interview blur together when nothing records the last change.',
  },
  {
    title: 'No picture of progress',
    text: 'Without your own counts, it is difficult to see which skills or habits are worth adjusting.',
  },
];

export function ProblemSection() {
  return (
    <section className="landing-section" aria-labelledby="problem-title">
      <div className="section-intro">
        <p className="eyebrow">Why it exists</p>
        <h2 id="problem-title">A job search is easier to run when it lives in one workspace.</h2>
        <p className="section-lead">
          WhereMyApplication keeps the roles you care about, the stage each one is in, and the
          follow-up you still owe — under your own login.
        </p>
      </div>
      <div className="problem-grid">
        {PROBLEMS.map((item) => (
          <article key={item.title} className="problem-card">
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
