import { CronJob } from "cron";
import { BrokenLinksTestRequest } from "@full-tester/db/models/broken-links-test-request.model";
import { NetworkRequestBucket } from "@full-tester/db/models/network-request-bucket.model";
import { BrokenLinkResultBucket } from "@full-tester/db/models/broken-link-result-bucket.model";
import { checkLinks } from "./check-links.js";
import type { CapturedRequest } from "../../types/index.js";
import type { BrokenLinkResult, BrokenLinksOptions } from "./types.js";

const RESULT_BUCKET_SIZE = 500;

let isProcessing = false;

async function processNextRequest() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const request = await BrokenLinksTestRequest.findOneAndUpdate(
      { status: "pending" },
      { $set: { status: "running", startedAt: new Date() } },
      { sort: { createdAt: 1 }, new: true },
    );

    if (!request) return;

    const buckets = await NetworkRequestBucket.find({
      brokenLinksTestRequestId: request._id,
    });

    const capturedRequests = buckets.flatMap((b) => (b.requests as CapturedRequest[]) ?? []);

    if (capturedRequests.length === 0) {
      await BrokenLinksTestRequest.updateOne(
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

    const options: BrokenLinksOptions = {
      averageFrom: (request.options?.averageFrom as number) ?? 1,
      allowedDomains: (request.options?.allowedDomains as string[]) ?? [],
      averageFromForNotAllowed: (request.options?.averageFromForNotAllowed as number) ?? 1,
    };

    const result = await checkLinks(capturedRequests, options);

    await saveResultBuckets(request._id as string, result.results);

    await BrokenLinksTestRequest.updateOne(
      { _id: request._id },
      {
        $set: {
          status: "completed",
          summary: result.summary,
          completedAt: new Date(),
        },
      },
    );

    console.log(`Completed broken links test ${request._id} for ${request.domain}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Broken links cron processing error:", message);
  } finally {
    isProcessing = false;
  }
}

async function saveResultBuckets(brokenLinksTestRequestId: string, results: BrokenLinkResult[]) {
  for (let i = 0; i < results.length; i += RESULT_BUCKET_SIZE) {
    const chunk = results.slice(i, i + RESULT_BUCKET_SIZE);
    await BrokenLinkResultBucket.create({
      _id: crypto.randomUUID(),
      brokenLinksTestRequestId,
      results: chunk,
    });
  }
}

async function recoverStaleRequests() {
  const thirtyFiveMinutesAgo = new Date(Date.now() - 35 * 60 * 1000);

  const result = await BrokenLinksTestRequest.updateMany(
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
    console.log(`Recovered ${result.modifiedCount} stale broken links request(s)`);
  }
}

export function startBrokenLinksCron() {
  const processingJob = new CronJob("* * * * *", processNextRequest);
  processingJob.start();
  console.log("Broken links cron started (every 1 minute)");

  const recoveryJob = new CronJob("*/10 * * * *", recoverStaleRequests);
  recoveryJob.start();
  console.log("Broken links stale recovery cron started (every 10 minutes)");
}
