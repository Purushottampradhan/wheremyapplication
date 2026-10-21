/** Illustrative layout data only. Not a real account and not platform usage. */
export const SAMPLE_NOTE =
  'Illustrative sample workspace. These figures are not live user data and do not describe how many people use WhereMyApplication.';

export const sampleHero = {
  total: 25,
  inProgress: 14,
  interviews: 2,
  offers: 1,
};

export const sampleStatuses = [
  { label: 'Wishlist', value: 4, tone: 'neutral' },
  { label: 'Applied', value: 9, tone: 'info' },
  { label: 'Screening', value: 3, tone: 'info' },
  { label: 'Interview', value: 2, tone: 'warn' },
  { label: 'Offer', value: 1, tone: 'ok' },
  { label: 'Rejected', value: 5, tone: 'bad' },
  { label: 'Withdrawn', value: 1, tone: 'neutral' },
];

export const sampleMonths = [
  { label: 'May', count: 2 },
  { label: 'Jun', count: 3 },
  { label: 'Jul', count: 4 },
  { label: 'Aug', count: 6 },
  { label: 'Sep', count: 5 },
  { label: 'Oct', count: 5 },
];

export const sampleSources = [
  { label: 'LinkedIn', count: 12 },
  { label: 'Indeed', count: 6 },
  { label: 'Naukri', count: 4 },
  { label: 'Career site', count: 3 },
];

export const sampleWorkplace = [
  { label: 'Remote', count: 10 },
  { label: 'Hybrid', count: 8 },
  { label: 'On-site', count: 5 },
  { label: 'Unknown', count: 2 },
];

export const sampleSkills = [
  { skill: 'TypeScript', count: 8 },
  { skill: 'React', count: 7 },
  { skill: 'Node.js', count: 5 },
  { skill: 'SQL', count: 4 },
];

export const sampleRecent = [
  { company: 'Northwind Labs', role: 'Frontend Engineer', status: 'Interview', source: 'LinkedIn' },
  { company: 'Harbor Systems', role: 'Full Stack Developer', status: 'Applied', source: 'Indeed' },
  { company: 'Cedar Health', role: 'Software Engineer', status: 'Screening', source: 'Naukri' },
  { company: 'Lumen Goods', role: 'Product Engineer', status: 'Wishlist', source: 'Career site' },
];

export const sampleFollowUps = [
  { company: 'Harbor Systems', role: 'Full Stack Developer', when: 'Due 12 Oct' },
  { company: 'Cedar Health', role: 'Software Engineer', when: 'Due 10 Oct' },
];

/** Mids of the three sample ranges below: 135k, 115k, 155k. */
export const sampleSalary = {
  counted: 3,
  average: 135000,
  median: 135000,
  rows: [
    { company: 'Northwind Labs', range: '$120k–$150k' },
    { company: 'Harbor Systems', range: '$100k–$130k' },
    { company: 'Lumen Goods', range: '$140k–$170k' },
  ],
};

/**
 * Same formulas as the live dashboard, applied only to this sample:
 * pipeline entered = applied + screening + interview + offer + rejected = 20
 * interview rate = (interview + offer) / pipeline entered = 15%
 * offer rate = offer / (interview + offer) = 33%
 * rejection rate = rejected / pipeline entered = 25%
 */
export const sampleRates = {
  interview: 15,
  offer: 33,
  rejection: 25,
};
