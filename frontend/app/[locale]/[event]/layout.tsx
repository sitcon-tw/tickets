import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; event: string }> }): Promise<Metadata> {
	const { locale, event: eventSlug } = await params;
	const site = process.env.SITE || "https://ticket.sitcon.org";

	const siteNameMap: Record<string, string> = {
		"zh-Hant": "SITCON 報名系統",
		"zh-Hans": "SITCON 报名系统",
		en: "SITCON Registration System"
	};
	const siteName = siteNameMap[locale] || siteNameMap["zh-Hant"];

	const fallbackDescriptionMap: Record<string, string> = {
		"zh-Hant": "趕快來報名 SITCON 的活動吧！",
		"zh-Hans": "赶快来报名 SITCON 的活动吧！",
		en: "Register for SITCON events now!"
	};
	const fallbackDescription = fallbackDescriptionMap[locale] || fallbackDescriptionMap["zh-Hant"];

	try {
		// For server-side calls, we need to use the full backend URL
		const backendUrl = process.env.BACKEND_URI || "http://localhost:3000";
		const response = await fetch(`${backendUrl}/api/events`, {
			headers: {
				"Content-Type": "application/json"
			}
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch events: ${response.status}`);
		}

		const eventsData = await response.json();

		if (eventsData?.success && Array.isArray(eventsData.data)) {
			const foundEvent = eventsData.data.find(e => e.id.slice(-6) === eventSlug);

			if (foundEvent) {
				const eventName = foundEvent.name || "SITCON Event";
				const eventDescription = foundEvent.description || `Register for ${eventName}`;

				return {
					title: `${eventName} - ${siteName}`,
					description: eventDescription.toString(),
					openGraph: {
						title: eventName.toString(),
						description: eventDescription.toString(),
						url: `${site}/${locale}/${eventSlug}`,
						siteName: siteName,
						locale: locale,
						type: "website",
					},
					twitter: {
						card: "summary_large_image",
						title: eventName.toString(),
						description: eventDescription.toString(),
					}
				};
			}
		}
	} catch (error) {
		console.error("Failed to fetch event for metadata:", error);
	}

	return {
		title: siteName,
		description: fallbackDescription,
		openGraph: {
			title: siteName,
			description: fallbackDescription,
			url: `${site}/${locale}/${eventSlug}`,
			siteName: siteName,
			locale: locale,
			type: "website"
		}
	};
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
