import type { CheckDefinition } from "../../types.js";
import { isAllowedDomain } from "../../utils.js";
import { ALL_CATEGORIES } from "./payloads.js";
import { buildBaseUrl, runCategory } from "./utils.js";

const probedDomains = new Set<string>();

export const checkPredefinedUrls: CheckDefinition = {
  name: "predefined-urls",
  description:
    "Probes known vulnerable public URL paths (exposed .env, .git/, admin panels, backups, etc.)",
  async fn(request, options) {
    const { url } = request;

    if (!isAllowedDomain(url, options.domains)) {
      return [];
    }

    let baseUrl: string;
    try {
      baseUrl = buildBaseUrl(url);
    } catch {
      return [];
    }

    if (probedDomains.has(baseUrl)) {
      return [];
    }
    probedDomains.add(baseUrl);

    const base = { checkName: "predefined-urls", request: { url: baseUrl, method: "GET" } };

    const results = await Promise.all(
      ALL_CATEGORIES.map((cat) => runCategory(baseUrl, cat.paths, base)),
    );

    return results.flat();
  },
};
