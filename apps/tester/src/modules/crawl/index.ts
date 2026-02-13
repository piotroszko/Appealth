import { Router } from "express";
import { chromium } from "playwright";
import { createGroq, type GroqLanguageModelOptions } from '@ai-sdk/groq';
import { env } from "@full-tester/env/tester";
import { generateText } from "ai";
import { stripHtml } from "./utils/strip-html.js";

const groq = createGroq({
	apiKey: env.AI_API_KEY
});


export const crawlRouter = Router();


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
		const strippedHtml = stripHtml(fullHtml);

		const result = await generateText({
			model: groq('openai/gpt-oss-120b'),
			providerOptions: {
				groq: {
					reasoningFormat: 'hidden',
					reasoningEffort: 'low',
				} satisfies GroqLanguageModelOptions,
			},
			prompt: ``,
		});

		res.json({ url, html: result.text });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		res.status(500).json({ error: message });
	} finally {
		await browser?.close();
	}
});
