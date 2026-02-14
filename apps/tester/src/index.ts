import mongoose from "mongoose";
import express from "express";
import { env } from "@full-tester/env/tester";
import { crawlRouter } from "./modules/crawl/index.js";
import { startApiTesterCron } from "./modules/api-tester/cron.js";

await mongoose.connect(env.DATABASE_URL);
console.log("Connected to MongoDB");

const app = express();
const port = 3002;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "full-tester API" });
});

app.use("/crawl", crawlRouter);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  startApiTesterCron();
});
