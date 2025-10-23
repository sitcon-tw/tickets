import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; event: string; ticket: string }> }): Promise<Metadata> {
	const { locale, event: eventSlug, ticket: ticketId } = await params;
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
		const backendUrl = process.env.BACKEND_URI || "http://localhost:3000";

		const ticketResponse = await fetch(`${backendUrl}/api/tickets/${ticketId}`, {
			headers: { "Content-Type": "application/json" }
		});

		if (!ticketResponse.ok) {
			throw new Error("Failed to fetch ticket data");
		}

		const ticketData = await ticketResponse.json();

		const getLocalizedText = (text: Record<string, string> | string | undefined, fallback: string): string => {
			if (!text) return fallback;
			if (typeof text === "string") return text;
			return text[locale] || text["zh-Hant"] || text["en"] || Object.values(text)[0] || fallback;
		};

		if (ticketData?.success && ticketData.data) {
			const ticket = ticketData.data;
			const ticketName = getLocalizedText(ticket.name, "Ticket");
			const ticketDescription = getLocalizedText(
				ticket.plainDescription || ticket.description,
				`Register for ${ticketName}`
			);

			return {
				title: `${ticketName} - ${siteName}`,
				description: ticketDescription,
				openGraph: {
					title: ticketName,
					description: ticketDescription,
					url: `${site}/${locale}/${eventSlug}/ticket/${ticketId}`,
					siteName: siteName,
					locale: locale,
					type: "website",
				},
				twitter: {
					card: "summary_large_image",
					title: ticketName,
					description: ticketDescription,
				}
			};
		}
	} catch (error) {
		console.error("Failed to fetch ticket metadata:", error);
	}

	return {
		title: siteName,
		description: fallbackDescription,
		openGraph: {
			title: siteName,
			description: fallbackDescription,
			url: `${site}/${locale}/${eventSlug}/ticket/${ticketId}`,
			siteName: siteName,
			locale: locale,
			type: "website"
		}
	};
}

export default function TicketLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
