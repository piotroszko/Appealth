import type { Request, Response, NextFunction } from "express";
import { env } from "@full-tester/env/scanner";

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"];

  if (apiKey !== env.API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
