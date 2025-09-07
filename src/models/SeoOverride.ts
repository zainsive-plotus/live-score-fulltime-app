// ===== src/models/SeoOverride.ts =====

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISeoOverride extends Document {
  entityType: string; // e.g., "league-standings"
  entityId: string; // e.g., "39" for Premier League
  language: string; // e.g., "en", "tr"
  metaTitle?: string;
  metaDescription?: string;
  seoText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SeoOverrideSchema: Schema<ISeoOverride> = new Schema(
  {
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      index: true,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    seoText: {
      type: String, // Storing as HTML
    },
  },
  {
    timestamps: true,
  }
);

// Create a unique compound index to ensure only one override document
// can exist for a specific entity in a specific language.
SeoOverrideSchema.index(
  { entityType: 1, entityId: 1, language: 1 },
  { unique: true }
);

const SeoOverride: Model<ISeoOverride> =
  mongoose.models.SeoOverride ||
  mongoose.model<ISeoOverride>("SeoOverride", SeoOverrideSchema);

export default SeoOverride;
