import { getServerEvent } from "@/lib/api/server-endpoints";
import { getMetadataText } from "@/lib/utils/localization";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; event: string }> }): Promise<Metadata> {
	const { locale, event: eventSlug } = await params;
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

	const foundEvent = await getServerEvent(eventSlug);
	if (foundEvent) {
		const eventName = getMetadataText(foundEvent.name, locale, "SITCON Event");
		const eventDescription = getMetadataText(foundEvent.plainDescription || foundEvent.description, locale, `Register for ${eventName}`);
		const ogImageUrl = foundEvent.ogImage;

		return {
			title: `${eventName} - ${siteName}`,
			description: eventDescription,
			openGraph: {
				title: eventName,
				description: eventDescription,
				url: `${site}/${locale}/${eventSlug}`,
				siteName: siteName,
				locale: locale,
				type: "website",
				...(ogImageUrl && {
					images: [
						{
							url: ogImageUrl
						}
					]
				})
			},
			twitter: {
				card: "summary_large_image",
				title: eventName,
				description: eventDescription,
				...(ogImageUrl && { images: [ogImageUrl] })
			}
		};
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
