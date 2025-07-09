// src/models/Faq.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFaq extends Document {
  question: string;
  answer: string;
  // --- NEW FIELD ---
  category: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FaqSchema: Schema<IFaq> = new Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required."],
      trim: true,
      unique: true,
    },
    answer: {
      type: String,
      required: [true, "Answer is required."],
    },
    // --- NEW FIELD DEFINITION ---
    category: {
      type: String,
      required: [true, "Category is required."],
      trim: true,
      index: true, // Add index for faster grouping/querying
      default: "General Questions",
    },
    order: {
      type: Number,
      default: 0,
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

const Faq: Model<IFaq> =
  mongoose.models.Faq || mongoose.model<IFaq>("Faq", FaqSchema);

export default Faq;
