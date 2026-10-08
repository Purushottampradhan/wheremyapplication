import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { TIMELINE_TYPES } from '../utils/constants.js';

const timelineEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: false,
      default: null,
      index: true,
    },
    type: { type: String, enum: TIMELINE_TYPES, required: true },
    fromStatus: { type: String, default: null },
    toStatus: { type: String, default: null },
    message: { type: String, default: '' },
    rawMeta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

timelineEventSchema.index({ userId: 1, createdAt: -1 });

export type TimelineEventDoc = InferSchemaType<typeof timelineEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TimelineEvent: Model<TimelineEventDoc> =
  mongoose.models.TimelineEvent ||
  mongoose.model<TimelineEventDoc>('TimelineEvent', timelineEventSchema);
