import type { ApiResponse, EventListItem } from "@sitcontix/types";
import type { MetadataRoute } from "next";

const BASE_URL = process.env.FRONTEND_URI || "https://tickets.sitcon.org";
const API_URL = process.env.BACKEND_URI || "http://localhost:8000";
const locales = ["en", "zh-Hant", "zh-Hans"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const sitemap: MetadataRoute.Sitemap = [];

	let events: Array<{ slug?: string | null; updatedAt: string }> = [];
	try {
		const response = await fetch(`${API_URL}/api/events?isActive=true`, {
			headers: {
				"Content-Type": "application/json"
			},
			cache: "no-store"
		});

		if (response.ok) {
			const data = (await response.json()) as ApiResponse<EventListItem[]>;
			if (data.success && data.data) {
				events = data.data;
			}
		}
	} catch (error) {
		console.error("Failed to fetch events for sitemap:", error);
	}

	locales.forEach(locale => {
		sitemap.push({
			url: `${BASE_URL}/${locale}`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 1.0
		});
	});

	events.forEach(event => {
		if (event.slug) {
			const lastModified = event.updatedAt ? new Date(event.updatedAt) : new Date();
			const validLastModified = isNaN(lastModified.getTime()) ? new Date() : lastModified;

			locales.forEach(locale => {
				sitemap.push({
					url: `${BASE_URL}/${locale}/${event.slug}`,
					lastModified: validLastModified,
					changeFrequency: "weekly",
					priority: 0.9
				});
			});
		}
	});

	locales.forEach(locale => {
		sitemap.push({
			url: `${BASE_URL}/${locale}/login`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.7
		});
	});

	locales.forEach(locale => {
		sitemap.push({
			url: `${BASE_URL}/${locale}/my-registration`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8
		});
	});

	return sitemap;
}
