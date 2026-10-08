import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

export type UserProfile = {
  skills: string[];
  preferredRoles: string[];
  preferredLocations: string[];
  experienceYears: number;
  resumeUrl: string;
  resumeText: string;
};

export type UserAttrs = {
  email: string;
  passwordHash: string;
  name: string;
  profile?: UserProfile;
};

const profileSchema = new Schema(
  {
    skills: { type: [String], default: [] },
    preferredRoles: { type: [String], default: [] },
    preferredLocations: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0 },
    resumeUrl: { type: String, default: '' },
    resumeText: { type: String, default: '' },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    profile: { type: profileSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export type UserDoc = HydratedDocument<UserAttrs>;

export const User: Model<UserAttrs> =
  mongoose.models.User || mongoose.model<UserAttrs>('User', userSchema);
