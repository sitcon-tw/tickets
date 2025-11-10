"use client";

import PageSpinner from "@/components/PageSpinner";
import { getTranslations } from "@/i18n/helpers";
import { eventsAPI } from "@/lib/api/endpoints";
import { getLocalizedText } from "@/lib/utils/localization";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

interface HeaderProps {
	eventId: string;
}

export default function Header({ eventId }: HeaderProps) {
	const locale = useLocale();

	const [eventName, setEventName] = useState<string>("");
	const [registrationCount, setRegistrationCount] = useState<number>(0);
	const [loading, setLoading] = useState(true);

	const t = getTranslations(locale, {
		description: {
			"zh-Hant": "報名系統",
			"zh-Hans": "报名系统",
			en: "Registration System"
		},
		signFront: {
			"zh-Hant": "已有 ",
			"zh-Hans": "已有 ",
			en: " "
		},
		signBack: {
			"zh-Hant": " 人報名",
			"zh-Hans": " 人报名",
			en: " already registered"
		}
	});

	useEffect(() => {
		async function fetchEventInfo() {
			try {
				const eventData = await eventsAPI.getInfo(eventId);
				if (eventData?.success && eventData.data) {
					setEventName(getLocalizedText(eventData.data.name, locale));
				}

				const statsData = await eventsAPI.getStats(eventId);
				if (statsData?.success && statsData.data) {
					setRegistrationCount(statsData.data.confirmedRegistrations);
				}
			} catch (error) {
				console.error("Failed to load event info:", error);
			} finally {
				setLoading(false);
			}
		}

		fetchEventInfo();
	}, [eventId, locale]);

	return (
		<section className="pt-20 text-center">
			<h1 className="text-4xl mb-4 font-bold text-gray-900 dark:text-gray-100">
				{loading ? <PageSpinner /> : eventName} <span className="block text-[0.8em] text-gray-700 dark:text-gray-300">{t.description}</span>
			</h1>
			<p className="text-xl text-gray-800 dark:text-gray-200">
				{t.signFront}
				<span className="font-bold text-[1.5em]">{loading ? "..." : registrationCount}</span>
				{t.signBack}
			</p>
		</section>
	);
}
