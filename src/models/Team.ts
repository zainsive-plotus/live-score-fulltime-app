// ===== src/models/Team.ts =====

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeam extends Document {
  teamId: number;
  name: string;
  code: string | null;
  country: string;
  founded: number | null;
  national: boolean;
  logoUrl: string;
  venueId: number | null;
  venueName: string | null;
  venueAddress: string | null;
  venueCity: string | null;
  venueCapacity: number | null;
  venueSurface: string | null;
  venueImageUrl: string | null;
}

const TeamSchema: Schema<ITeam> = new Schema(
  {
    teamId: {
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
    code: {
      type: String,
    },
    country: {
      type: String,
      required: true,
    },
    founded: {
      type: Number,
    },
    national: {
      type: Boolean,
      default: false,
    },
    logoUrl: {
      type: String,
      required: true,
    },
    venueId: {
      type: Number,
    },
    venueName: {
      type: String,
    },
    venueAddress: {
      type: String,
    },
    venueCity: {
      type: String,
    },
    venueCapacity: {
      type: Number,
    },
    venueSurface: {
      type: String,
    },
    venueImageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);

export default Team;
