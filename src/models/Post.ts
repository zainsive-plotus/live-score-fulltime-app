// src/models/Post.ts

import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  slug: string;
  author: string;
  status: 'draft' | 'published';
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  // --- NEW FIELDS ---
  featuredImageTitle?: string;
  featuredImageAltText?: string;
  sport: string;
}

const PostSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    slug: { type: String, required: true, unique: true, trim: true },
    author: { type: String, default: 'Admin' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    featuredImage: { type: String },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    sport: { type: String, default: 'general', required: true },
    featuredImageTitle: { type: String, trim: true },
    featuredImageAltText: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

const Post: Model<IPost> = models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;