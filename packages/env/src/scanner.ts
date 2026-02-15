import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    API_KEY: z.string().min(1),
    AI_API_KEY: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    GOOGLE_API_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
