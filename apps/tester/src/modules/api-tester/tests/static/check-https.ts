import type { CheckDefinition } from "../../types.js";

export const checkHttps: CheckDefinition = {
  name: "https",
  description: "Flags any URL using http:// instead of https://",
  fn(request) {
    const { url, method } = request;
    const base = { checkName: "https", request: { url, method } };

    if (url.startsWith("http://")) {
      return [
        {
          ...base,
          severity: "warning",
          message: "Insecure HTTP request detected",
          details: `Request to ${url} uses http:// instead of https://`,
        },
      ];
    }

    return [];
  },
};
