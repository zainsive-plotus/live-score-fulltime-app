// src/models/AIJournalist.ts
import mongoose, { Schema, Document } from "mongoose";

// Interface for an AI Journalist profile
export interface IAIJournalist extends Document {
  name: string; // e.g., "Bold Reporter", "Analytical Guru"
  description?: string; // Short description for the admin UI
  tonePrompt: string; // The specific prompt segment defining the tone/style of this journalist
  isActive: boolean; // Whether this journalist profile can be used
  createdAt: Date;
  updatedAt: Date;
}

const AIJournalistSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    // This is the core prompt segment that defines the journalist's style/tone.
    // It will be injected into the main article generation prompt.
    tonePrompt: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Ensure the model is only compiled once
const AIJournalist =
  mongoose.models.AIJournalist ||
  mongoose.model<IAIJournalist>("AIJournalist", AIJournalistSchema);

export default AIJournalist;
