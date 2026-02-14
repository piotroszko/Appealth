import type { CapturedRequest } from "../../../../types/index.js";
import type { CheckContext, CheckResult } from "../../types.js";
import { isAllowedDomain } from "../../utils.js";
import { BaseCheck } from "../base-check.js";
import { ALL_CATEGORIES } from "./payloads.js";
import { buildBaseUrl, runCategory } from "./utils.js";

export class PredefinedUrlsCheck extends BaseCheck {
  readonly name = "predefined-urls";
  readonly description =
    "Probes known vulnerable public URL paths (exposed .env, .git/, admin panels, backups, etc.)";

  private readonly probedDomains = new Set<string>();

  async run(request: CapturedRequest, context: CheckContext): Promise<CheckResult[]> {
    const { url } = request;

    if (!isAllowedDomain(url, context.options.domains)) {
      return [];
    }

    let baseUrl: string;
    try {
      baseUrl = buildBaseUrl(url);
    } catch {
      return [];
    }

    if (this.probedDomains.has(baseUrl)) {
      return [];
    }
    this.probedDomains.add(baseUrl);

    const base = { checkName: this.name, request: { url: baseUrl, method: "GET" } };

    const results = await Promise.all(
      ALL_CATEGORIES.map((cat) => runCategory(baseUrl, cat.paths, base, context.httpClient)),
    );

    return results.flat();
  }
}
