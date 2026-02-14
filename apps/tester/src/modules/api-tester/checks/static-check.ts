import type { CapturedRequest } from "../../../types/index.js";
import type { CheckContext, CheckResult } from "../types.js";
import { BaseCheck } from "./base-check.js";

export abstract class StaticCheck extends BaseCheck {
  async run(request: CapturedRequest, _context: CheckContext): Promise<CheckResult[]> {
    return this.analyze(request);
  }

  protected abstract analyze(request: CapturedRequest): CheckResult[];
}
