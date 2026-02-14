import mongoose from "mongoose";

const { Schema, model } = mongoose;

const brokenLinksTestRequestSchema = new Schema(
  {
    _id: { type: String },
    userId: { type: String, ref: "User", required: true },
    domain: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
    },
    error: { type: String },
    options: {
      averageFrom: { type: Number, default: 1 },
      allowedDomains: [{ type: String }],
      averageFromForNotAllowed: { type: Number, default: 1 },
    },
    summary: {
      totalUrls: { type: Number },
      brokenCount: { type: Number },
      healthyCount: { type: Number },
      skippedCount: { type: Number },
      durationMs: { type: Number },
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { collection: "broken_links_test_request", timestamps: true },
);

brokenLinksTestRequestSchema.index({ status: 1, createdAt: 1 });

const BrokenLinksTestRequest = model("BrokenLinksTestRequest", brokenLinksTestRequestSchema);

export { BrokenLinksTestRequest };
