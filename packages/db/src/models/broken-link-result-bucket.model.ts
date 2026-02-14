import mongoose from "mongoose";

const { Schema, model } = mongoose;

const brokenLinkResultSchema = new Schema(
  {
    url: { type: String, required: true },
    sourcePageUrls: [{ type: String }],
    status: {
      type: String,
      enum: ["healthy", "broken", "skipped"],
      required: true,
    },
    brokenReason: { type: String },
    httpStatusCode: { type: Number },
    redirectChain: [{ type: String }],
    metrics: {
      dnsLookupMs: { type: Number },
      tcpConnectionMs: { type: Number },
      tlsHandshakeMs: { type: Number },
      ttfbMs: { type: Number },
      contentDownloadMs: { type: Number },
      totalTimeMs: { type: Number },
      contentLengthBytes: { type: Number },
    },
    fetchCount: { type: Number },
  },
  { _id: false },
);

const brokenLinkResultBucketSchema = new Schema(
  {
    _id: { type: String },
    brokenLinksTestRequestId: {
      type: String,
      ref: "BrokenLinksTestRequest",
      required: true,
    },
    results: [brokenLinkResultSchema],
  },
  { collection: "broken_link_result_bucket", timestamps: { updatedAt: false } },
);

brokenLinkResultBucketSchema.index({ brokenLinksTestRequestId: 1 });

const BrokenLinkResultBucket = model(
  "BrokenLinkResultBucket",
  brokenLinkResultBucketSchema,
);

export { BrokenLinkResultBucket };
