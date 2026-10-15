import { getServerEvent, getServerReferralRanking, getServerRegistrations } from "@/lib/api/server-endpoints";
import { redirect } from "next/navigation";
import { generateMetadata as generateEventMetadata } from "../layout";
import { findEventRegistration } from "../registration-utils";
import ReferralRanking from "./referral-ranking-client";

export function generateMetadata(props: Parameters<typeof generateEventMetadata>[0]) {
	return generateEventMetadata(props);
}

type ReferralRankingRoutePageProps = {
	params: Promise<{ locale: string; event: string }>;
};

export default async function ReferralRankingRoutePage({ params }: ReferralRankingRoutePageProps) {
	const { locale, event } = await params;
	const [foundEvent, registrations] = await Promise.all([getServerEvent(event), getServerRegistrations()]);
	if (!foundEvent) {
		redirect(`/${locale}/`);
	}

	const eventRegistration = registrations ? findEventRegistration(registrations, foundEvent.id) : undefined;
	if (registrations && !eventRegistration) {
		redirect(`/${locale}/`);
	}

	const rankingData = await getServerReferralRanking(foundEvent.id, 50);
	return <ReferralRanking initialRankingData={rankingData} />;
}
