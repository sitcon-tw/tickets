import type { FastifyPluginAsync } from "fastify";

// In-memory cache for OpenGraph titles
const titleCache = new Map<string, { title: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const opengraphRoutes: FastifyPluginAsync = async fastify => {
	fastify.get("/opengraph/title", async (request, reply) => {
		const { url } = request.query as { url?: string };

		if (!url || typeof url !== "string") {
			return reply.status(400).send({
				success: false,
				message: "Invalid URL parameter",
			});
		}

		// Check cache first
		const cached = titleCache.get(url);
		if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
			return reply.send({
				success: true,
				data: {
					title: cached.title,
				},
			});
		}

		// Only allow Google Maps domains
		const allowedDomains = [
			"maps.google.com",
			"maps.app.goo.gl",
			"goo.gl",
			"google.com/maps",
		];

		try {
			const urlObj = new URL(url);
			const isAllowed = allowedDomains.some(
				domain =>
					urlObj.hostname === domain ||
					urlObj.hostname.endsWith(`.${domain}`) ||
					urlObj.hostname.includes("google.com/maps"),
			);

			if (!isAllowed) {
				return reply.status(400).send({
					success: false,
					message: "Only Google Maps URLs are allowed",
				});
			}
		} catch {
			return reply.status(400).send({
				success: false,
				message: "Invalid URL",
			});
		}

		try {
			// Fetch the URL
			const response = await fetch(url, {
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
				},
				signal: AbortSignal.timeout(5000), // 5 second timeout
			});

			if (!response.ok) {
				return reply.status(500).send({
					success: false,
					message: "Failed to fetch URL",
				});
			}

			const html = await response.text();

			// Extract OpenGraph title using regex (handles both property-first and content-first)
			const ogTitleMatch = html.match(
				/<meta\s+(?:property=["']og:title["']\s+content=["']([^"']+)["']|content=["']([^"']+)["']\s+property=["']og:title["'])/i,
			);
			const ogTitle = ogTitleMatch ? (ogTitleMatch[1] || ogTitleMatch[2]) : null;

			// Fallback to regular title tag if no og:title
			if (!ogTitle) {
				const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
				const title = titleMatch ? titleMatch[1] : null;
				const finalTitle = title || url;

				// Cache the result
				titleCache.set(url, {
					title: finalTitle,
					timestamp: Date.now(),
				});

				return reply.send({
					success: true,
					data: {
						title: finalTitle,
					},
				});
			}

			const parsedOgTitle = ogTitle.includes("·") && ogTitle.split("·").length > 1
				? ogTitle.split("·")[0].trim()
				: ogTitle;

			// Cache the result
			titleCache.set(url, {
				title: parsedOgTitle,
				timestamp: Date.now(),
			});

			return reply.send({
				success: true,
				data: {
					title: parsedOgTitle,
				},
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.status(500).send({
				success: false,
				message: "Failed to fetch OpenGraph title",
			});
		}
	});
};

export default opengraphRoutes;
