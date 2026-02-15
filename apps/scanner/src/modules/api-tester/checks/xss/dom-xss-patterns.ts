/** DOM XSS sources — where user-controlled data enters JavaScript */
export const DOM_XSS_SOURCES = [
  // Location-based
  "document.location",
  "document.URL",
  "document.documentURI",
  "document.baseURI",
  "document.referrer",
  "window.location",
  "location.href",
  "location.hash",
  "location.search",
  "location.pathname",
  // Web messaging
  "window.name",
  "postMessage",
  // Storage
  "localStorage",
  "sessionStorage",
  // URL API
  "URLSearchParams",
] as const;

/** DOM XSS sinks — where data leads to code execution or DOM mutation */
export const DOM_XSS_SINKS = [
  // HTML injection
  { pattern: /\.innerHTML\s*=/, label: "innerHTML assignment" },
  { pattern: /\.outerHTML\s*=/, label: "outerHTML assignment" },
  { pattern: /\.insertAdjacentHTML\s*\(/, label: "insertAdjacentHTML()" },
  { pattern: /document\.write\s*\(/, label: "document.write()" },
  { pattern: /document\.writeln\s*\(/, label: "document.writeln()" },
  // Code execution
  { pattern: /\beval\s*\(/, label: "eval()" },
  { pattern: /\bnew\s+Function\s*\(/, label: "new Function()" },
  { pattern: /setTimeout\s*\(\s*['"`]/, label: "setTimeout(string)" },
  { pattern: /setInterval\s*\(\s*['"`]/, label: "setInterval(string)" },
  // Navigation
  { pattern: /location\s*=\s*/, label: "location assignment" },
  { pattern: /location\.href\s*=/, label: "location.href assignment" },
  { pattern: /location\.assign\s*\(/, label: "location.assign()" },
  { pattern: /location\.replace\s*\(/, label: "location.replace()" },
  // jQuery-style sinks
  { pattern: /\.html\s*\(/, label: ".html() (jQuery-style)" },
  { pattern: /\$\s*\(\s*['"`].*['"`]\s*\)/, label: "jQuery selector from string" },
] as const;

const SCRIPT_RE = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;

export interface DomXssFinding {
  source: string;
  sink: string;
  scriptSnippet: string;
}

/**
 * Extract `<script>` blocks from HTML and scan each block
 * for co-occurrence of a DOM source and a dangerous sink.
 */
export function detectDomXssPatterns(html: string): DomXssFinding[] {
  const findings: DomXssFinding[] = [];
  const seen = new Set<string>();

  let m: RegExpExecArray | null;
  SCRIPT_RE.lastIndex = 0;

  while ((m = SCRIPT_RE.exec(html)) !== null) {
    const script = m[1] ?? "";
    if (!script.trim()) continue;

    for (const source of DOM_XSS_SOURCES) {
      if (!script.includes(source)) continue;

      for (const sink of DOM_XSS_SINKS) {
        if (!sink.pattern.test(script)) continue;

        const key = `${source}|${sink.label}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const snippet = script.length > 120 ? `${script.slice(0, 120)}…` : script;

        findings.push({
          source,
          sink: sink.label,
          scriptSnippet: snippet.trim(),
        });
      }
    }
  }

  return findings;
}
