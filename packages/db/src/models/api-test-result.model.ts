import mongoose from "mongoose";

const { Schema, model } = mongoose;

const checkResultSchema = new Schema(
  {
    checkName: { type: String, required: true },
    request: {
      url: { type: String, required: true },
      method: { type: String, required: true },
    },
    severity: { type: String, enum: ["error", "warning"], required: true },
    message: { type: String, required: true },
    details: { type: String },
  },
  { _id: false },
);

const apiTestResultBucketSchema = new Schema(
  {
    _id: { type: String },
    apiTestRequestId: {
      type: String,
      ref: "ApiTestRequest",
      required: true,
    },
    results: [checkResultSchema],
  },
  { collection: "api_test_result_bucket", timestamps: { updatedAt: false } },
);

apiTestResultBucketSchema.index({ apiTestRequestId: 1 });

const ApiTestResultBucket = model("ApiTestResultBucket", apiTestResultBucketSchema);

export { ApiTestResultBucket };
