import { SSTI_PAYLOADS, type SstiPayload } from "./payloads.js";

const payloadMap = new Map<string, SstiPayload>(SSTI_PAYLOADS.map((p) => [p.payload, p]));

export const SSTI_ERROR_PATTERNS: { engine: string; pattern: RegExp }[] = [
  // Jinja2
  { engine: "Jinja2", pattern: /jinja2\.exceptions\./i },
  { engine: "Jinja2", pattern: /UndefinedError/ },
  // Twig
  { engine: "Twig", pattern: /Twig[_\\]Error/i },
  { engine: "Twig", pattern: /Twig_Error_Syntax/ },
  // FreeMarker
  { engine: "FreeMarker", pattern: /freemarker\.core\./i },
  { engine: "FreeMarker", pattern: /FreeMarkerException/ },
  // ERB
  { engine: "ERB", pattern: /\(erb\):\d+:in/i },
  // Thymeleaf
  { engine: "Thymeleaf", pattern: /org\.thymeleaf\./i },
  // Smarty
  { engine: "Smarty", pattern: /Smarty(?:Exception|CompilerException)/i },
  // Velocity
  { engine: "Velocity", pattern: /org\.apache\.velocity\./i },
  // Pebble
  { engine: "Pebble", pattern: /com\.mitchellbosecke\.pebble\./i },
  // Generic
  { engine: "Unknown", pattern: /TemplateSyntaxError/i },
  { engine: "Unknown", pattern: /TemplateError/i },
  { engine: "Unknown", pattern: /TemplateException/i },
];

export function matchSstiOutput(
  body: string,
  payload: string,
): { engine: string; evidence: string } | undefined {
  const entry = payloadMap.get(payload);

  if (entry) {
    for (const pattern of entry.patterns) {
      const m = pattern.exec(body);
      if (m) {
        const evidence = m[0].length > 80 ? m[0].slice(0, 80) + "..." : m[0];
        return { engine: entry.engine, evidence };
      }
    }
  }

  // Check engine-identifying error patterns regardless of payload match
  for (const { engine, pattern } of SSTI_ERROR_PATTERNS) {
    const m = pattern.exec(body);
    if (m) {
      const evidence = m[0].length > 80 ? m[0].slice(0, 80) + "..." : m[0];
      return { engine, evidence };
    }
  }

  return undefined;
}
