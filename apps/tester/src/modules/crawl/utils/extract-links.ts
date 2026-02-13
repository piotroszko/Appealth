/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import type { Page } from "playwright";

export async function extractLinks(page: Page): Promise<string[]> {
	return page.evaluate(() => {
		const urls = new Set<string>();

		for (const el of document.querySelectorAll("a[href]")) {
			const href = (el as HTMLAnchorElement).href;
			if (href) urls.add(href);
		}

		for (const el of document.querySelectorAll("form[action]")) {
			const action = (el as HTMLFormElement).action;
			if (action) urls.add(action);
		}

		for (const el of document.querySelectorAll("area[href]")) {
			const href = (el as HTMLAreaElement).href;
			if (href) urls.add(href);
		}

		for (const el of document.querySelectorAll('link[rel="canonical"], link[rel="alternate"]')) {
			const href = (el as HTMLLinkElement).href;
			if (href) urls.add(href);
		}

		return [...urls];
	});
}
