"use client";

import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect } from "react";

/**
 * The root layout (Nav, AdminNav, Footer…) is not re-rendered on client-side navigation, so a locale read on the server
 * there goes stale after switching language. Read it from the URL instead so everything above `[locale]` follows it.
 */
export default function RouteLocaleProvider({ initialLocale, children }: { initialLocale: string; children: React.ReactNode }) {
	const params = useParams<{ locale?: string }>();
	const routeLocale = params?.locale;
	const locale = routeLocale && (routing.locales as readonly string[]).includes(routeLocale) ? routeLocale : initialLocale;

	useEffect(() => {
		document.documentElement.lang = locale;
	}, [locale]);

	return (
		<NextIntlClientProvider locale={locale} messages={{}}>
			{children}
		</NextIntlClientProvider>
	);
}
