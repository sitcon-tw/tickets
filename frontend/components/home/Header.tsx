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
		<section
			style={{
				paddingTop: "5rem",
				textAlign: "center"
			}}
		>
			<h1
				style={{
					fontSize: "2.5rem",
					marginBottom: "1rem",
					fontWeight: "bold"
				}}
			>
				{loading ? <PageSpinner size={32} /> : eventName}{" "}
				<span
					style={{
						display: "block",
						fontSize: "0.8em"
					}}
				>
					{t.description}
				</span>
			</h1>
			<p
				style={{
					fontSize: "1.2rem"
				}}
			>
				{t.signFront}
				<span
					style={{
						fontWeight: "bold",
						fontSize: "1.5em"
					}}
				>
					{loading ? "..." : registrationCount}
				</span>
				{t.signBack}
			</p>
		</section>
	);
}
