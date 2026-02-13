import express from "express";
import { chromium } from "playwright";

const app = express();
const port = 3002;

app.use(express.json());

app.get("/", (_req, res) => {
	res.json({ status: "ok", message: "full-tester API" });
});

app.post("/requests", async (req, res) => {
	const { url } = req.body as { url?: string };

	if (!url) {
		res.status(400).json({ error: "url field is required" });
		return;
	}

	let browser;
	try {
		browser = await chromium.launch({ headless: true });
		const page = await browser.newPage();

		const networkRequests: string[] = [];

		page.on("request", (request) => {
			networkRequests.push(request.url());
		});

		await page.goto(url, { waitUntil: "load" });

		res.json({ url, requests: networkRequests });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		res.status(500).json({ error: message });
	} finally {
		await browser?.close();
	}
});

app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});
