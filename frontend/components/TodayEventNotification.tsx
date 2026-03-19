"use client";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { eventsAPI, registrationsAPI } from "@/lib/api/endpoints";
import { getLocalizedText } from "@/lib/utils/localization";
import { nowInUTC8, toUTC8 } from "@/lib/utils/timezone";
import { Calendar, X } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function lsKey(slug: string) {
	return `today_notif_hide_${slug}`;
}

function isHiddenForever(slug: string): boolean {
	return typeof window !== "undefined" && localStorage.getItem(lsKey(slug)) === "1";
}

interface TodayEvent {
	eventName: string;
	eventSlug: string;
}

function isTodayInRange(startDate: Date, endDate: Date): boolean {
	const now = nowInUTC8();
	const start = toUTC8(startDate);
	const end = toUTC8(endDate);

	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
	const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

	return today >= startDay && today <= endDay;
}

export default function TodayEventNotification() {
	const locale = useLocale();
	const router = useRouter();

	const pathname = usePathname();
	const [todayEvents, setTodayEvents] = useState<TodayEvent[]>([]);
	const [visible, setVisible] = useState(false);
	const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

	useEffect(() => {
		if (pathname.endsWith("/success")) {
			setVisible(false);
			setLoadingSlug(null);
		}
	}, [pathname]);

	const t = getTranslations(locale, {
		title: {
			"zh-Hant": "您今天有活動！",
			"zh-Hans": "您今天有活动！",
			en: "You have an event today!"
		},
		message: {
			"zh-Hant": "點擊按鈕前往報到",
			"zh-Hans": "点击按钮前往报到",
			en: "Click the button below to check in"
		},
		checkIn: {
			"zh-Hant": "前往報到",
			"zh-Hans": "前往报到",
			en: "Check In"
		},
		dontShowAgain: {
			"zh-Hant": "不再顯示",
			"zh-Hans": "不再显示",
			en: "Don't show again"
		},
		close: {
			"zh-Hant": "關閉",
			"zh-Hans": "关闭",
			en: "Close"
		}
	});

	useEffect(() => {
		const load = async () => {
			try {
				const [registrationsRes, eventsRes] = await Promise.all([registrationsAPI.getAll(), eventsAPI.getAll()]);

				const found: TodayEvent[] = [];

				for (const reg of registrationsRes.data) {
					if (reg.status === "cancelled") continue;
					const event = reg.event;
					if (!event) continue;
					if (!isTodayInRange(new Date(event.startDate), new Date(event.endDate))) continue;

					const publicEvent = eventsRes.data.find(e => e.id === event.id);
					const slug = publicEvent?.slug || event.id.slice(-6);

					if (isHiddenForever(slug)) continue;

					const name = getLocalizedText(event.name, locale) || slug;
					found.push({ eventName: name, eventSlug: slug });
				}

				if (found.length > 0) {
					setTodayEvents(found);
					setVisible(true);
				}
			} catch {
				// Silently fail — user may not be logged in
			}
		};

		load();
	}, [locale]);

	function hideForever(slug: string) {
		localStorage.setItem(lsKey(slug), "1");
		const remaining = todayEvents.filter(e => e.eventSlug !== slug);
		setTodayEvents(remaining);
		if (remaining.length === 0) setVisible(false);
	}

	if (!visible || todayEvents.length === 0) return null;

	return (
		<div className="fixed bottom-20 right-4 z-40 w-[calc(100%-2rem)] max-w-sm sm:w-80">
			<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4">
				<div className="flex items-start justify-between gap-2">
					<div className="flex items-start gap-2">
						<Calendar size={20} className="text-blue-500 shrink-0 mt-0.5" />
						<div>
							<p className="font-semibold text-gray-900 dark:text-gray-100 leading-snug">{t.title}</p>
							<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.message}</p>
						</div>
					</div>
					<button onClick={() => setVisible(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0 mt-0.5" aria-label={t.close}>
						<X size={16} />
					</button>
				</div>

				<div className="mt-3 flex flex-col gap-3">
					{todayEvents.map(event => (
						<div key={event.eventSlug} className="flex flex-col gap-1.5">
							<Button
								size="sm"
								className="w-full"
								isLoading={loadingSlug === event.eventSlug}
								onClick={() => {
									setLoadingSlug(event.eventSlug);
									router.push(`/${event.eventSlug}/success?checkin`);
								}}
							>
								{event.eventName} — {t.checkIn}
							</Button>
							<button onClick={() => hideForever(event.eventSlug)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-center underline underline-offset-2 w-full">
								{t.dontShowAgain}
							</button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
