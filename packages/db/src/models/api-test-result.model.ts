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

const apiTestResultSchema = new Schema(
  {
    _id: { type: String },
    apiTestRequestId: {
      type: String,
      ref: "ApiTestRequest",
      required: true,
      unique: true,
    },
    results: [checkResultSchema],
    summary: {
      total: { type: Number, required: true },
      errors: { type: Number, required: true },
      warnings: { type: Number, required: true },
      durationMs: { type: Number, required: true },
    },
  },
  { collection: "api_test_result", timestamps: { updatedAt: false } },
);

apiTestResultSchema.index({ apiTestRequestId: 1 }, { unique: true });

const ApiTestResult = model("ApiTestResult", apiTestResultSchema);

export { ApiTestResult };
