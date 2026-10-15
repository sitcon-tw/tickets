"use client";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { authAPI } from "@/lib/api/endpoints";
import { UserX } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";

type Destination = "login" | "home";

export default function AccountDisabledClient() {
	const locale = useLocale();
	const [leavingTo, setLeavingTo] = useState<Destination | null>(null);

	const t = getTranslations(locale, {
		title: {
			"zh-Hant": "帳號已停用",
			en: "Account Disabled"
		},
		message: {
			"zh-Hant": "您的帳號已被停用或已不存在，因此無法使用需要登入的功能。如有疑問，請聯絡活動主辦單位。",
			en: "Your account has been disabled or no longer exists, so features that require signing in are unavailable. If you think this is a mistake, please contact the event organizers."
		},
		switchAccount: {
			"zh-Hant": "登出並使用其他帳號登入",
			en: "Log out and sign in with another account"
		},
		backToHome: {
			"zh-Hant": "登出並返回首頁",
			en: "Log out and go to the home page"
		}
	});

	// Both ways out sign out first: with the disabled session still active, the next authenticated request would bring the visitor straight back here.
	async function leave(destination: Destination) {
		if (leavingTo) return;
		setLeavingTo(destination);
		try {
			await authAPI.signOut();
		} catch (error) {
			console.error("Logout failed", error);
		}
		// Full navigation so the nav and server components drop the old session
		window.location.href = destination === "login" ? `/${locale}/login` : `/${locale}/`;
	}

	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
			<UserX className="size-10 text-muted-foreground" aria-hidden="true" />
			<h1 className="text-2xl font-bold">{t.title}</h1>
			<p className="max-w-md text-muted-foreground">{t.message}</p>
			<div className="mt-4 flex flex-col gap-3 sm:flex-row">
				<Button onClick={() => leave("login")} isLoading={leavingTo === "login"} disabled={leavingTo !== null}>
					{t.switchAccount}
				</Button>
				<Button variant="outline" onClick={() => leave("home")} isLoading={leavingTo === "home"} disabled={leavingTo !== null}>
					{t.backToHome}
				</Button>
			</div>
		</div>
	);
}
