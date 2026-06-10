import { getServerSession } from "@/lib/api/server-auth";
import { redirect } from "next/navigation";
import { generateMetadata as generateEventMetadata } from "../layout";
import EventForm from "./form-client";

export function generateMetadata(props: Parameters<typeof generateEventMetadata>[0]) {
	return generateEventMetadata(props);
}

type EventFormRoutePageProps = {
	params: Promise<{ locale: string; event: string }>;
};

export default async function EventFormRoutePage({ params }: EventFormRoutePageProps) {
	const [{ locale, event }, session] = await Promise.all([params, getServerSession()]);
	if (!session?.user) {
		redirect(`/${locale}/login/?returnUrl=${encodeURIComponent(`/${locale}/${event}/form`)}`);
	}

	return <EventForm />;
}
