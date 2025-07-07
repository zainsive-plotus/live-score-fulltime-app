// src/models/Post.ts
import mongoose, { Schema, Document } from "mongoose";

// Define the types of sports/categories a post can belong to
export type PostCategory =
  | "football"
  | "basketball"
  | "tennis"
  | "general"
  | "prediction"
  | "match_reports";

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
  // --- MODIFIED: `sport` is now an array of PostCategory ---
  sport: PostCategory[];
  isAIGenerated?: boolean;
  originalExternalArticleId?: mongoose.Types.ObjectId;
  originalFixtureId?: number;
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
    // --- MODIFIED: Schema definition for `sport` field ---
    sport: {
      type: [
        {
          type: String,
          enum: [
            "football",
            "basketball",
            "tennis",
            "general",
            "prediction",
            "match_reports",
          ],
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
  },
  {
    timestamps: true,
  }
);

export default (mongoose.models.Post as mongoose.Model<IPost>) ||
  mongoose.model<IPost>("Post", PostSchema);
