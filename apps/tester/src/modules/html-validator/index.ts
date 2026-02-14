import { Router } from "express";
import { validateUrl } from "./validate-html.js";

export const htmlValidatorRouter = Router();

htmlValidatorRouter.post("/", async (req, res) => {
  const { url } = req.body as { url?: string };

  if (!url) {
    res.status(400).json({ error: "url field is required" });
    return;
  }

  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  try {
    const result = await validateUrl(normalizedUrl);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});
