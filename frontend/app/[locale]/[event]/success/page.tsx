import { getServerSession } from "@/lib/api/server-auth";
import { redirect } from "next/navigation";
import { generateMetadata as generateEventMetadata } from "../layout";
import Success from "./success-client";

export function generateMetadata(props: Parameters<typeof generateEventMetadata>[0]) {
	return generateEventMetadata(props);
}

type SuccessRoutePageProps = {
	params: Promise<{ locale: string; event: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildSearchString(searchParams: Record<string, string | string[] | undefined>) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(searchParams)) {
		if (Array.isArray(value)) {
			for (const item of value) params.append(key, item);
		} else if (value !== undefined) {
			params.set(key, value);
		}
	}
	const query = params.toString();
	return query ? `?${query}` : "";
}

export default async function SuccessRoutePage({ params, searchParams }: SuccessRoutePageProps) {
	const [{ locale, event }, query, session] = await Promise.all([params, searchParams, getServerSession()]);
	if (!session?.user) {
		const returnUrl = `/${locale}/${event}/success${buildSearchString(query)}`;
		redirect(`/${locale}/login/?returnUrl=${encodeURIComponent(returnUrl)}`);
	}

	return <Success />;
}
