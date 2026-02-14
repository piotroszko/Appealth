import type { CapturedRequest } from "../../../../types/index.js";
import { BLOCKED_RESOURCE_TYPES } from "../../../crawl/types.js";
import type { CheckResult } from "../../types.js";
import { StaticCheck } from "../static-check.js";

export class StatusCodesCheck extends StaticCheck {
  readonly name = "status-codes";
  readonly description =
    "Flags 5xx responses as errors, 4xx as warnings, and null status as failed requests";

  protected analyze(request: CapturedRequest): CheckResult[] {
    const { responseStatus, resourceType } = request;
    const base = this.base(request);

    if (responseStatus === null) {
      if (BLOCKED_RESOURCE_TYPES.has(resourceType)) {
        return [];
      }
      return [
        {
          ...base,
          severity: "error",
          message: "Request failed with no response",
          details: "The request did not receive any response (network error or timeout)",
        },
      ];
    }

    if (responseStatus >= 500) {
      return [
        {
          ...base,
          severity: "error",
          message: `Server error: ${responseStatus}`,
          details: `Received ${responseStatus} response indicating a server-side failure`,
        },
      ];
    }

    if (responseStatus >= 400) {
      return [
        {
          ...base,
          severity: "warning",
          message: `Client error: ${responseStatus}`,
          details: `Received ${responseStatus} response indicating a client-side error`,
        },
      ];
    }

    return [];
  }
}
