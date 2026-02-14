import mongoose from "mongoose";

const { Schema, model } = mongoose;

const coverageInitialLoadTestRequestSchema = new Schema(
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
      waitUntil: {
        type: String,
        enum: ["load", "domcontentloaded", "networkidle"],
        default: "load",
      },
      timeoutMs: { type: Number, default: 30000 },
      includeThirdParty: { type: Boolean, default: true },
    },
    summary: {
      totalJsFiles: { type: Number },
      totalCssFiles: { type: Number },
      totalJsBytes: { type: Number },
      usedJsBytes: { type: Number },
      unusedJsBytes: { type: Number },
      jsUsagePercent: { type: Number },
      totalCssBytes: { type: Number },
      usedCssBytes: { type: Number },
      unusedCssBytes: { type: Number },
      cssUsagePercent: { type: Number },
      overallUsagePercent: { type: Number },
      durationMs: { type: Number },
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { collection: "coverage_initial_load_test_request", timestamps: true },
);

coverageInitialLoadTestRequestSchema.index({ status: 1, createdAt: 1 });

const CoverageInitialLoadTestRequest = model(
  "CoverageInitialLoadTestRequest",
  coverageInitialLoadTestRequestSchema,
);

export { CoverageInitialLoadTestRequest };
