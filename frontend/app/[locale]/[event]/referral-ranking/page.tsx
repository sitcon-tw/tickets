import { getServerPublicEvents, getServerReferralRanking, getServerRegistrations } from "@/lib/api/server-endpoints";
import { redirect } from "next/navigation";
import { generateMetadata as generateEventMetadata } from "../layout";
import ReferralRanking from "./referral-ranking-client";

export function generateMetadata(props: Parameters<typeof generateEventMetadata>[0]) {
	return generateEventMetadata(props);
}

type ReferralRankingRoutePageProps = {
	params: Promise<{ locale: string; event: string }>;
};

export default async function ReferralRankingRoutePage({ params }: ReferralRankingRoutePageProps) {
	const [{ locale, event }, events, registrations] = await Promise.all([params, getServerPublicEvents(), getServerRegistrations()]);
	const foundEvent = events?.find(item => item.slug === event || item.id.slice(-6) === event);
	if (!foundEvent) {
		redirect(`/${locale}/`);
	}

	const eventRegistration = registrations?.find(registration => registration.event?.id === foundEvent.id);
	if (registrations && !eventRegistration) {
		redirect(`/${locale}/`);
	}

	const rankingData = await getServerReferralRanking(foundEvent.id, 50);
	return <ReferralRanking initialRankingData={rankingData} />;
}
