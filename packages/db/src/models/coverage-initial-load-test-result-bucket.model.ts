import mongoose from "mongoose";

const { Schema, model } = mongoose;

const coverageResultSchema = new Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ["js", "css"], required: true },
    totalBytes: { type: Number, required: true },
    usedBytes: { type: Number, required: true },
    unusedBytes: { type: Number, required: true },
    usagePercent: { type: Number, required: true },
    isThirdParty: { type: Boolean, required: true },
  },
  { _id: false },
);

const coverageInitialLoadTestResultBucketSchema = new Schema(
  {
    _id: { type: String },
    coverageInitialLoadTestRequestId: {
      type: String,
      ref: "CoverageInitialLoadTestRequest",
      required: true,
    },
    results: [coverageResultSchema],
  },
  { collection: "coverage_initial_load_test_result_bucket", timestamps: { updatedAt: false } },
);

coverageInitialLoadTestResultBucketSchema.index({ coverageInitialLoadTestRequestId: 1 });

const CoverageInitialLoadTestResultBucket = model(
  "CoverageInitialLoadTestResultBucket",
  coverageInitialLoadTestResultBucketSchema,
);

export { CoverageInitialLoadTestResultBucket };
