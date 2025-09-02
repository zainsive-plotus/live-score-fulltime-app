// ===== src/models/TrackedLink.ts =====

import mongoose, { Schema, Document, Model } from "mongoose";

interface IClickAnalytics {
  timestamp: Date;
  ipHash: string; // To store a hashed version of the IP for privacy
  userAgent?: string;
  referrer?: string;
}

export interface ITrackedLink extends Document {
  originalUrl: string;
  shortCode: string;
  fullShortLink: string;
  description: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  clickCount: number;
  analytics: IClickAnalytics[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClickAnalyticsSchema: Schema<IClickAnalytics> = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    ipHash: { type: String, required: true },
    userAgent: { type: String },
    referrer: { type: String },
  },
  { _id: false }
);

const TrackedLinkSchema: Schema<ITrackedLink> = new Schema(
  {
    originalUrl: {
      type: String,
      required: [true, "Original destination URL is required."],
      trim: true,
    },
    shortCode: {
      type: String,
      required: [true, "Short code is required."],
      unique: true,
      index: true,
    },
    fullShortLink: {
      type: String,
      required: [true, "Full short link is required."],
    },
    description: {
      type: String,
      required: [true, "A description is required for internal tracking."],
      trim: true,
    },
    utmSource: { type: String, trim: true },
    utmMedium: { type: String, trim: true },
    utmCampaign: { type: String, trim: true },
    clickCount: {
      type: Number,
      default: 0,
    },
    analytics: [ClickAnalyticsSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    // Limit the size of the analytics array to prevent unbounded document growth
    capped: { max: 10000, size: 10485760 }, // Example: max 10k clicks or ~10MB
  }
);

// Optimize query performance for the most common lookup
TrackedLinkSchema.index({ shortCode: 1 });

const TrackedLink: Model<ITrackedLink> =
  mongoose.models.TrackedLink ||
  mongoose.model<ITrackedLink>("TrackedLink", TrackedLinkSchema);

export default TrackedLink;
