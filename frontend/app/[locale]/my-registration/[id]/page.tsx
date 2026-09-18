import { getServerSession } from "@/lib/api/server-auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MyRegistrationPage from "./my-registration-detail-client";

export const metadata: Metadata = {
	title: "Registration Details - SITCONTIX",
	description: "View and manage a SITCONTIX registration."
};

type MyRegistrationRoutePageProps = {
	params: Promise<{ locale: string; id: string }>;
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

export default async function MyRegistrationRoutePage({ params, searchParams }: MyRegistrationRoutePageProps) {
	const [{ locale, id }, query, session] = await Promise.all([params, searchParams, getServerSession()]);
	if (!session?.user) {
		const returnUrl = `/${locale}/my-registration/${id}${buildSearchString(query)}`;
		redirect(`/${locale}/login/?returnUrl=${encodeURIComponent(returnUrl)}`);
	}

	return <MyRegistrationPage />;
}
