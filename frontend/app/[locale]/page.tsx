"use client";

import PageSpinner from "@/components/PageSpinner";
import { eventsAPI } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAlert } from "@/contexts/AlertContext";

export default function LocaleRedirect() {
	const router = useRouter();
	const locale = useLocale();
	const { showAlert } = useAlert();

	useEffect(() => {
		async function redirectToNearestEvent() {
			try {
				const eventsData = await eventsAPI.getAll({ isActive: true });

				if (eventsData?.success && Array.isArray(eventsData.data)) {
					if (eventsData.data.length === 0) {
						router.replace(`/${locale}/hi`);
					}

					const now = new Date();

					const upcomingEvents = eventsData.data.filter(event => {
						const startDate = new Date(event.startDate);
						return startDate >= now;
					});

					const sortedEvents = upcomingEvents.sort((a, b) => {
						return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
					});

					if (sortedEvents.length > 0) {
						const nearestEvent = sortedEvents[0];
						const eventSlug = nearestEvent.id.slice(-6);
						router.replace(`/${locale}/${eventSlug}`);
					} else {
						const pastEvents = eventsData.data.sort((a, b) => {
							return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
						});

						if (pastEvents.length > 0) {
							const latestEvent = pastEvents[0];
							const eventSlug = latestEvent.id.slice(-6);
							router.replace(`/${locale}/${eventSlug}`);
						}
					}
				}
			} catch (error) {
				showAlert("Failed to fetch events for redirection.", "error");
			}
		}

		redirectToNearestEvent();
	}, [router, locale]);

	return (
		<>
			<main>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						height: "100vh"
					}}
				>
					<PageSpinner size={48} />
				</div>
			</main>
		</>
	);
}
