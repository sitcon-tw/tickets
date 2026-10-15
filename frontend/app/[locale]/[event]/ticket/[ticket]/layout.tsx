import { getServerTicket } from "@/lib/api/server-endpoints";
import type { Metadata } from "next";
import { getMetadataText } from "@/lib/utils/localization";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; event: string; ticket: string }> }): Promise<Metadata> {
	const { locale, event: eventSlug, ticket: ticketId } = await params;
	const site = process.env.SITE || "https://ticket.sitcon.org";

	const siteNameMap: Record<string, string> = {
		"zh-Hant": "SITCONTIX",
		en: "SITCON Registration System"
	};
	const siteName = siteNameMap[locale] || siteNameMap["zh-Hant"];

	const fallbackDescriptionMap: Record<string, string> = {
		"zh-Hant": "趕快來報名 SITCON 的活動吧！",
		en: "Register for SITCON events now!"
	};
	const fallbackDescription = fallbackDescriptionMap[locale] || fallbackDescriptionMap["zh-Hant"];

	const ticket = await getServerTicket(ticketId);
	if (ticket) {
		const ticketName = getMetadataText(ticket.name, locale, "Ticket");
		const ticketDescription = getMetadataText(ticket.plainDescription || ticket.description, locale, `Register for ${ticketName}`);

		return {
			title: `${ticketName} - ${siteName}`,
			description: ticketDescription,
			openGraph: {
				title: ticketName,
				description: ticketDescription,
				url: `${site}/${locale}/${eventSlug}/ticket/${ticketId}`,
				siteName: siteName,
				locale: locale,
				type: "website"
			},
			twitter: {
				card: "summary_large_image",
				title: ticketName,
				description: ticketDescription
			}
		};
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
