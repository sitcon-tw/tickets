"use client";

import PageSpinner from "@/components/PageSpinner";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { eventsAPI } from "@/lib/api/endpoints";
import { getLocalizedText } from "@/lib/utils/localization";
import { formatEventDateRange } from "@/lib/utils/timezone";
import { PublicEventListItem } from "@sitcontix/types";
import { Calendar, ExternalLink, MapPin } from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function EventList() {
	const locale = useLocale();
	const router = useRouter();
	const { showAlert } = useAlert();
	const [events, setEvents] = useState<PublicEventListItem[]>([]);
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
		}
	});

	useEffect(() => {
		async function fetchEvents() {
			try {
				const eventsData = await eventsAPI.getAll({ isActive: true });

				if (eventsData?.success && Array.isArray(eventsData.data)) {
					const now = new Date();
					// Note: Backend already filters out hidden events (hideEvent: false)
					const sortedEvents = eventsData.data.sort((a, b) => {
						const aIsUpcoming = a.startDate >= now;
						const bIsUpcoming = b.startDate >= now;

						if (aIsUpcoming && !bIsUpcoming) return -1;
						if (!aIsUpcoming && bIsUpcoming) return 1;

						if (aIsUpcoming) {
							return a.startDate.getTime() - b.startDate.getTime();
						} else {
							return b.startDate.getTime() - a.startDate.getTime();
						}
					});

					setEvents(sortedEvents);
					setLoading(false);
				}
			} catch {
				showAlert("Failed to fetch events.", "error");
				setLoading(false);
			}
		}

		fetchEvents();
	}, [showAlert]);

	const formatDate = (startDate: Date, endDate: Date) => {
		return formatEventDateRange(startDate, endDate);
	};

	if (loading) {
		return (
			<div className="pt-12">
				<PageSpinner />
			</div>
		);
	}

	return (
		<div className="container mx-auto">
			{events.length === 0 ? (
				<div className="text-center text-muted-foreground py-12">
					<p className="text-xl">{t.noEvents}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{events.map(event => {
						// Use custom slug if available, otherwise fallback to last 6 chars of ID
						const eventSlug = event.slug || event.id.slice(-6);
						const eventName = getLocalizedText(event.name, locale);
						const eventDescription = event.plainDescription ? getLocalizedText(event.plainDescription, locale) : event.description ? getLocalizedText(event.description, locale) : "";
						const locationText = getLocalizedText(event.locationText, locale);
						event.ogImage = event.ogImage || "/assets/default.webp";

						return (
							<div
								key={event.id}
								onClick={() => router.push(`/${eventSlug}`)}
								className="group block rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
							>
								<div className="relative w-full h-48 bg-muted overflow-hidden">
									<Image
										src={event.ogImage}
										alt={eventName}
										width={600}
										height={200}
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 bg-gray-300 text-transparent"
									/>
								</div>

								<div className="p-6">
									<h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{eventName}</h3>

									{eventDescription && <p className="text-muted-foreground mb-4 line-clamp-2">{eventDescription}</p>}

									<div className="space-y-2 text-sm text-muted-foreground">
										<div className="flex items-center gap-2">
											<Calendar size={16} />
											<span>{formatDate(event.startDate, event.endDate)}</span>
										</div>

										{locationText && (
											<div className="flex items-center gap-2">
												<MapPin size={16} />
												{event.mapLink ? (
													<a
														href={event.mapLink}
														target="_blank"
														rel="noopener noreferrer"
														className="hover:underline text-blue-500 dark:text-blue-400 flex items-center"
														onClick={e => e.stopPropagation()}
													>
														{locationText}
														<ExternalLink size={16} className="ml-1" />
													</a>
												) : (
													<span>{locationText}</span>
												)}
											</div>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
