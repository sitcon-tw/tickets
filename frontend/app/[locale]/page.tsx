"use client";

import PageSpinner from "@/components/PageSpinner";
import { eventsAPI } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LocaleRedirect() {
	const router = useRouter();
	const locale = useLocale();

	useEffect(() => {
		async function redirectToNearestEvent() {
			try {
				const eventsData = await eventsAPI.getAll({ isActive: true });

				if (eventsData?.success && Array.isArray(eventsData.data)) {
          if (eventsData.data.length === 0) {
            router.replace(`/${locale}/hi`);
          }

					const now = new Date();

					// Filter upcoming events (events that haven't started yet or are currently happening)
					const upcomingEvents = eventsData.data.filter(event => {
						const startDate = new Date(event.startDate);
						return startDate >= now;
					});

					// Sort by start date (earliest first)
					const sortedEvents = upcomingEvents.sort((a, b) => {
						return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
					});

					if (sortedEvents.length > 0) {
						const nearestEvent = sortedEvents[0];
						const eventSlug = nearestEvent.id.slice(-6);
						router.replace(`/${locale}/${eventSlug}`);
					} else {
						// If no upcoming events, use the most recent past event
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
				console.error("Failed to redirect to event:", error);
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
