/**
 * Strips <script>, <style> tags and their contents,
 * inline style/onX attributes, and common non-content elements from raw HTML.
 */
export function stripHtml(html: string): string {
	return html
		// Remove <script>...</script> (including multiline)
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
		// Remove <style>...</style>
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
		// Remove <noscript>...</noscript>
		.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "")
		// Remove <svg>...</svg>
		.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "")
		// Remove inline style attributes
		.replace(/\s+style="[^"]*"/gi, "")
		.replace(/\s+style='[^']*'/gi, "")
		// Remove inline event handlers (onclick, onload, etc.)
		.replace(/\s+on\w+="[^"]*"/gi, "")
		.replace(/\s+on\w+='[^']*'/gi, "")
		// Remove HTML comments
		.replace(/<!--[\s\S]*?-->/g, "")
		// Remove <link> tags (stylesheets, preloads, etc.)
		.replace(/<link\b[^>]*\/?>/gi, "")
		// Remove <meta> tags
		.replace(/<meta\b[^>]*\/?>/gi, "")
		// Collapse multiple blank lines into one
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}
