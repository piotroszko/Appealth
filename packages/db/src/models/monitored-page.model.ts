import mongoose from "mongoose";

const { Schema, model } = mongoose;

const monitoredPageSchema = new Schema(
  {
    _id: { type: String },
    userId: { type: String, ref: "User", required: true },
    url: { type: String, required: true },
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    checkIntervalMs: { type: Number, default: 60000 },
    varianceMs: { type: Number, default: 5000 },
    timeoutMs: { type: Number, default: 30000 },
    status: {
      type: String,
      enum: ["idle", "checking"],
      default: "idle",
    },
    lastCheckedAt: { type: Date, default: null },
    nextCheckAt: { type: Date, required: true },
    checkingStartedAt: { type: Date, default: null },
    lastStatusCode: { type: Number, default: null },
    lastResponseTimeMs: { type: Number, default: null },
    lastError: { type: String, default: null },
    consecutiveFailures: { type: Number, default: 0 },
  },
  { collection: "monitored_page", timestamps: true },
);

monitoredPageSchema.index({ enabled: 1, status: 1, nextCheckAt: 1 });
monitoredPageSchema.index({ userId: 1 });
monitoredPageSchema.index({ status: 1, checkingStartedAt: 1 });

const MonitoredPage = model("MonitoredPage", monitoredPageSchema);

export { MonitoredPage };
