"use client";

import Header from "@/components/home/Header";
import Info from "@/components/home/Info";
import Tickets from "@/components/home/Tickets";
import Welcome from "@/components/home/Welcome";
import PageSpinner from "@/components/PageSpinner";
import { getTranslations } from "@/i18n/helpers";
import { eventsAPI } from "@/lib/api/endpoints";
import { EventListItem } from "@/lib/types/api";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Main() {
	const params = useParams();
	const router = useRouter();
	const locale = useLocale();
	const eventSlug = params.event as string;

	const [event, setEvent] = useState<EventListItem | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const t = getTranslations(locale, {
		loading: {
			"zh-Hant": "載入中...",
			"zh-Hans": "载入中...",
			en: "Loading..."
		},
		eventNotFound: {
			"zh-Hant": "找不到活動",
			"zh-Hans": "找不到活动",
			en: "Event not found"
		},
		failedToLoadEvents: {
			"zh-Hant": "載入活動失敗",
			"zh-Hans": "载入活动失败",
			en: "Failed to load events"
		}
	});

	useEffect(() => {
		async function fetchEvent() {
			try {
				const eventsData = await eventsAPI.getAll();

				if (eventsData?.success && Array.isArray(eventsData.data)) {
					const foundEvent = eventsData.data.find(e => e.id.slice(-6) === eventSlug);

					if (foundEvent) {
						setEvent(foundEvent);
					} else {
						setError(t.eventNotFound);
					}
				} else {
					setError(t.failedToLoadEvents);
				}
			} catch (err) {
				console.error("Failed to load event:", err);
				setError(t.failedToLoadEvents);
			} finally {
				setLoading(false);
			}
		}

		fetchEvent();

		const urlParams = new URLSearchParams(window.location.search);
		const referralCode = urlParams.get("ref");
		const invitationCode = urlParams.get("inv");

		if (referralCode) {
			localStorage.setItem("referralCode", referralCode);
			router.refresh();
		}
		if (invitationCode) {
			localStorage.setItem("invitationCode", invitationCode);
			router.refresh();
		}
	}, [eventSlug, router, t.eventNotFound, t.failedToLoadEvents]);

	if (loading || 1) {
		return (
			<>
					<PageSpinner size={48} />
			</>
		);
	}

	if (error || !event) {
		return (
			<>
				<main>
					<div className="flex flex-col items-center justify-center h-full gap-4">
						<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.eventNotFound}</h1>
						<p className="text-gray-700 dark:text-gray-300">{error}</p>
					</div>
				</main>
			</>
		);
	}

	return (
		<>
			<main>
				<Header eventId={event.id} />
				<Welcome eventId={event.id} eventSlug={eventSlug} />
				<Tickets eventId={event.id} eventSlug={eventSlug} />
				<Info eventId={event.id} />
			</main>
		</>
	);
}
