// ===== src/models/Redirect.ts =====

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRedirect extends Document {
  sourcePaths: string[];
  destinationUrl: string;
  statusCode: 301 | 302;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RedirectSchema: Schema<IRedirect> = new Schema(
  {
    sourcePaths: {
      type: [{ type: String, trim: true, lowercase: true }],
      required: true,
      validate: [
        (val: string[]) => val.length > 0,
        "At least one source path is required.",
      ],
    },
    destinationUrl: {
      type: String,
      required: true,
      trim: true,
    },
    statusCode: {
      type: Number,
      enum: [301, 302],
      default: 301,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// This index ensures that no two redirect rules can share the same source path,
// preventing conflicts and ensuring data integrity.
RedirectSchema.index({ sourcePaths: 1 }, { unique: true });

const Redirect: Model<IRedirect> =
  mongoose.models.Redirect ||
  mongoose.model<IRedirect>("Redirect", RedirectSchema);

export default Redirect;
