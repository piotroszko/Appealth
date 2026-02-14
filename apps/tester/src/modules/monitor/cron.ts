import { CronJob } from "cron";
import { MonitoredPage } from "@full-tester/db/models/monitored-page.model";
import { MonitorResultBucket } from "@full-tester/db/models/monitor-result-bucket.model";
import { checkHealth } from "./check-health.js";

const MAX_PAGES_PER_TICK = 50;
const RESULT_BUCKET_SIZE = 500;

let isProcessing = false;

function computeNextCheckAt(intervalMs: number, varianceMs: number): Date {
  const variance = Math.round((Math.random() * 2 - 1) * varianceMs);
  const delayMs = Math.max(intervalMs + variance, 1000);
  return new Date(Date.now() + delayMs);
}

async function saveResult(
  monitoredPageId: string,
  result: {
    checkedAt: Date;
    statusCode: number | null;
    responseTimeMs: number;
    error: string | null;
  },
) {
  const updated = await MonitorResultBucket.findOneAndUpdate(
    { monitoredPageId, count: { $lt: RESULT_BUCKET_SIZE } },
    { $push: { results: result }, $inc: { count: 1 } },
  );

  if (!updated) {
    await MonitorResultBucket.create({
      _id: crypto.randomUUID(),
      monitoredPageId,
      results: [result],
      count: 1,
    });
  }
}

async function processMonitorTick() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const now = new Date();
    const claimed = [];

    for (let i = 0; i < MAX_PAGES_PER_TICK; i++) {
      const page = await MonitoredPage.findOneAndUpdate(
        { enabled: true, status: "idle", nextCheckAt: { $lte: now } },
        { $set: { status: "checking", checkingStartedAt: now } },
        { sort: { nextCheckAt: 1 }, new: true },
      );

      if (!page) break;
      claimed.push(page);
    }

    if (claimed.length === 0) return;

    await Promise.allSettled(
      claimed.map(async (page) => {
        try {
          const result = await checkHealth(page.url, page.timeoutMs ?? 30000);

          const checkedAt = new Date();

          await saveResult(page._id as string, {
            checkedAt,
            statusCode: result.statusCode,
            responseTimeMs: result.responseTimeMs,
            error: result.error,
          });

          const isFailure =
            result.error !== null || result.statusCode === null || result.statusCode >= 400;

          await MonitoredPage.updateOne(
            { _id: page._id },
            {
              $set: {
                status: "idle",
                lastCheckedAt: checkedAt,
                nextCheckAt: computeNextCheckAt(
                  page.checkIntervalMs ?? 60000,
                  page.varianceMs ?? 5000,
                ),
                lastStatusCode: result.statusCode,
                lastResponseTimeMs: result.responseTimeMs,
                lastError: result.error,
                checkingStartedAt: null,
                ...(isFailure ? {} : { consecutiveFailures: 0 }),
              },
              ...(isFailure ? { $inc: { consecutiveFailures: 1 } } : {}),
            },
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`Monitor check failed for ${page.url}:`, message);

          await MonitoredPage.updateOne(
            { _id: page._id },
            {
              $set: {
                status: "idle",
                lastCheckedAt: new Date(),
                nextCheckAt: computeNextCheckAt(
                  page.checkIntervalMs ?? 60000,
                  page.varianceMs ?? 5000,
                ),
                lastError: message,
                checkingStartedAt: null,
              },
              $inc: { consecutiveFailures: 1 },
            },
          );
        }
      }),
    );

    console.log(`Monitor tick: checked ${claimed.length} page(s)`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Monitor cron error:", message);
  } finally {
    isProcessing = false;
  }
}

async function recoverStaleChecks() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const result = await MonitoredPage.updateMany(
    { status: "checking", checkingStartedAt: { $lt: fiveMinutesAgo } },
    {
      $set: {
        status: "idle",
        checkingStartedAt: null,
        nextCheckAt: new Date(),
      },
    },
  );

  if (result.modifiedCount > 0) {
    console.log(`Recovered ${result.modifiedCount} stale monitor check(s)`);
  }
}

export function startMonitorCron() {
  const processingJob = new CronJob("* * * * *", processMonitorTick);
  processingJob.start();
  console.log("Monitor cron started (every 1 minute)");

  const recoveryJob = new CronJob("*/5 * * * *", recoverStaleChecks);
  recoveryJob.start();
  console.log("Monitor stale recovery cron started (every 5 minutes)");
}
