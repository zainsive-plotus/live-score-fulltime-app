// src/models/CasinoPartner.ts
import mongoose, { Schema, Document } from "mongoose";

// Interface for a Casino Partner
export interface ICasinoPartner extends Document {
  name: string; // Name of the casino/partner
  logoUrl: string; // URL to the partner's logo
  redirectUrl: string; // URL where users will be redirected (affiliate link)
  description?: string; // Short description for internal use or tooltip
  isFeatured: boolean; // If true, apply prominent styling on the frontend
  isActive: boolean; // Whether this partner is currently displayed
  order: number; // For manual sorting, lower number appears first
  createdAt: Date;
  updatedAt: Date;
}

const CasinoPartnerSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    logoUrl: { type: String, required: true, trim: true },
    redirectUrl: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }, // Default order, 0 means no specific order preference
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Ensure the model is only compiled once
const CasinoPartner =
  mongoose.models.CasinoPartner ||
  mongoose.model<ICasinoPartner>("CasinoPartner", CasinoPartnerSchema);

export default CasinoPartner;
