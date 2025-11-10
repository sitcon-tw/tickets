"use client";

import PageSpinner from "@/components/PageSpinner";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { Link } from "@/i18n/navigation";
import { eventsAPI } from "@/lib/api/endpoints";
import { Event } from "@/lib/types/api";
import { getLocalizedText } from "@/lib/utils/localization";
import { Calendar, MapPin } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

export default function EventList() {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);

	const t = getTranslations(locale, {
		title: {
			"zh-Hant": "活動列表",
			"zh-Hans": "活动列表",
			en: "Events"
		},
		noEvents: {
			"zh-Hant": "目前沒有活動",
			"zh-Hans": "目前没有活动",
			en: "No events available"
		},
		loading: {
			"zh-Hant": "載入中...",
			"zh-Hans": "载入中...",
			en: "Loading..."
		}
	});

	useEffect(() => {
		async function fetchEvents() {
			try {
				const eventsData = await eventsAPI.getAll({ isActive: true });

				if (eventsData?.success && Array.isArray(eventsData.data)) {
					// Sort events by start date (upcoming first, then past events)
					const now = new Date();
					const sortedEvents = eventsData.data.sort((a, b) => {
						const aStart = new Date(a.startDate);
						const bStart = new Date(b.startDate);
						
						const aIsUpcoming = aStart >= now;
						const bIsUpcoming = bStart >= now;
						
						// Prioritize upcoming events
						if (aIsUpcoming && !bIsUpcoming) return -1;
						if (!aIsUpcoming && bIsUpcoming) return 1;
						
						// For events in the same category (both upcoming or both past)
						if (aIsUpcoming) {
							// For upcoming events, sort by nearest first
							return aStart.getTime() - bStart.getTime();
						} else {
							// For past events, sort by most recent first
							return bStart.getTime() - aStart.getTime();
						}
					});
					
					setEvents(sortedEvents);
				}
			} catch (error) {
				showAlert("Failed to fetch events.", "error");
			} finally {
				setLoading(false);
			}
		}

		fetchEvents();
	}, [showAlert]);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString(locale, {
			year: "numeric",
			month: "long",
			day: "numeric"
		});
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-16">
				<PageSpinner size={48} />
				<p className="mt-4 text-muted-foreground">{t.loading}</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-12">
			<h2 className="text-3xl font-bold text-center mb-12">{t.title}</h2>
			
			{events.length === 0 ? (
				<div className="text-center text-muted-foreground py-12">
					<p className="text-xl">{t.noEvents}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{events.map(event => {
						const eventSlug = event.id.slice(-6);
						const eventName = getLocalizedText(event.name, locale);
						const eventDescription = event.plainDescription 
							? getLocalizedText(event.plainDescription, locale)
							: event.description 
							? getLocalizedText(event.description, locale)
							: "";

						return (
							<Link
								key={event.id}
								href={`/${eventSlug}`}
								className="group block rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
							>
								{event.ogImage && (
									<div className="relative w-full h-48 bg-muted overflow-hidden">
										<img
											src={event.ogImage}
											alt={eventName}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
										/>
									</div>
								)}
								
								<div className="p-6">
									<h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
										{eventName}
									</h3>
									
									{eventDescription && (
										<p className="text-muted-foreground mb-4 line-clamp-2">
											{eventDescription}
										</p>
									)}
									
									<div className="space-y-2 text-sm text-muted-foreground">
										<div className="flex items-center gap-2">
											<Calendar size={16} />
											<span>{formatDate(event.startDate)}</span>
										</div>
										
										{event.location && (
											<div className="flex items-center gap-2">
												<MapPin size={16} />
												<span>{event.location}</span>
											</div>
										)}
									</div>
								</div>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}
