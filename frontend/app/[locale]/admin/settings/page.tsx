"use client";

import { EmptyState } from "@/components/admin/EmptyState";
import AdminHeader from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminSettingsAPI } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@sitcontix/types";
import { Settings } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";

function Toggle({ checked, disabled, onChange, label }: { checked: boolean; disabled?: boolean; onChange: () => void; label: string }) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			onClick={onChange}
			className={cn(
				"relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
				checked ? "bg-primary" : "bg-input"
			)}
		>
			<span className={cn("pointer-events-none block size-5 rounded-full bg-background shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
		</button>
	);
}

export default function SettingsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const t = getTranslations(locale, {
		title: { "zh-Hant": "網站設定", "zh-Hans": "网站设置", en: "Site Settings" },
		description: { "zh-Hant": "調整整個網站的行為", "zh-Hans": "调整整个网站的行为", en: "Adjust site-wide behavior" },
		redirectTitle: { "zh-Hant": "首頁直接前往第一個活動", "zh-Hans": "首页直接前往第一个活动", en: "Redirect homepage to the first event" },
		redirectDesc: {
			"zh-Hant": "開啟後，訪客進入首頁時會直接跳轉到活動列表中的第一個活動頁面（即時間最近的即將舉辦活動）。若沒有任何公開活動，仍會顯示首頁。",
			"zh-Hans": "开启后，访客进入首页时会直接跳转到活动列表中的第一个活动页面（即时间最近的即将举办活动）。若没有任何公开活动，仍会显示首页。",
			en: "When enabled, visitors who open the homepage are sent straight to the first event in the event list (the nearest upcoming event). If there are no public events, the homepage is shown as usual."
		},
		loadFailed: { "zh-Hant": "無法載入網站設定", "zh-Hans": "无法载入网站设置", en: "Failed to load site settings" },
		tryAgain: { "zh-Hant": "重試", "zh-Hans": "重试", en: "Try again" },
		updateFailed: { "zh-Hant": "更新設定失敗", "zh-Hans": "更新设置失败", en: "Failed to update settings" },
		enabledToast: { "zh-Hant": "已開啟首頁自動跳轉", "zh-Hans": "已开启首页自动跳转", en: "Homepage redirect enabled" },
		disabledToast: { "zh-Hant": "已關閉首頁自動跳轉", "zh-Hans": "已关闭首页自动跳转", en: "Homepage redirect disabled" }
	});

	const [settings, setSettings] = useState<SiteSettings | null>(null);
	const [loadError, setLoadError] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const load = useCallback(async () => {
		setLoadError(false);
		try {
			const response = await adminSettingsAPI.get();
			if (response.success && response.data) {
				setSettings(response.data);
				return;
			}
		} catch (error) {
			console.error("Failed to load site settings:", error);
		}
		setLoadError(true);
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const handleToggleRedirect = async () => {
		if (!settings) return;
		const next = !settings.redirectHomeToFirstEvent;

		setIsSaving(true);
		try {
			const response = await adminSettingsAPI.update({ redirectHomeToFirstEvent: next });
			if (response.success && response.data) {
				setSettings(response.data);
				showAlert(next ? t.enabledToast : t.disabledToast, "success");
			} else {
				showAlert(t.updateFailed, "error");
			}
		} catch {
			showAlert(t.updateFailed, "error");
		} finally {
			setIsSaving(false);
		}
	};

	let body;
	if (loadError) {
		body = (
			<EmptyState
				icon={Settings}
				title={t.loadFailed}
				action={
					<Button variant="outline" size="sm" onClick={() => void load()}>
						{t.tryAgain}
					</Button>
				}
			/>
		);
	} else if (!settings) {
		body = <div className="h-24 animate-pulse rounded-xl border bg-muted/40" aria-busy="true" />;
	} else {
		body = (
			<section className="rounded-xl border bg-card">
				<div className="flex items-start justify-between gap-4 p-4 sm:p-6">
					<div className="min-w-0 space-y-1">
						<h2 className="text-lg font-semibold">{t.redirectTitle}</h2>
						<p className="text-sm text-muted-foreground">{t.redirectDesc}</p>
					</div>
					<Toggle checked={settings.redirectHomeToFirstEvent} disabled={isSaving} onChange={() => void handleToggleRedirect()} label={t.redirectTitle} />
				</div>
			</section>
		);
	}

	return (
		<main>
			<AdminHeader title={t.title} description={t.description} />
			{body}
		</main>
	);
}
