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
		<div className="flex flex-col items-center justify-center py-16 px-4">
			<h1 className="mb-8">
				<Image src="/assets/SITCONTIX_gray.svg" alt="SITCONTIX" width={200} height={200} className="dark:hidden" priority />
				<Image src="/assets/SITCONTIX.svg" alt="SITCONTIX" width={200} height={200} className="hidden dark:block" priority />
			</h1>
			<p className="text-lg md:text-xl text-muted-foreground text-center max-w-2xl">{t.description}</p>
		</div>
	);
}
