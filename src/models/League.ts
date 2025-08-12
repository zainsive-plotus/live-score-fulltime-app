// ===== src/models/League.ts =====

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILeague extends Document {
  leagueId: number;
  name: string;
  type: string;
  logoUrl: string;
  countryName: string;
  countryCode: string | null;
  countryFlagUrl: string | null;
  seasons: {
    year: number;
    start: string;
    end: string;
    current: boolean;
  }[];
}

const SeasonSchema: Schema = new Schema(
  {
    year: { type: Number, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    current: { type: Boolean, required: true },
  },
  { _id: false }
);

const LeagueSchema: Schema<ILeague> = new Schema(
  {
    leagueId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["League", "Cup"],
    },
    logoUrl: {
      type: String,
      required: true,
    },
    countryName: {
      type: String,
      required: true,
    },
    countryCode: {
      type: String,
    },
    countryFlagUrl: {
      type: String,
    },
    seasons: [SeasonSchema],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const League: Model<ILeague> =
  mongoose.models.League || mongoose.model<ILeague>("League", LeagueSchema);

export default League;
