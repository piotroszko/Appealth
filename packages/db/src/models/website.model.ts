import mongoose from "mongoose";

const { Schema, model } = mongoose;

const websiteSchema = new Schema(
  {
    _id: { type: String },
    userId: { type: String, ref: "User", required: true },
    url: { type: String, required: true },
    name: { type: String, required: true },
  },
  { collection: "website", timestamps: true },
);

websiteSchema.index({ userId: 1 });

const Website = model("Website", websiteSchema);

export { Website };
