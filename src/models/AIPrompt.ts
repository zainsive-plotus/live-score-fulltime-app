// src/models/AIPrompt.ts
import mongoose, { Schema, Document } from "mongoose";

// Interface for the AI Prompt document
export interface IAIPrompt extends Document {
  name: string; // e.g., "News Article Rewriting Prompt"
  prompt: string; // The actual prompt string
  description?: string; // Optional description for the admin
  // --- NEW FIELD: prompt type ---
  type: "title" | "content" | "general"; // Classify the type of prompt
  createdAt: Date;
  updatedAt: Date;
}

const AIPromptSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true }, // Ensure uniqueness for the name
    prompt: { type: String, required: true },
    description: { type: String },
    // --- NEW FIELD ---
    type: {
      type: String,
      enum: ["title", "content", "general"],
      required: true,
      default: "general",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Add a compound unique index to ensure 'name' is unique per 'type' if desired,
// or just keep 'name' unique globally as it is now.
// For now, let's assume 'name' is globally unique (e.g., "Main Content Prompt", "SEO Title Prompt").

// Ensure the model is only compiled once
const AIPrompt =
  mongoose.models.AIPrompt ||
  mongoose.model<IAIPrompt>("AIPrompt", AIPromptSchema);

export default AIPrompt;
