"use client";

import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";
import Image from "next/image";

export default function Hero() {
	const locale = useLocale();

	const t = getTranslations(locale, {
		description: {
			"zh-Hant": "SITCON 票務系統",
			"zh-Hans": "SITCON 票務系統",
			en: "SITCON Ticketing System"
		}
	});

	return (
		<div className="px-8 pt-32 pb-16 flex flex-col items-center">
			<h1 className="mb-8">
				<Image src="/assets/SITCONTIX_gray.svg" alt="SITCONTIX" width={384} height={77} className="dark:hidden" priority />
				<Image src="/assets/SITCONTIX.svg" alt="SITCONTIX" width={384} height={77} className="hidden dark:block" priority />
			</h1>
			<p className="text-lg md:text-xl">{t.description}</p>
		</div>
	);
}
