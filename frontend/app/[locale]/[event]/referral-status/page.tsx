import { getServerEvent, getServerReferralRanking, getServerReferralStats, getServerRegistrations } from "@/lib/api/server-endpoints";
import { redirect } from "next/navigation";
import { generateMetadata as generateEventMetadata } from "../layout";
import { findEventRegistration } from "../registration-utils";
import ReferralStatus from "./referral-status-client";

export function generateMetadata(props: Parameters<typeof generateEventMetadata>[0]) {
	return generateEventMetadata(props);
}

type ReferralStatusRoutePageProps = {
	params: Promise<{ locale: string; event: string }>;
};

export default async function ReferralStatusRoutePage({ params }: ReferralStatusRoutePageProps) {
	const { locale, event } = await params;
	const [registrations, foundEvent] = await Promise.all([getServerRegistrations(), getServerEvent(event)]);
	if (registrations && registrations.length === 0) {
		redirect(`/${locale}/`);
	}

	if (!foundEvent) {
		redirect(`/${locale}/`);
	}

	const eventRegistration = registrations ? findEventRegistration(registrations, foundEvent.id) : undefined;
	if (registrations && !eventRegistration) {
		redirect(`/${locale}/`);
	}

	const [stats, rankingData] = eventRegistration ? await Promise.all([getServerReferralStats(eventRegistration.id), getServerReferralRanking(foundEvent.id, 50)]) : [null, null];
	return <ReferralStatus initialStats={stats} initialRankingData={rankingData} />;
}
