const SITEMAP_TIMEOUT_MS = 10_000;

export async function parseSitemap(domain: string): Promise<string[]> {
	const urls = new Set<string>();
	const visited = new Set<string>();

	const sitemapUrls = [
		`https://${domain}/sitemap.xml`,
		`https://${domain}/sitemap_index.xml`,
	];

	for (const sitemapUrl of sitemapUrls) {
		await fetchSitemap(sitemapUrl, urls, visited);
	}

	return [...urls];
}

async function fetchSitemap(
	sitemapUrl: string,
	urls: Set<string>,
	visited: Set<string>,
): Promise<void> {
	if (visited.has(sitemapUrl)) return;
	visited.add(sitemapUrl);

	let text: string;
	try {
		const response = await fetch(sitemapUrl, {
			signal: AbortSignal.timeout(SITEMAP_TIMEOUT_MS),
		});
		if (!response.ok) return;
		text = await response.text();
	} catch {
		return;
	}

	const locs = text.match(/<loc>\s*(.*?)\s*<\/loc>/gi);
	if (!locs) return;

	for (const loc of locs) {
		const match = /<loc>\s*(.*?)\s*<\/loc>/i.exec(loc);
		if (!match?.[1]) continue;
		const url = match[1].trim();

		if (url.endsWith(".xml") || url.includes("sitemap")) {
			await fetchSitemap(url, urls, visited);
		} else {
			urls.add(url);
		}
	}
}
