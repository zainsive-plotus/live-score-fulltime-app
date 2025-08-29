import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISeoContent extends Document {
  pageType: string; // e.g., 'league-standings'
  entityId: string; // e.g., the leagueId '39'
  language: string;
  seoText: string; // The final generated HTML
  createdAt: Date;
  updatedAt: Date;
}

const SeoContentSchema: Schema<ISeoContent> = new Schema(
  {
    pageType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    language: { type: String, required: true, index: true },
    seoText: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Ensure unique content for each entity/page/language combination
SeoContentSchema.index(
  { pageType: 1, entityId: 1, language: 1 },
  { unique: true }
);

const SeoContent: Model<ISeoContent> =
  mongoose.models.SeoContent ||
  mongoose.model<ISeoContent>("SeoContent", SeoContentSchema);

export default SeoContent;
