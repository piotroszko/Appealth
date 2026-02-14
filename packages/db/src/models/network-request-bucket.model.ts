import mongoose from "mongoose";

const { Schema, model } = mongoose;

const networkRequestBucketSchema = new Schema(
  {
    _id: { type: String },
    apiTestRequestId: { type: String, ref: "ApiTestRequest", required: true },
    requests: { type: Schema.Types.Mixed },
  },
  { collection: "network_request_bucket", timestamps: { updatedAt: false } },
);

networkRequestBucketSchema.index({ apiTestRequestId: 1 });

const NetworkRequestBucket = model(
  "NetworkRequestBucket",
  networkRequestBucketSchema,
);

export { NetworkRequestBucket };
