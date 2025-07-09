// src/models/ExternalNewsArticle.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IExternalNewsArticle extends Document {
  articleId: string;
  title: string;
  link: string;
  keywords?: string[];
  // --- THE FIX IS HERE ---
  // Creator can now be an array of strings, matching the API
  creator?: string[];
  video_url?: string | null;
  description?: string | null;
  content?: string | null;
  pubDate: Date;
  imageUrl?: string | null;
  source_id?: string;
  source_priority?: number;
  source_url?: string;
  source_icon?: string | null;
  language?: string;
  country?: string[];
  category?: string[];
  sentiment?: string;
  status: "fetched" | "processing" | "processed" | "skipped" | "error";
  processedPostId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExternalNewsArticleSchema: Schema = new Schema(
  {
    articleId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    link: { type: String, required: true },
    keywords: [{ type: String }],

    // --- THE FIX IS HERE ---
    // Changed from `creator: { type: String }` to an array of strings
    creator: [{ type: String }],

    video_url: { type: String },
    description: { type: String },
    content: { type: String },
    pubDate: { type: Date, required: true, index: true },
    imageUrl: { type: String },
    source_id: { type: String },
    source_priority: { type: Number },
    source_url: { type: String },
    source_icon: { type: String },
    language: { type: String },
    country: [{ type: String }],
    category: [{ type: String }],
    sentiment: { type: String },
    status: {
      type: String,
      enum: ["fetched", "processing", "processed", "skipped", "error"],
      default: "fetched",
    },
    processedPostId: { type: Schema.Types.ObjectId, ref: "Post" },
  },
  {
    timestamps: true,
  }
);

const ExternalNewsArticle =
  mongoose.models.ExternalNewsArticle ||
  mongoose.model<IExternalNewsArticle>(
    "ExternalNewsArticle",
    ExternalNewsArticleSchema
  );

export default ExternalNewsArticle;
