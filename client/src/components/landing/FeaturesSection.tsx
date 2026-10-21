import { Icon, type IconName } from './icons';

const FEATURES: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: 'briefcase',
    title: 'Job application tracking',
    text: 'Save company, role, job URL, location, date, status, salary, notes, and the rest of the detail you want on the record.',
  },
  {
    icon: 'layers',
    title: 'Application pipeline',
    text: 'Move each role through Wishlist, Applied, Screening, Interview, Offer, Rejected, or Withdrawn.',
  },
  {
    icon: 'columns',
    title: 'Kanban board',
    text: 'See the pipeline as columns and change status by dragging a card. Withdrawn stays on the list and detail page.',
  },
  {
    icon: 'scan',
    title: 'AI resume-to-job matching',
    text: 'When Groq is configured and your resume text or skills are on your profile, open a match score, matched and missing skills, and suggestions.',
  },
  {
    icon: 'spark',
    title: 'AI job enrichment',
    text: 'When Groq is configured, page text can fill gaps such as skills, responsibilities, employment type, salary, and a short summary.',
  },
  {
    icon: 'chart',
    title: 'Job search analytics',
    text: 'Review status counts, a six-month trend, source mix, and interview, offer, and rejection rates from your own applications.',
  },
  {
    icon: 'banknote',
    title: 'Salary insights',
    text: 'Parse salary text you have saved and see an average and median when enough ranges can be read. External sites open in a new tab.',
  },
  {
    icon: 'bell',
    title: 'Follow-up reminders',
    text: 'New applications start with a follow-up seven days out. The dashboard lists the ones that are due.',
  },
  {
    icon: 'panel',
    title: 'Chrome extension',
    text: 'Capture a job from a supported detail page into your account instead of typing every field. It does not watch every site automatically.',
  },
  {
    icon: 'user',
    title: 'Profile and resume',
    text: 'Store preferred roles, locations, skills, experience, a resume link, and resume text used for matching and search suggestions.',
  },
  {
    icon: 'filter',
    title: 'Search, filters, and bulk actions',
    text: 'Search, filter, sort, and group applications. Select rows to set status or priority, archive, or delete.',
  },
  {
    icon: 'download',
    title: 'CSV export',
    text: 'Download your active applications for a personal spreadsheet or backup. Archived rows are left out of the file.',
  },
];

export function FeaturesSection() {
  return (
    <section className="landing-section" id="features" aria-labelledby="features-title">
      <div className="section-intro">
        <p className="eyebrow">Features</p>
        <h2 id="features-title">What you can do in the workspace</h2>
        <p className="section-lead">
          The same account covers capture, pipeline, notes, and the dashboard. AI steps are
          optional and depend on server configuration.
        </p>
      </div>
      <div className="feature-grid">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="feature-card">
            <span className="feature-icon">
              <Icon name={feature.icon} />
            </span>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
