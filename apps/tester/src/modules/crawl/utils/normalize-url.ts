const SKIP_EXTENSIONS = new Set([
	".pdf", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif", ".ico",
	".css", ".js", ".mjs", ".cjs",
	".woff", ".woff2", ".ttf", ".eot", ".otf",
	".mp4", ".webm", ".ogg", ".mp3", ".wav",
	".zip", ".tar", ".gz", ".rar", ".7z",
	".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
	".xml", ".json", ".csv", ".txt",
]);

export function normalizeUrl(rawUrl: string, base?: string): string | null {
	try {
		const url = new URL(rawUrl, base);
		if (url.protocol !== "http:" && url.protocol !== "https:") return null;

		url.hash = "";
		url.hostname = url.hostname.toLowerCase();
		url.searchParams.sort();

		let pathname = url.pathname;
		if (pathname.length > 1 && pathname.endsWith("/")) {
			pathname = pathname.slice(0, -1);
		}
		url.pathname = pathname;

		return url.toString();
	} catch {
		return null;
	}
}

export function isSameDomain(url: string, domain: string): boolean {
	try {
		const hostname = new URL(url).hostname.toLowerCase();
		const normalizedDomain = domain.toLowerCase();
		return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`);
	} catch {
		return false;
	}
}

export function shouldSkipByExtension(url: string): boolean {
	try {
		const pathname = new URL(url).pathname.toLowerCase();
		const lastDot = pathname.lastIndexOf(".");
		if (lastDot === -1) return false;
		return SKIP_EXTENSIONS.has(pathname.slice(lastDot));
	} catch {
		return true;
	}
}
