import mongoose from "mongoose";
import express from "express";
import { env } from "@full-tester/env/scanner";
import { apiKeyAuth } from "./middleware/api-key.js";
import { crawlRouter } from "./modules/crawl/index.js";
import { pageinsightsRouter } from "./modules/pageinsights/index.js";
import { htmlValidatorRouter } from "./modules/html-validator/index.js";
import { dnsRouter } from "./modules/dns/index.js";
import { sslTlsRouter } from "./modules/ssl-tls/index.js";
import { startApiTesterCron } from "./modules/api-tester/cron.js";
import { startBrokenLinksCron } from "./modules/broken-links/cron.js";
import { startMonitorCron } from "./modules/monitor/cron.js";
import { startCoverageCron } from "./modules/initial-load-coverage/cron.js";

await mongoose.connect(env.DATABASE_URL);
console.log("Connected to MongoDB");

const app = express();
const port = 3002;

app.use(express.json());
app.use(apiKeyAuth);

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "full-tester API" });
});

app.use("/crawl", crawlRouter);
app.use("/pageinsights", pageinsightsRouter);
app.use("/html-validator", htmlValidatorRouter);
app.use("/dns", dnsRouter);
app.use("/ssl-tls", sslTlsRouter);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  startApiTesterCron();
  startBrokenLinksCron();
  startMonitorCron();
  startCoverageCron();
});
