"use client";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { routing } from "@/i18n/routing";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotFound() {
	const [locale, setLocale] = useState(routing.defaultLocale);

	useEffect(() => {
		const path = window.location.pathname;
		const detectedLocale = routing.locales.find(loc => path.startsWith(`/${loc}`));
		if (detectedLocale) {
			setLocale(detectedLocale);
		}
	}, []);

	const t = getTranslations(locale, {
		title: {
			"zh-Hant": "找不到頁面",
			"zh-Hans": "找不到页面",
			en: "Page Not Found"
		},
		description: {
			"zh-Hant": "抱歉，您訪問的頁面不存在。",
			"zh-Hans": "抱歉，您访问的页面不存在。",
			en: "Sorry, the page you are looking for does not exist."
		},
		backHome: {
			"zh-Hant": "回首頁",
			"zh-Hans": "回首页",
			en: "Back to Home"
		}
	});

	return (
		<>
		<main className="flex flex-col justify-center p-8 text-center">
			<section>
				<h1 className="text-2xl font-bold my-4 text-gray-900 dark:text-gray-100">{t.title}</h1>
				<p className="text-gray-700 dark:text-gray-300">{t.description}</p>
				<Button asChild className="my-4 mx-auto">
					<Link href={`/${locale}/`}>
						{t.backHome}
					</Link>
				</Button>
			</section>
		</main>
		</>
	);
}
