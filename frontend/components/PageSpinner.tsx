import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";
import Image from "next/image";
import DecryptedText from "./DecryptedText";

interface PageSpinnerProps {
	size?: number;
	className?: string;
}

export default function PageSpinner() {
	const locale = useLocale();
	const t = getTranslations(locale, {
		loading: { "zh-Hant": "載入中...", "zh-Hans": "载入中...", en: "Loading..." }
	});

	return (
		<div className="flex flex-col items-center justify-center h-full">
			<Image src="/assets/small-stone.png" alt="Loading..." width={48} height={48} className="block animate-spin mb-6" />
			<DecryptedText text={t.loading} animateOn="view" />
		</div>
	);
}
