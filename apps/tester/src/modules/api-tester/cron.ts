import { CronJob } from "cron";
import { ApiTestRequest } from "@full-tester/db/models/api-test-request.model";
import { NetworkRequestBucket } from "@full-tester/db/models/network-request-bucket.model";
import { ApiTestResultBucket } from "@full-tester/db/models/api-test-result.model";
import { runChecks } from "./run-checks.js";
import type { CapturedRequest } from "../../types/index.js";
import type { CheckResult } from "./types.js";

const RESULT_BUCKET_SIZE = 500;

let isProcessing = false;

async function processNextRequest() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const request = await ApiTestRequest.findOneAndUpdate(
      { status: "pending" },
      { $set: { status: "running", startedAt: new Date() } },
      { sort: { createdAt: 1 }, new: true },
    );

    if (!request) return;

    const buckets = await NetworkRequestBucket.find({
      apiTestRequestId: request._id,
    });

    const capturedRequests = buckets.flatMap(
      (b) => (b.requests as CapturedRequest[]) ?? [],
    );

    if (capturedRequests.length === 0) {
      await ApiTestRequest.updateOne(
        { _id: request._id },
        { $set: { status: "failed", error: "No network requests found", completedAt: new Date() } },
      );
      return;
    }

    const result = await runChecks(
      capturedRequests,
      { domains: [request.domain] },
      request.type as "basic" | "full",
    );

    await saveResultBuckets(request._id as string, result.results);

    await ApiTestRequest.updateOne(
      { _id: request._id },
      {
        $set: {
          status: "completed",
          summary: result.summary,
          completedAt: new Date(),
        },
      },
    );

    console.log(`Completed test request ${request._id} (${request.type}) for ${request.domain}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Cron processing error:", message);
  } finally {
    isProcessing = false;
  }
}

async function saveResultBuckets(apiTestRequestId: string, results: CheckResult[]) {
  for (let i = 0; i < results.length; i += RESULT_BUCKET_SIZE) {
    const chunk = results.slice(i, i + RESULT_BUCKET_SIZE);
    await ApiTestResultBucket.create({
      _id: crypto.randomUUID(),
      apiTestRequestId,
      results: chunk,
    });
  }
}

async function recoverStaleRequests() {
  const thirtyFiveMinutesAgo = new Date(Date.now() - 35 * 60 * 1000);

  const result = await ApiTestRequest.updateMany(
    { status: "running", startedAt: { $lt: thirtyFiveMinutesAgo } },
    { $set: { status: "failed", error: "Timed out — stuck in running state", completedAt: new Date() } },
  );

  if (result.modifiedCount > 0) {
    console.log(`Recovered ${result.modifiedCount} stale test request(s)`);
  }
}

export function startApiTesterCron() {
  const processingJob = new CronJob("* * * * *", processNextRequest);
  processingJob.start();
  console.log("API tester cron started (every 1 minute)");

  const recoveryJob = new CronJob("*/10 * * * *", recoverStaleRequests);
  recoveryJob.start();
  console.log("Stale recovery cron started (every 10 minutes)");
}
