// src/models/Post.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  title: string;
  slug: string; // URL friendly identifier
  content: string; // Can be HTML or Markdown depending on editor config
  author: string;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
  featuredImage?: string; // URL for the featured image
  metaTitle?: string; // For SEO
  metaDescription?: string; // For SEO
  featuredImageTitle?: string; // Image title for accessibility/SEO
  featuredImageAltText?: string; // Image alt text for accessibility/SEO
  sport: "football" | "basketball" | "tennis" | "general"; // Category for news
  // --- NEW FIELDS FOR AI GENERATION ---
  isAIGenerated: boolean;
  originalExternalArticleId?: mongoose.Types.ObjectId; // Link back to the source external article
}

const PostSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    author: { type: String, required: true, default: "Admin" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    featuredImage: { type: String },
    metaTitle: { type: String },
    metaDescription: { type: String },
    featuredImageTitle: { type: String },
    featuredImageAltText: { type: String },
    sport: {
      type: String,
      enum: ["football", "basketball", "tennis", "general"],
      default: "general",
    },
    // --- NEW FIELDS ---
    isAIGenerated: { type: Boolean, default: false },
    originalExternalArticleId: {
      type: Schema.Types.ObjectId,
      ref: "ExternalNewsArticle",
    }, // <-- THIS LINE MUST BE PRESENT
  },
  {
    timestamps: true,
  }
);

// Ensure the model is only compiled once
const Post = mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);

export default Post;
