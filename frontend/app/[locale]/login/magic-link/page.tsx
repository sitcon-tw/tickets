import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MagicLinkVerify from "./magic-link-client";

export const metadata: Metadata = {
	title: "Verify Login Link - SITCONTIX",
	description: "Verify your SITCONTIX magic login link."
};

type MagicLinkVerifyPageProps = {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{ status?: string; returnUrl?: string }>;
};

function getSafeRedirect(locale: string, returnUrl?: string) {
	if (!returnUrl) return `/${locale}/`;

	try {
		const url = new URL(returnUrl, "http://localhost");
		if (url.origin !== "http://localhost") return `/${locale}/`;
		if (url.pathname.includes("/login") || url.pathname.includes("/verify")) return `/${locale}/`;
		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return `/${locale}/`;
	}
}

export default async function MagicLinkVerifyPage({ params, searchParams }: MagicLinkVerifyPageProps) {
	const [{ locale }, { status, returnUrl }] = await Promise.all([params, searchParams]);
	if (status === "success") {
		redirect(getSafeRedirect(locale, returnUrl));
	}

	return <MagicLinkVerify />;
}
