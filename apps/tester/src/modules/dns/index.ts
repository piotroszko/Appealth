import { Router } from "express";
import { runDnsHealthCheck } from "./dns-health-check.js";

export const dnsRouter = Router();

dnsRouter.post("/", async (req, res) => {
  const { domain } = req.body;
  if (!domain || typeof domain !== "string") {
    res.status(400).json({ error: "Missing or invalid 'domain' field" });
    return;
  }

  let cleanDomain = domain.trim();
  try {
    if (cleanDomain.includes("://")) {
      cleanDomain = new URL(cleanDomain).hostname;
    } else if (cleanDomain.includes("/")) {
      cleanDomain = cleanDomain.split("/")[0]!;
    }
  } catch {
  }
  cleanDomain = cleanDomain.replace(/^www\./, "");

  try {
    const result = await runDnsHealthCheck(cleanDomain);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: "DNS health check failed",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});
