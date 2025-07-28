// ===== src/models/TickerMessage.ts =====

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITickerMessage extends Document {
  message: string;
  language: string;
  translationGroupId: mongoose.Types.ObjectId;
  isActive: boolean;
  order: number;
  href?: string; // This property is added dynamically for news fallbacks
  createdAt: Date;
  updatedAt: Date;
}

const TickerMessageSchema: Schema<ITickerMessage> = new Schema(
  {
    message: {
      type: String,
      required: [true, "Message content is required."],
      trim: true,
    },
    language: {
      type: String,
      required: [true, "Language is required."],
      index: true,
    },
    translationGroupId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Note: `href` is not part of the Mongoose schema because it's only added
// dynamically by the API when using news as a fallback. The interface
// definition above makes it available in a type-safe way on the client.

const TickerMessage: Model<ITickerMessage> =
  mongoose.models.TickerMessage ||
  mongoose.model<ITickerMessage>("TickerMessage", TickerMessageSchema);

export default TickerMessage;