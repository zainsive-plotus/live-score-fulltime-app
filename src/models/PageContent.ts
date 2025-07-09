// src/models/PageContent.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPageContent extends Document {
  pageSlug: string; // e.g., "report-abuse", "privacy-policy"
  title: string;
  content: string; // Will store HTML from the rich text editor
  createdAt: Date;
  updatedAt: Date;
}

const PageContentSchema: Schema<IPageContent> = new Schema(
  {
    pageSlug: {
      type: String,
      required: true,
      unique: true, // Each page can only have one entry
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const PageContent: Model<IPageContent> =
  mongoose.models.PageContent ||
  mongoose.model<IPageContent>("PageContent", PageContentSchema);

export default PageContent;
