"use client";

import MarkdownContent from "@/components/MarkdownContent";
import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";
import terms_en from "./terms-en";
import terms_zhhans from "./terms-zhhans";
import terms_zhhant from "./terms-zhhant";

function TermsPageLayout({ children, title }: { children: React.ReactNode; title: string }) {
	return (
		<>
			<main className="max-w-3xl mx-auto mt-32 mb-8 px-4">
				<h1 className="text-xl font-bold mb-8 text-gray-900 dark:text-gray-100">{title}</h1>
				{children}
			</main>
		</>
	);
}

export default function TermsClient() {
	const locale = useLocale();

	const t = getTranslations(locale, {
		termsOfService: {
			"zh-Hant": "æœå‹™æ¢æ¬¾èˆ‡éš±ç§æ”¿ç­–",
			"zh-Hans": "æœåŠ¡æ¡æ¬¾ä¸Žéšç§æ”¿ç­–",
			en: "Terms of Service and Privacy Policy"
		}
	});

	if (locale === "en") {
		return (
			<TermsPageLayout title={t.termsOfService}>
				<MarkdownContent content={terms_en} />
			</TermsPageLayout>
		);
	} else if (locale === "zh-Hans") {
		return (
			<TermsPageLayout title={t.termsOfService}>
				<MarkdownContent content={terms_zhhans} />
			</TermsPageLayout>
		);
	} else {
		return (
			<TermsPageLayout title={t.termsOfService}>
				<MarkdownContent content={terms_zhhant} />
			</TermsPageLayout>
		);
	}
}
