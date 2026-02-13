import { Router } from "express";
import { chromium } from "playwright";
import { DomainCrawler } from "./domain-crawler.js";
import type { DomainCrawlerOptions } from "./types.js";

// const groq = createGroq({
// 	apiKey: env.AI_API_KEY
// });


export const crawlRouter = Router();


crawlRouter.post("/domain", async (req, res) => {
	const { domain, options } = req.body as { domain?: string; options?: DomainCrawlerOptions };

	if (!domain) {
		res.status(400).json({ error: "domain field is required" });
		return;
	}

	const crawler = new DomainCrawler(options);
	try {
		const result = await crawler.crawl(domain);
		res.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		res.status(500).json({ error: message });
	} finally {
		await crawler.close();
	}
});

crawlRouter.post("/", async (req, res) => {
	const { domain } = req.body as { domain?: string };

	if (!domain) {
		res.status(400).json({ error: "domain field is required" });
		return;
	}

	const url = domain.startsWith("http") ? domain : `https://${domain}`;

	let browser;
	try {
		browser = await chromium.launch({ headless: true });
		const page = await browser.newPage();
		await page.goto(url, { waitUntil: "networkidle" });

		const fullHtml = await page.content();

		// const result = await generateText({
		// 	model: groq('openai/gpt-oss-120b'),
		// 	providerOptions: {
		// 		groq: {
		// 			reasoningFormat: 'hidden',
		// 			reasoningEffort: 'low',
		// 		} satisfies GroqLanguageModelOptions,
		// 	},
		// 	prompt: ``,
		// });

		res.json(fullHtml);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		res.status(500).json({ error: message });
	} finally {
		await browser?.close();
	}
});
