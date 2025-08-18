// ===== src/models/Prediction.ts =====

import mongoose, { Schema, Document, Model } from "mongoose";

interface ITeamInfo {
  id: number;
  name: string;
  logo: string;
}

interface ILeagueInfo {
  id: number;
  name: string;
  logo: string;
}

export interface IPrediction extends Document {
  fixtureId: number;
  fixtureDate: Date;
  status: string;
  teams: {
    home: ITeamInfo;
    away: ITeamInfo;
  };
  league: ILeagueInfo;
  prediction: {
    home: number;
    draw: number;
    away: number;
  };
  h2h?: any[];
  form?: {
    home: string | null;
    away: string | null;
  };
}

const TeamInfoSchema = new Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    logo: { type: String, required: true },
  },
  { _id: false }
);

const LeagueInfoSchema = new Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    logo: { type: String, required: true },
  },
  { _id: false }
);

const PredictionSchema: Schema<IPrediction> = new Schema(
  {
    fixtureId: { type: Number, required: true, unique: true, index: true },
    fixtureDate: { type: Date, required: true, index: true },
    status: { type: String, required: true },
    teams: {
      home: { type: TeamInfoSchema, required: true },
      away: { type: TeamInfoSchema, required: true },
    },
    league: { type: LeagueInfoSchema, required: true },
    prediction: {
      home: { type: Number, required: true },
      draw: { type: Number, required: true },
      away: { type: Number, required: true },
    },
    h2h: { type: Array, default: [] },
    form: {
      home: { type: String },
      away: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

const Prediction: Model<IPrediction> =
  mongoose.models.Prediction ||
  mongoose.model<IPrediction>("Prediction", PredictionSchema);

export default Prediction;
