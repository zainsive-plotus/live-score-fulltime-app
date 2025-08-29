import mongoose, { Schema, Document, Model } from "mongoose";

// Interface for a single variable mapping
interface IVariableMapping {
  variable: string; // e.g., 'leagueName'
  path: string; // e.g., 'league.name' or a JS expression
}

export interface ISeoTemplate extends Document {
  pageType: string;
  language: string;
  template: string; // Will store the master HTML template
  variableMappings: IVariableMapping[]; // Stores the custom variable mappings
  createdAt: Date;
  updatedAt: Date;
}

const VariableMappingSchema: Schema<IVariableMapping> = new Schema(
  {
    variable: { type: String, required: true },
    path: { type: String, required: true },
  },
  { _id: false }
);

const SeoTemplateSchema: Schema<ISeoTemplate> = new Schema(
  {
    pageType: { type: String, required: true, index: true },
    language: { type: String, required: true, index: true },
    template: { type: String, required: true },
    variableMappings: [VariableMappingSchema],
  },
  {
    timestamps: true,
  }
);

// Ensure a unique template for each page type and language
SeoTemplateSchema.index({ pageType: 1, language: 1 }, { unique: true });

const SeoTemplate: Model<ISeoTemplate> =
  mongoose.models.SeoTemplate ||
  mongoose.model<ISeoTemplate>("SeoTemplate", SeoTemplateSchema);

export default SeoTemplate;
