// ===== src/models/SocialLink.ts =====

import mongoose, { Schema, Document, Model } from "mongoose";

// A list of supported platforms. This helps in mapping to icons on the frontend.
export type SupportedPlatform =
  | "facebook"
  | "twitter"
  | "instagram"
  | "youtube"
  | "linkedin"
  | "telegram"
  | "discord";

export interface ISocialLink extends Document {
  platform: SupportedPlatform;
  url: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SocialLinkSchema: Schema<ISocialLink> = new Schema(
  {
    platform: {
      type: String,
      required: [true, "Platform is required."],
      enum: [
        "facebook",
        "twitter",
        "instagram",
        "youtube",
        "linkedin",
        "telegram",
        "discord",
      ],
      trim: true,
    },
    url: {
      type: String,
      required: [true, "URL is required."],
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true, // Index for fast sorting
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Index for quickly fetching active links
    },
  },
  {
    timestamps: true,
  }
);

// Prevent creating duplicate links for the same platform
SocialLinkSchema.index({ platform: 1 }, { unique: true });

const SocialLink: Model<ISocialLink> =
  mongoose.models.SocialLink ||
  mongoose.model<ISocialLink>("SocialLink", SocialLinkSchema);

export default SocialLink;
