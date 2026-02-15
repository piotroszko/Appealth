import mongoose from "mongoose";

const { Schema, model } = mongoose;

export interface IDomain {
  _id: string;
  userId: string;
  name: string;
  domain: string;
  websites: string[];
  allowedExternalDomains: string[];
  createdAt: Date;
  updatedAt: Date;
}

const domainSchema = new Schema<IDomain>(
  {
    _id: { type: String },
    userId: { type: String, ref: "User", required: true },
    name: { type: String, required: true },
    domain: { type: String, required: true },
    websites: { type: [String], default: [] },
    allowedExternalDomains: { type: [String], default: [] },
  },
  { collection: "domain", timestamps: true },
);

domainSchema.index({ userId: 1 });

const Domain = (mongoose.models.Domain as mongoose.Model<IDomain>) || model<IDomain>("Domain", domainSchema);

export { Domain };
