import { Router } from "express";
import { runSslTlsCheck } from "./ssl-tls-check.js";

export const sslTlsRouter = Router();

sslTlsRouter.post("/", async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "Missing or invalid 'url' field" });
    return;
  }

  let hostname = url.trim();
  try {
    if (hostname.includes("://")) {
      hostname = new URL(hostname).hostname;
    } else if (hostname.includes("/")) {
      hostname = hostname.split("/")[0]!;
    }
  } catch {
  }
  hostname = hostname.replace(/^www\./, "");

  try {
    const result = await runSslTlsCheck(hostname);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: "SSL/TLS check failed",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});
