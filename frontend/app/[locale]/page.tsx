import EventList from "@/components/home/EventList";
import Hero from "@/components/home/Hero";
import { getServerPublicEvents, getServerSiteSettings } from "@/lib/api/server-endpoints";
import { sortEventsForDisplay } from "@/lib/utils/events";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "SITCONTIX",
	description: "Register for SITCON events and manage your tickets."
};

type HomePageProps = {
	params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
	const { locale } = await params;

	const settings = await getServerSiteSettings();
	if (settings?.redirectHomeToFirstEvent) {
		const events = await getServerPublicEvents();
		const [firstEvent] = sortEventsForDisplay(events ?? []);
		if (firstEvent) {
			redirect(`/${locale}/${firstEvent.slug || firstEvent.id.slice(-6)}`);
		}
	}

	return (
		<div className="mt-20 max-w-6xl mx-auto">
			<Hero />
			<EventList />
		</div>
	);
}
