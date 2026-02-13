import express from "express";
import { crawlRouter } from "./modules/crawl/index.js";

const app = express();
const port = 3002;

app.use(express.json());

app.get("/", (_req, res) => {
	res.json({ status: "ok", message: "full-tester API" });
});

app.use("/crawl", crawlRouter);

app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});
