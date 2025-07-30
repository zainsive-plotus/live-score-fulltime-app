// ===== src/models/Post.ts =====

import mongoose, { Schema, Document } from "mongoose";

export type SportsCategory = "football" | "basketball" | "tennis" | "general";
// --- Start of Change ---
// Added 'recent' for AI-generated curated news. 'curated' is removed to avoid confusion.
export type NewsType = "news" | "highlights" | "reviews" | "prediction" | "transfer" | "recent";
// --- End of Change ---

export interface IPost extends Document {
  title: string;
  content: string;
  slug: string;
  author: string;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
  featuredImage?: string;
  featuredImageTitle?: string;
  featuredImageAltText?: string;
  metaTitle?: string;
  metaDescription?: string;

  language: string;
  translationGroupId: mongoose.Types.ObjectId;

  sportsCategory: SportsCategory[];
  isAIGenerated?: boolean;
  originalExternalArticleId?: mongoose.Types.ObjectId;
  originalFixtureId?: number;
  newsType: NewsType;
  linkedFixtureId?: number;
  linkedLeagueId?: number;
  linkedTeamId?: number;
  originalSourceUrl?: string; 
}

const PostSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    author: { type: String, default: "Admin" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    featuredImage: { type: String, trim: true },
    featuredImageTitle: { type: String, trim: true },
    featuredImageAltText: { type: String, trim: true },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },

    language: {
      type: String,
      required: true,
      index: true,
    },
    translationGroupId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    sportsCategory: {
      type: [
        {
          type: String,
          enum: ["football", "basketball", "tennis", "general"],
        },
      ],
      default: ["general"],
      required: true,
    },
    isAIGenerated: { type: Boolean, default: false },
    originalExternalArticleId: {
      type: Schema.Types.ObjectId,
      ref: "ExternalNewsArticle",
      required: false,
    },
    originalFixtureId: {
      type: Number,
      required: false,
      unique: true,
      sparse: true,
    },
    // --- Start of Change ---
    // Updated the enum to include the new 'recent' type.
    newsType: {
      type: String,
      enum: ["news", "highlights", "reviews", "prediction", "transfer", "recent"],
      default: "news",
      required: true,
    },
    // --- End of Change ---
    originalSourceUrl: {
      type: String,
      trim: true,
    },
    linkedFixtureId: {
      type: Number,
      required: false,
      index: true,
    },
    linkedLeagueId: {
      type: Number,
      required: false,
      index: true,
    },
    linkedTeamId: {
      type: Number,
      required: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

PostSchema.index({ slug: 1, language: 1 }, { unique: true });

export default (mongoose.models.Post as mongoose.Model<IPost>) ||
  mongoose.model<IPost>("Post", PostSchema);