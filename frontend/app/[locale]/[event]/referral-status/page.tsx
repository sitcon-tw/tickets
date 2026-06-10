import { getServerPublicEvents, getServerReferralRanking, getServerReferralStats, getServerRegistrations } from "@/lib/api/server-endpoints";
import { redirect } from "next/navigation";
import { generateMetadata as generateEventMetadata } from "../layout";
import ReferralStatus from "./referral-status-client";

export function generateMetadata(props: Parameters<typeof generateEventMetadata>[0]) {
	return generateEventMetadata(props);
}

type ReferralStatusRoutePageProps = {
	params: Promise<{ locale: string; event: string }>;
};

export default async function ReferralStatusRoutePage({ params }: ReferralStatusRoutePageProps) {
	const [{ locale, event }, registrations, events] = await Promise.all([params, getServerRegistrations(), getServerPublicEvents()]);
	if (registrations && registrations.length === 0) {
		redirect(`/${locale}/`);
	}

	const foundEvent = events?.find(item => item.slug === event || item.id.slice(-6) === event);
	if (!foundEvent) {
		redirect(`/${locale}/`);
	}

	const eventRegistration = registrations?.find(registration => registration.event?.id === foundEvent.id);
	if (registrations && !eventRegistration) {
		redirect(`/${locale}/`);
	}

	const [stats, rankingData] = eventRegistration ? await Promise.all([getServerReferralStats(eventRegistration.id), getServerReferralRanking(foundEvent.id, 50)]) : [null, null];
	return <ReferralStatus initialStats={stats} initialRankingData={rankingData} />;
}
