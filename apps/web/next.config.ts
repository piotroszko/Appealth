import "@full-tester/env/web";
import type { NextConfig } from "next";

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  experimental: {
    workerThreads: true,
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
