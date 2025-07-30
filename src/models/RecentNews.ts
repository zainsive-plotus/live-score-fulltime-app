// ===== src/models/RecentNews.ts =====

import mongoose, { Schema, Document, Model } from "mongoose";
import { SportsCategory } from "./Post"; // We can reuse the category type

/**
 * Represents an AI-generated news snippet that links to an external source.
 * This is kept separate from the main 'Post' collection which contains full, original articles.
 */
export interface IRecentNews extends Document {
  title: string;
  content: string; // Will store the short, humanized description + "Read More" link
  slug: string;
  author: string;
  featuredImage?: string;
  language: string;
  translationGroupId: mongoose.Types.ObjectId;
  sportsCategory: SportsCategory[];
  originalArticleLink: string; // Direct link to the source article
  createdAt: Date;
  updatedAt: Date;
}

const RecentNewsSchema: Schema<IRecentNews> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    author: { type: String, required: true },
    featuredImage: { type: String, trim: true },
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
    },
    originalArticleLink: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

RecentNewsSchema.index({ slug: 1, language: 1 }, { unique: true });

const RecentNews: Model<IRecentNews> =
  mongoose.models.RecentNews ||
  mongoose.model<IRecentNews>("RecentNews", RecentNewsSchema);

export default RecentNews;