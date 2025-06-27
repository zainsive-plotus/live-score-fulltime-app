import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Interface for our Vote document
export interface IVote extends Document {
  fixtureId: number;
  homeVotes: number;
  drawVotes: number;
  awayVotes: number;
}

const VoteSchema: Schema = new Schema(
  {
    fixtureId: { 
        type: Number, 
        required: true, 
        unique: true, // Ensures one document per match
        index: true   // Speeds up finding votes for a fixture
    },
    homeVotes: { type: Number, default: 0 },
    drawVotes: { type: Number, default: 0 },
    awayVotes: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite in Next.js hot-reloading environment
const Vote: Model<IVote> = models.Vote || mongoose.model<IVote>('Vote', VoteSchema);

export default Vote;