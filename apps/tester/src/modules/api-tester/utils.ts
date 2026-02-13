export function isAllowedDomain(url: string, domains: string[] | undefined): boolean {
	if (!domains || domains.length === 0) return false;
	try {
		const hostname = new URL(url).hostname;
		return domains.some((d) => hostname === d || hostname.endsWith(`.${d}`));
	} catch {
		return false;
	}
}
