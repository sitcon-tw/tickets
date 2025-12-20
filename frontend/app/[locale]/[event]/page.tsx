"use client";

import Tickets from "@/components/home/Tickets";
import Welcome from "@/components/home/Welcome";
import MarkdownContent from "@/components/MarkdownContent";
import PageSpinner from "@/components/PageSpinner";
import { getTranslations } from "@/i18n/helpers";
import { eventsAPI, opengraphAPI } from "@/lib/api/endpoints";
import { EventListItem, Ticket } from "@/lib/types/api";
import { getLocalizedText } from "@/lib/utils/localization";
import { Calendar, ExternalLink, MapPin, Users } from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const isURL = (str: string): boolean => {
	try {
		const url = new URL(str);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
};

export default function Main() {
	const params = useParams();
	const router = useRouter();
	const locale = useLocale();
	const eventSlug = params.event as string;

	const [event, setEvent] = useState<EventListItem | null>(null);
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [registrationCount, setRegistrationCount] = useState<number>(0);
	const [eventDescription, setEventDescription] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [locationTitle, setLocationTitle] = useState<string | null>(null);
	const [imageSrc, setImageSrc] = useState<string>("");

	const t = getTranslations(locale, {
		eventNotFound: {
			"zh-Hant": "找不到活動",
			"zh-Hans": "找不到活动",
			en: "Event not found"
		},
		failedToLoadEvents: {
			"zh-Hant": "載入活動失敗 :(",
			"zh-Hans": "载入活动失败 :(",
			en: "Failed to load events :("
		},
		tryToDebug: {
			"zh-Hant": "請確認網址正確，或嘗試於稍後重新整理。",
			"zh-Hans": "请确认网址正确，或尝试于稍后重新刷新。",
			en: "Please ensure the URL is correct, or try refreshing later."
		},
		peopleSignedUp: {
			"zh-Hant": "人已報名",
			"zh-Hans": "人已报名",
			en: "people already signed up"
		},
		eventInfo: {
			"zh-Hant": "活動資訊",
			"zh-Hans": "活动资讯",
			en: "Event Information"
		},
		ticketInfo: {
			"zh-Hant": "票券資訊",
			"zh-Hans": "票券资讯",
			en: "Ticket Information"
		}
	});

	useEffect(() => {
		async function fetchEvent() {
			try {
				const eventsData = await eventsAPI.getAll();

				if (eventsData?.success && Array.isArray(eventsData.data)) {
					const foundEvent = eventsData.data.find(e => e.slug === eventSlug || e.id.slice(-6) === eventSlug);

					if (foundEvent) {
						setEvent(foundEvent);

						const eventData = await eventsAPI.getInfo(foundEvent.id);
						if (eventData?.success && eventData.data) {
							setEventDescription(getLocalizedText(eventData.data.description, locale));
						}

						const statsData = await eventsAPI.getStats(foundEvent.id);
						if (statsData?.success && statsData.data) {
							setRegistrationCount(statsData.data.confirmedRegistrations);
						}

						const ticketsData = await eventsAPI.getTickets(foundEvent.id);
						if (ticketsData.success && Array.isArray(ticketsData.data)) {
							setTickets(ticketsData.data);
						}

						if (foundEvent.location && isURL(foundEvent.location)) {
							opengraphAPI
								.getTitle(foundEvent.location)
								.then(result => {
									if (result?.success && result.data?.title) {
										setLocationTitle(result.data.title);
									}
								})
								.catch(() => {});
						}
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
	}, [eventSlug, router, t.eventNotFound, t.failedToLoadEvents, locale]);

	if (loading) {
		return (
			<>
				<PageSpinner />
			</>
		);
	}

	if (error || !event) {
		return (
			<>
				<main className="h-screen flex flex-col items-center justify-center">
					<h1 className="text-4xl font-bold mb-4 text-center text-foreground">{error || t.eventNotFound}</h1>
					<p className="text-center text-muted-foreground">{t.tryToDebug}</p>
				</main>
			</>
		);
	}

	const eventName = getLocalizedText(event.name, locale);
	const coverImage = imageSrc || event.ogImage || "/assets/default.webp";
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
	};

	return (
		<>
			<main className="pt-18 max-w-6xl mx-auto">
				{/* Cover Image */}
				<div className="relative w-full aspect-video max-h-96 overflow-hidden shadow-lg rounded-b-2xl md:rounded-b-3xl">
					<Image src={coverImage} alt={eventName} fill className="object-cover" priority onError={() => setImageSrc("/assets/default.webp")} />
				</div>

				{/* Main Container with Shadow */}
				<div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="bg-background shadow-2xl rounded-b-xl overflow-hidden">
						{/* Event Info & Welcome - Two containers with rounded bottom */}
						<div className="flex flex-col lg:flex-row lg:gap-8 lg:px-16 sm:px-8">
							{/* Left: Basic Info */}
							<div className="p-6 md:p-8 m-4 mb-0  md:m-0 lg:shadow-lg rounded-t-2xl lg:rounded-b-4xl lg:rounded-t-none bg-gray-100 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 z-10">
								<h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{eventName}</h1>
								<div className="space-y-3 text-muted-foreground">
									<div className="flex items-center gap-3">
										<Calendar size={20} className="shrink-0" />
										<span className="text-base">
											{formatDate(event.startDate)}
											{event.endDate && event.endDate !== event.startDate && ` - ${formatDate(event.endDate)}`}
										</span>
									</div>

									{event.location && (
										<div className="flex items-center gap-3">
											<MapPin size={20} className="shrink-0" />
											{isURL(event.location) ? (
												<a href={event.location} target="_blank" rel="noopener noreferrer" className="text-base hover:underline text-blue-500 dark:text-blue-400 flex items-center">
													{locationTitle || event.location}
													<ExternalLink size={16} className="ml-1" />
												</a>
											) : (
												<span className="text-base">{event.location}</span>
											)}
										</div>
									)}

									<div className="flex items-center gap-3 pt-2">
										<Users size={24} className="shrink-0" />
										<div>
											<span className="text-4xl font-bold text-foreground">{registrationCount}</span>
											<span className="text-base ml-2">{t.peopleSignedUp}</span>
										</div>
									</div>
								</div>
							</div>

							{/* Right: Welcome Box */}
							<div className="p-8 m-4 mt-0 md:m-0 shadow-lg rounded-b-4xl bg-gray-200 dark:bg-gray-800 h-fit md-mt-8 pt-16 lg:mt-0 lg:pt-8 flex-1">
								<Welcome eventId={event.id} eventSlug={eventSlug} />
							</div>
						</div>

						{/* Tickets Grid */}
						<div className="p-6 md:p-8 border-b border-border">
							<Tickets eventId={event.id} eventSlug={eventSlug} />
						</div>

						{/* Event Information - No border */}
						{eventDescription && (
							<div className="p-6 md:p-8 border-b border-border">
								<h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">{t.eventInfo}</h2>
								<div className="prose prose-lg dark:prose-invert max-w-none">
									<MarkdownContent content={eventDescription} />
								</div>
							</div>
						)}

						{/* Ticket Information - No border, but borders on individual tickets */}
						{tickets.length > 0 && (
							<div className="p-6 md:p-8">
								<h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">{t.ticketInfo}</h2>
								<div className="space-y-6">
									{tickets.map(ticket => (
										<div key={ticket.id} className="border border-border rounded-lg p-6">
											<h3 className="text-xl font-bold mb-3 text-foreground">{getLocalizedText(ticket.name, locale)}</h3>
											<div className="prose dark:prose-invert max-w-none">
												<MarkdownContent content={getLocalizedText(ticket.description, locale)} />
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</main>
		</>
	);
}
