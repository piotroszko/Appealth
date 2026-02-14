import mongoose from "mongoose";

const { Schema, model } = mongoose;

const monitorResultSchema = new Schema(
  {
    checkedAt: { type: Date, required: true },
    statusCode: { type: Number, default: null },
    responseTimeMs: { type: Number, required: true },
    error: { type: String, default: null },
  },
  { _id: false },
);

const monitorResultBucketSchema = new Schema(
  {
    _id: { type: String },
    monitoredPageId: {
      type: String,
      ref: "MonitoredPage",
      required: true,
    },
    results: [monitorResultSchema],
    count: { type: Number, default: 0 },
  },
  { collection: "monitor_result_bucket", timestamps: { updatedAt: false } },
);

monitorResultBucketSchema.index({ monitoredPageId: 1, createdAt: -1 });

const MonitorResultBucket = model("MonitorResultBucket", monitorResultBucketSchema);

export { MonitorResultBucket };
