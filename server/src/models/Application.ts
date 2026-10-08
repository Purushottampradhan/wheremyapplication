import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  type ApplicationSource,
  type ApplicationStatus,
} from '../utils/constants.js';

export type ApplicationAttrs = {
  userId: mongoose.Types.ObjectId;
  company: string;
  roleTitle: string;
  location?: string;
  jobUrl?: string;
  source?: ApplicationSource;
  status?: ApplicationStatus;
  appliedAt?: Date;
  lastStatusAt?: Date;
  notes?: string;
  salaryRange?: string;
  jobDescription?: string;
  externalJobId?: string;
  followUpAt?: Date | null;
  // Rich capture / AI fields
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
  aiEnrichedAt?: Date | null;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  archived?: boolean;
  matchScore?: number | null;
  matchDetails?: Record<string, unknown>;
  matchComputedAt?: Date | null;
};

const applicationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, required: true, trim: true },
    roleTitle: { type: String, required: true, trim: true },
    location: { type: String, default: '', trim: true },
    jobUrl: { type: String, default: '', trim: true },
    source: {
      type: String,
      enum: APPLICATION_SOURCES,
      default: 'manual',
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'applied',
      index: true,
    },
    appliedAt: { type: Date, default: Date.now },
    lastStatusAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    salaryRange: { type: String, default: '' },
    jobDescription: { type: String, default: '' },
    externalJobId: { type: String, default: '' },
    followUpAt: { type: Date, default: null },
    employmentType: { type: String, default: '' },
    workplaceType: { type: String, default: '' },
    experienceLevel: { type: String, default: '' },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    responsibilities: { type: String, default: '' },
    requirements: { type: String, default: '' },
    benefits: { type: String, default: '' },
    companyDescription: { type: String, default: '' },
    companyIndustry: { type: String, default: '' },
    companySize: { type: String, default: '' },
    recruiterName: { type: String, default: '' },
    recruiterEmail: { type: String, default: '' },
    applicationDeadline: { type: String, default: '' },
    pageTitle: { type: String, default: '' },
    pageText: { type: String, default: '' },
    aiSummary: { type: String, default: '' },
    aiExtracted: { type: Schema.Types.Mixed, default: {} },
    aiEnrichedAt: { type: Date, default: null },
    tags: { type: [String], default: [] },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    archived: { type: Boolean, default: false, index: true },
    matchScore: { type: Number, default: null },
    matchDetails: { type: Schema.Types.Mixed, default: {} },
    matchComputedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

applicationSchema.index({ userId: 1, appliedAt: -1 });
applicationSchema.index({ userId: 1, company: 1 });
applicationSchema.index({ userId: 1, status: 1 });
applicationSchema.index({ userId: 1, archived: 1, status: 1 });

export type ApplicationDoc = HydratedDocument<ApplicationAttrs>;

export const Application: Model<ApplicationAttrs> =
  mongoose.models.Application ||
  mongoose.model<ApplicationAttrs>('Application', applicationSchema);
