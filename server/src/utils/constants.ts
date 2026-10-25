export const APPLICATION_STATUSES = [
  'wishlist',
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_SOURCES = [
  'linkedin',
  'indeed',
  'naukri',
  'wellfound',
  'instahyre',
  'career_site',
  'manual',
  'other',
] as const;

export type ApplicationSource = (typeof APPLICATION_SOURCES)[number];

export const TIMELINE_TYPES = [
  'created',
  'status_change',
  'note',
  'extension_capture',
] as const;

export type TimelineType = (typeof TIMELINE_TYPES)[number];
