import { Router } from "express";
import { google } from "googleapis";
import { env } from "@full-tester/env/tester";
import type { PageInsightsRequestBody, PageInsightsResult, Category } from "./types.js";

const DEFAULT_CATEGORIES: Category[] = ["performance", "accessibility", "best-practices", "seo"];

export const pageinsightsRouter = Router();

pageinsightsRouter.post("/", async (req, res) => {
  const { url, strategy, categories } = req.body as PageInsightsRequestBody;

  if (!url) {
    res.status(400).json({ error: "url field is required" });
    return;
  }

  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  const selectedCategories = categories ?? DEFAULT_CATEGORIES;
  const selectedStrategy = strategy ?? "desktop";

  try {
    const pagespeed = google.pagespeedonline("v5");
    const response = await pagespeed.pagespeedapi.runpagespeed({
      url: normalizedUrl,
      strategy: selectedStrategy,
      category: selectedCategories,
      key: env.GOOGLE_API_KEY,
    });

    const data = response.data;

    const result: PageInsightsResult = {
      url: normalizedUrl,
      timestamp: new Date().toISOString(),
      analysisUTCTimestamp: (data.analysisUTCTimestamp as string) ?? "",
      lighthouseResult: data.lighthouseResult ?? {},
      loadingExperience: data.loadingExperience ?? {},
    };

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});
