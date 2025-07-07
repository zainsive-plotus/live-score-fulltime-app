// src/models/AIPrompt.ts
import mongoose, { Schema, Document } from "mongoose";

// Define the types of AI prompts
export type AIPromptType = "title" | "content" | "prediction_content"; // <-- Added 'prediction_content'

export interface IAIPrompt extends Document {
  name: string;
  type: AIPromptType; // <-- NEW: Type field
  prompt: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AIPromptSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["title", "content", "prediction_content"],
      required: true,
    }, // <-- NEW: Type field definition
    prompt: { type: String, required: true },
    description: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Add a unique compound index on 'name' and 'type' to ensure uniqueness for each prompt type
AIPromptSchema.index({ name: 1, type: 1 }, { unique: true });

export default (mongoose.models.AIPrompt as mongoose.Model<IAIPrompt>) ||
  mongoose.model<IAIPrompt>("AIPrompt", AIPromptSchema);
