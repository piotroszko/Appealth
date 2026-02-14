import mongoose from "mongoose";

const { Schema, model } = mongoose;

const apiTestRequestSchema = new Schema(
  {
    _id: { type: String },
    userId: { type: String, ref: "User", required: true },
    domain: { type: String, required: true },
    type: { type: String, enum: ["basic", "full"], required: true },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
    },
    error: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { collection: "api_test_request", timestamps: true },
);

apiTestRequestSchema.index({ status: 1, createdAt: 1 });

const ApiTestRequest = model("ApiTestRequest", apiTestRequestSchema);

export { ApiTestRequest };
