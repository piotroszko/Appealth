import { chromium } from "playwright";
import { createRequire } from "node:module";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { VnuMessage, VnuOutput, HtmlValidatorResult } from "./types.js";

const require = createRequire(import.meta.url);
const vnuJar = require("vnu-jar");
const vnu: { check: (args: string[]) => Promise<string> } = vnuJar.vnu;

async function fetchRenderedHtml(url: string): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
    return await page.content();
  } finally {
    await browser.close();
  }
}

async function runVnuCheck(html: string): Promise<VnuMessage[]> {
  const tempFile = join(tmpdir(), `vnu-${randomUUID()}.html`);
  try {
    await writeFile(tempFile, html, "utf-8");
    const output = await vnu.check(["--format", "json", "--exit-zero-always", tempFile]);
    const parsed: VnuOutput = JSON.parse(output);
    return parsed.messages;
  } catch (error) {
    if (error instanceof Error && error.message) {
      try {
        const parsed: VnuOutput = JSON.parse(error.message);
        return parsed.messages;
      } catch {
        throw error;
      }
    }
    throw error;
  } finally {
    await unlink(tempFile).catch(() => {});
  }
}

export async function validateUrl(url: string): Promise<HtmlValidatorResult> {
  const start = Date.now();
  const html = await fetchRenderedHtml(url);
  const messages = await runVnuCheck(html);

  const summary = { errors: 0, warnings: 0, info: 0 };
  for (const msg of messages) {
    if (msg.type === "error") summary.errors++;
    else if (msg.type === "info" && msg.subType === "warning") summary.warnings++;
    else if (msg.type === "info") summary.info++;
  }

  return { url, messages, summary, durationMs: Date.now() - start };
}
