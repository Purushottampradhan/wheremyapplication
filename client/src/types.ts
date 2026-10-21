export type ApplicationStatus =
  | 'wishlist'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export type ApplicationSource =
  | 'linkedin'
  | 'indeed'
  | 'naukri'
  | 'career_site'
  | 'manual'
  | 'other';

export type UserProfile = {
  skills: string[];
  preferredRoles: string[];
  preferredLocations: string[];
  experienceYears: number;
  resumeUrl: string;
  resumeText?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  profile: UserProfile;
};

export type Application = {
  _id: string;
  company: string;
  roleTitle: string;
  location: string;
  jobUrl: string;
  source: ApplicationSource;
  status: ApplicationStatus;
  appliedAt: string;
  lastStatusAt: string;
  notes: string;
  salaryRange: string;
  jobDescription: string;
  externalJobId: string;
  followUpAt: string | null;
  employmentType?: string;
  workplaceType?: string;
  experienceLevel?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  companyDescription?: string;
  companyIndustry?: string;
  companySize?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  applicationDeadline?: string;
  pageTitle?: string;
  pageText?: string;
  aiSummary?: string;
  aiExtracted?: Record<string, unknown>;
  aiEnrichedAt?: string | null;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  archived?: boolean;
  matchScore?: number | null;
  matchDetails?: {
    score?: number;
    summary?: string;
    matchedSkills?: string[];
    missingSkills?: string[];
    strengths?: string[];
    gaps?: string[];
    suggestions?: string[];
  };
  matchComputedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TimelineEvent = {
  _id: string;
  applicationId: string | null;
  type: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  message: string;
  rawMeta?: Record<string, unknown>;
  createdAt: string;
};

export const STATUSES: ApplicationStatus[] = [
  'wishlist',
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
];

export const SOURCES: ApplicationSource[] = [
  'linkedin',
  'indeed',
  'naukri',
  'career_site',
  'manual',
  'other',
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  wishlist: 'Wishlist',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
} as const;

export const SOURCE_LABELS: Record<ApplicationSource, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  naukri: 'Naukri',
  career_site: 'Career site',
  manual: 'Manual',
  other: 'Other',
};
