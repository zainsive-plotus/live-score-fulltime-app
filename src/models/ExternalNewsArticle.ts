// src/models/ExternalNewsArticle.ts
import mongoose, { Schema, Document } from "mongoose";

// Interface for a single external news article
export interface IExternalNewsArticle extends Document {
  articleId: string; // Unique ID from the newsdata.io API
  title: string;
  link: string; // Original URL of the article
  keywords?: string[];
  creator?: string | null;
  video_url?: string | null;
  description?: string | null;
  content?: string | null;
  pubDate: Date; // Published date from newsdata.io
  imageUrl?: string | null; // URL of the featured image
  source_id?: string; // ID of the source (e.g., cnn, bbc-news)
  source_priority?: number;
  source_url?: string;
  source_icon?: string | null;
  language?: string;
  country?: string[];
  category?: string[];
  sentiment?: string; // Positive, Negative, Neutral
  // --- UPDATED STATUS ENUM ---
  status: "fetched" | "processing" | "processed" | "skipped" | "error"; // Added 'processing'
  processedPostId?: mongoose.Types.ObjectId; // Link to the generated Post if processed
  createdAt: Date;
  updatedAt: Date;
}

const ExternalNewsArticleSchema: Schema = new Schema(
  {
    articleId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    link: { type: String, required: true },
    keywords: [{ type: String }],
    creator: { type: String },
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
    // --- UPDATED SCHEMA ENUM ---
    status: {
      type: String,
      enum: ["fetched", "processing", "processed", "skipped", "error"],
      default: "fetched",
    }, // Added 'processing'
    processedPostId: { type: Schema.Types.ObjectId, ref: "Post" }, // Reference to our Post model
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Ensure the model is only compiled once
const ExternalNewsArticle =
  mongoose.models.ExternalNewsArticle ||
  mongoose.model<IExternalNewsArticle>(
    "ExternalNewsArticle",
    ExternalNewsArticleSchema
  );

export default ExternalNewsArticle;
