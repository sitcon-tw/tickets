import MarkdownContent from "@/components/MarkdownContent";
import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";
import terms_en from "./terms-en";
import terms_zhhans from "./terms-zhhans";
import terms_zhhant from "./terms-zhhant";

export default function TermsPage() {
	const locale = useLocale();

	const t = getTranslations(locale, {
		termsOfService: {
			"zh-Hant": "服務條款與隱私政策",
			"zh-Hans": "服务条款与隐私政策",
			en: "Terms of Service and Privacy Policy"
		}
	});

	function TermsPageLayout({ children }: { children: React.ReactNode }) {
		return (
			<>
				<main className="max-w-3xl mx-auto mt-32 mb-8 px-4">
					<h1 className="text-xl font-bold mb-8 text-gray-900 dark:text-gray-100">{t.termsOfService}</h1>
					{children}
				</main>
			</>
		);
	}

	if (locale === "en") {
		return (
			<TermsPageLayout>
				<MarkdownContent content={terms_en} />
			</TermsPageLayout>
		);
	} else if (locale === "zh-Hans") {
		return (
			<TermsPageLayout>
				<MarkdownContent content={terms_zhhans} />
			</TermsPageLayout>
		);
	} else {
		return (
			<TermsPageLayout>
				<MarkdownContent content={terms_zhhant} />
			</TermsPageLayout>
		);
	}
}
