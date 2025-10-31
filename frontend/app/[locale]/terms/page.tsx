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
				<main style={{ maxWidth: 800, margin: "2rem auto", marginTop: "8rem", padding: "0 1rem" }}>
					<h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>{t.termsOfService}</h1>
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
