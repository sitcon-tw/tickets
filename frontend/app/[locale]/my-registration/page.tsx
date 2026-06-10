import { getServerSession } from "@/lib/api/server-auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MyRegistrationsPage from "./my-registrations-client";

export const metadata: Metadata = {
	title: "My Registrations - SITCONTIX",
	description: "View your SITCONTIX event registrations."
};

type MyRegistrationsRoutePageProps = {
	params: Promise<{ locale: string }>;
};

export default async function MyRegistrationsRoutePage({ params }: MyRegistrationsRoutePageProps) {
	const [{ locale }, session] = await Promise.all([params, getServerSession()]);
	if (!session?.user) {
		redirect(`/${locale}/login/?returnUrl=${encodeURIComponent(`/${locale}/my-registration`)}`);
	}

	return <MyRegistrationsPage />;
}
