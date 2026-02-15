import mongoose from "mongoose";

const { Schema, model } = mongoose;

const domainSchema = new Schema(
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

const Domain = model("Domain", domainSchema);

export { Domain };
