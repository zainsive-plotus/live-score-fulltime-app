// ===== src/models/TitleTemplate.ts =====

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITitleTemplate extends Document {
  name: string;
  description?: string;
  template: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TitleTemplateSchema: Schema<ITitleTemplate> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required."],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    template: {
      type: String,
      required: [true, "Template content is required."],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const TitleTemplate: Model<ITitleTemplate> =
  mongoose.models.TitleTemplate ||
  mongoose.model<ITitleTemplate>("TitleTemplate", TitleTemplateSchema);

export default TitleTemplate;
