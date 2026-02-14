import { CronJob } from "cron";
import { CoverageInitialLoadTestRequest } from "@full-tester/db/models/coverage-initial-load-test-request.model";
import { CoverageInitialLoadTestResultBucket } from "@full-tester/db/models/coverage-initial-load-test-result-bucket.model";
import { NetworkRequestBucket } from "@full-tester/db/models/network-request-bucket.model";
import { collectCoverage } from "./collect-coverage.js";
import type { CapturedRequest } from "../../types/index.js";
import type { CoverageOptions, FileCoverageResult } from "./types.js";

const RESULT_BUCKET_SIZE = 500;

let isProcessing = false;

async function processNextRequest() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const request = await CoverageInitialLoadTestRequest.findOneAndUpdate(
      { status: "pending" },
      { $set: { status: "running", startedAt: new Date() } },
      { sort: { createdAt: 1 }, new: true },
    );

    if (!request) return;

    const buckets = await NetworkRequestBucket.find({
      coverageInitialLoadTestRequestId: request._id,
    });

    const capturedRequests = buckets.flatMap((b) => (b.requests as CapturedRequest[]) ?? []);

    if (capturedRequests.length === 0) {
      await CoverageInitialLoadTestRequest.updateOne(
        { _id: request._id },
        {
          $set: {
            status: "failed",
            error: "No network requests found",
            completedAt: new Date(),
          },
        },
      );
      return;
    }

    const urls = [...new Set(capturedRequests.map((r) => r.url))];

    const options: CoverageOptions = {
      waitUntil: (request.options?.waitUntil as CoverageOptions["waitUntil"]) ?? "load",
      timeoutMs: (request.options?.timeoutMs as number) ?? 30000,
      includeThirdParty: (request.options?.includeThirdParty as boolean) ?? true,
    };

    const result = await collectCoverage(urls, request.domain as string, options);

    await saveResultBuckets(request._id as string, result.results);

    await CoverageInitialLoadTestRequest.updateOne(
      { _id: request._id },
      {
        $set: {
          status: "completed",
          summary: result.summary,
          completedAt: new Date(),
        },
      },
    );

    console.log(`Completed initial load coverage test ${request._id} for ${request.domain}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Initial load coverage cron processing error:", message);
  } finally {
    isProcessing = false;
  }
}

async function saveResultBuckets(
  coverageInitialLoadTestRequestId: string,
  results: FileCoverageResult[],
) {
  for (let i = 0; i < results.length; i += RESULT_BUCKET_SIZE) {
    const chunk = results.slice(i, i + RESULT_BUCKET_SIZE);
    await CoverageInitialLoadTestResultBucket.create({
      _id: crypto.randomUUID(),
      coverageInitialLoadTestRequestId,
      results: chunk,
    });
  }
}

async function recoverStaleRequests() {
  const thirtyFiveMinutesAgo = new Date(Date.now() - 35 * 60 * 1000);

  const result = await CoverageInitialLoadTestRequest.updateMany(
    { status: "running", startedAt: { $lt: thirtyFiveMinutesAgo } },
    {
      $set: {
        status: "failed",
        error: "Timed out — stuck in running state",
        completedAt: new Date(),
      },
    },
  );

  if (result.modifiedCount > 0) {
    console.log(`Recovered ${result.modifiedCount} stale initial load coverage request(s)`);
  }
}

export function startCoverageCron() {
  const processingJob = new CronJob("* * * * *", processNextRequest);
  processingJob.start();
  console.log("Initial load coverage cron started (every 1 minute)");

  const recoveryJob = new CronJob("*/10 * * * *", recoverStaleRequests);
  recoveryJob.start();
  console.log("Initial load coverage stale recovery cron started (every 10 minutes)");
}
