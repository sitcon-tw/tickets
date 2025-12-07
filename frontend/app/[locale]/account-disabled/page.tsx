"use client";
import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";

export default function AccountDisabled() {
	const locale = useLocale();

	const t = getTranslations(locale, {
		title: {
			"zh-Hant": "帳號已停用",
			"zh-Hans": "账号已停用",
			en: "Account Disabled"
		},
		message: {
			"zh-Hant": "沒有找到此帳號，請嘗試重新登入。",
			"zh-Hans": "未找到此账号，请尝试重新登录。",
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
