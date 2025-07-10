// ===== src/models/Post.ts =====

import mongoose, { Schema, Document } from "mongoose";

// --- REFINED: This type now only defines the sport itself. ---
export type SportsCategory = "football" | "basketball" | "tennis" | "general";

// The type of the news article (what it's about, not the sport).
export type NewsType = "news" | "highlights" | "reviews" | "prediction";

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

  // --- RENAMED & REFINED: The field is now `sportsCategory`. ---
  sportsCategory: SportsCategory[];

  isAIGenerated?: boolean;
  originalExternalArticleId?: mongoose.Types.ObjectId;
  originalFixtureId?: number;
  newsType: NewsType;
  linkedFixtureId?: number;
  linkedLeagueId?: number;
  linkedTeamId?: number;
}

const PostSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    slug: {
      type: String,
      required: true,
      unique: true,
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

    // --- RENAMED & REFINED: Schema definition for the `sportsCategory` field. ---
    sportsCategory: {
      type: [
        {
          type: String,
          enum: ["football", "basketball", "tennis", "general"],
        },
      ],
      default: ["general"], // Default to an array with 'general'
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
    newsType: {
      type: String,
      enum: ["news", "highlights", "reviews", "prediction"],
      default: "news",
      required: true,
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

export default (mongoose.models.Post as mongoose.Model<IPost>) ||
  mongoose.model<IPost>("Post", PostSchema);
