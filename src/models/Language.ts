import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILanguage extends Document {
  name: string;
  code: string;
  isActive: boolean;
  isDefault: boolean;
  flagUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LanguageSchema: Schema<ILanguage> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Language name is required."],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Language code (e.g., 'en') is required."],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    flagUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to ensure only one language can be the default
LanguageSchema.pre("save", async function (next) {
  if (this.isModified("isDefault") && this.isDefault) {
    // `this.constructor` refers to the model
    await (this.constructor as Model<ILanguage>).updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

const Language: Model<ILanguage> =
  mongoose.models.Language ||
  mongoose.model<ILanguage>("Language", LanguageSchema);

export default Language;
