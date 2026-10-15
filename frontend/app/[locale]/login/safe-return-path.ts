/** Only allow same-origin relative paths so a return/redirect URL from the query string can't be used as an open redirect. */
export function safeReturnPath(returnUrl: string | null | undefined, locale: string): string {
	const fallback = `/${locale}/`;
	if (!returnUrl || !returnUrl.startsWith("/") || returnUrl.startsWith("//")) return fallback;
	// Browsers treat "\" like "/" and drop tabs/newlines, so "/\evil.com" or "/\t/evil.com" would turn into "//evil.com".
	if (returnUrl.includes("\\")) return fallback;
	for (let i = 0; i < returnUrl.length; i++) {
		const code = returnUrl.charCodeAt(i);
		if (code < 0x20 || code === 0x7f) return fallback;
	}
	return returnUrl;
}
