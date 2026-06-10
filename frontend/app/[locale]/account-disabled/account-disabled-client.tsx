"use client";

import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";

export default function AccountDisabledClient() {
	const locale = useLocale();

	const t = getTranslations(locale, {
		title: {
			"zh-Hant": "å¸³è™Ÿå·²åœç”¨",
			"zh-Hans": "è´¦å·å·²åœç”¨",
			en: "Account Disabled"
		},
		message: {
			"zh-Hant": "æ²’æœ‰æ‰¾åˆ°æ­¤å¸³è™Ÿï¼Œè«‹å˜—è©¦é‡æ–°ç™»å…¥ã€‚",
			"zh-Hans": "æœªæ‰¾åˆ°æ­¤è´¦å·ï¼Œè¯·å°è¯•é‡æ–°ç™»å½•ã€‚",
			en: "Account not found, please try logging in again."
		}
	});

	return (
		<div className="flex flex-col items-center justify-center h-full">
			<h1 className="text-2xl font-bold mb-4">{t.title}</h1>
			<p>{t.message}</p>
		</div>
	);
}
