import type { CapturedRequest } from "../../../types/index.js";
import type { CheckContext, CheckResult } from "../types.js";

export abstract class BaseCheck {
  abstract readonly name: string;
  abstract readonly description: string;

  abstract run(request: CapturedRequest, context: CheckContext): Promise<CheckResult[]>;

  protected base(request: CapturedRequest): {
    checkName: string;
    request: { url: string; method: string };
  } {
    return { checkName: this.name, request: { url: request.url, method: request.method } };
  }
}
