// ===== src/models/Translation.ts =====

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITranslation extends Document {
  key: string;
  group: string;
  description?: string;
  translations: Map<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const TranslationSchema: Schema<ITranslation> = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      // Prevents using spaces or special characters in keys
      match: /^[a-z0-9_]+$/,
    },
    group: {
      type: String,
      required: true,
      trim: true,
      index: true,
      default: "general",
    },
    description: {
      type: String,
      trim: true,
    },
    translations: {
      type: Map,
      of: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Translation: Model<ITranslation> =
  mongoose.models.Translation ||
  mongoose.model<ITranslation>("Translation", TranslationSchema);

export default Translation;
