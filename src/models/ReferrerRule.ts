// ===== src/models/ReferrerRule.ts =====

import mongoose, { Schema, Document, Model } from "mongoose";

interface IReferrerHit {
  timestamp: Date;
  ipHash: string; // To store a hashed version of the IP for privacy
  userAgent?: string;
  landingPage: string; // The full URL the user landed on
}

export interface IReferrerRule extends Document {
  sourceUrl: string;
  targetPage: string;
  description: string;
  hitCount: number;
  analytics: IReferrerHit[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReferrerHitSchema: Schema<IReferrerHit> = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    ipHash: { type: String, required: true },
    userAgent: { type: String },
    landingPage: { type: String, required: true },
  },
  { _id: false }
);

const ReferrerRuleSchema: Schema<IReferrerRule> = new Schema(
  {
    sourceUrl: {
      type: String,
      required: [true, "The source URL to track is required."],
      unique: true, // Each external URL can only have one rule
      index: true,
      trim: true,
    },
    targetPage: {
      type: String,
      required: [true, "The expected landing page is required."],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "A description is required for internal tracking."],
      trim: true,
    },
    hitCount: {
      type: Number,
      default: 0,
    },
    analytics: [ReferrerHitSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Index for quickly finding active rules
    },
  },
  {
    timestamps: true,
  }
);

const ReferrerRule: Model<IReferrerRule> =
  mongoose.models.ReferrerRule ||
  mongoose.model<IReferrerRule>("ReferrerRule", ReferrerRuleSchema);

export default ReferrerRule;
