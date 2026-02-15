import { client } from "@full-tester/db";
import { env } from "@full-tester/env/server";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: mongodbAdapter(client),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const providedKey = ctx.headers?.get("x-register-access-key");
      if (providedKey !== env.REGISTER_ACCESS_KEY) {
        throw new APIError("FORBIDDEN", {
          message: "Invalid access key",
        });
      }
    }),
  },
  plugins: [
    nextCookies(),
  ],
});
