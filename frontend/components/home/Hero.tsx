"use client";

import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";
import Image from "next/image";

export default function Hero() {
	const locale = useLocale();

	const t = getTranslations(locale, {
		title: {
			"zh-Hant": "SITCON 2026",
			"zh-Hans": "SITCON 2026",
			en: "SITCON 2026"
		},
		description: {
			"zh-Hant": "學生計算機年會票務系統",
			"zh-Hans": "学生计算机年会票务系统",
			en: "Students' Information Technology Conference Registration System"
		}
	});

	return (
		<div className="flex flex-col items-center justify-center py-16 px-4">
			<div className="mb-8">
				<Image
					src="/assets/SITCON.svg"
					alt="SITCON Logo"
					width={200}
					height={200}
					className="dark:hidden"
					priority
				/>
				<Image
					src="/assets/SITCON_WHITE.svg"
					alt="SITCON Logo"
					width={200}
					height={200}
					className="hidden dark:block"
					priority
				/>
			</div>
			<h1 className="text-4xl md:text-5xl font-bold text-center mb-4">{t.title}</h1>
			<p className="text-lg md:text-xl text-muted-foreground text-center max-w-2xl">{t.description}</p>
		</div>
	);
}
