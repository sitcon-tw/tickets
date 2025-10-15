"use client";

import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";
import FallingText from "@/components/FallingText";

export default function AccountDisabled() {
	const locale = useLocale();

	const t = getTranslations(locale, {
		message: {
			"zh-Hant": "您的 帳號 已 被 停用 ， 目前 無法 存取 系 統 功 能 。",
			"zh-Hans": "您的 账号 已 被 停用 ， 目前 无法 访问 系 统 功 能 。",
			en: "Your account has been disabled and you cannot access the system at this time."
		},
	});

	return (
		<>
			<div className="max-w-6xl h-screen" style={{ margin: "2rem auto", marginTop: "16rem", marginBottom: "-16rem", padding: "0 1rem", textAlign: "center" }}>
				<FallingText
					text={t.message}
					highlightWords={["停用", "停用", "disabled"]}
					trigger="click"
					backgroundColor="transparent"
					wireframes={false}
					gravity={0.4}
					fontSize="4rem"
					mouseConstraintStiffness={0.9}
				/>
			</div>
		</>
	);
}
