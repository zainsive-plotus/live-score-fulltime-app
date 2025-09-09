// ===== src/models/Post.ts =====

import mongoose, { Schema, Document, Model } from "mongoose";

export type SportsCategory = "football" | "basketball" | "tennis" | "general";
export type NewsType =
  | "news"
  | "highlights"
  | "reviews"
  | "prediction"
  | "transfer"
  | "recent";

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
  focusKeyword?: string; // ADDED: The new field for the focus keyword
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

export interface IPostWithTranslations extends IPost {
  getTranslations: () => Promise<Pick<IPost, "slug" | "language">[]>;
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
    // ADDED: The schema definition for the new field
    focusKeyword: {
      type: String,
      trim: true,
    },
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
    newsType: {
      type: String,
      enum: [
        "news",
        "highlights",
        "reviews",
        "prediction",
        "transfer",
        "recent",
      ],
      default: "news",
      required: true,
    },

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

PostSchema.methods.getTranslations = async function () {
  if (!this.translationGroupId) return [];
  return mongoose.models.Post.find({
    translationGroupId: this.translationGroupId,
    status: "published",
  })
    .select("slug language")
    .lean();
};

export default (mongoose.models.Post as Model<IPostWithTranslations>) ||
  mongoose.model<IPostWithTranslations>("Post", PostSchema);
