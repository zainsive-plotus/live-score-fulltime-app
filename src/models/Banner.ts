// src/models/Banner.ts

import mongoose, { Document, Schema, Model } from "mongoose";

export interface IBanner extends Document {
  title: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  location: string; // This field MUST be here
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema: Schema<IBanner> = new Schema(
  {
    title: {
      type: String,
      required: [true, "Banner title is required."],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required."],
    },
    linkUrl: {
      type: String,
      required: [true, "Link URL is required."],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // This definition MUST be here
    location: {
      type: String,
      required: [true, "A location must be specified for the banner."],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// This logic prevents Mongoose from redefining the model on every hot reload
const Banner: Model<IBanner> =
  mongoose.models.Banner || mongoose.model<IBanner>("Banner", BannerSchema);

export default Banner;
