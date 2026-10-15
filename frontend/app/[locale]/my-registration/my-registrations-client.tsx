"use client";

import PageSpinner from "@/components/PageSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { registrationsAPI } from "@/lib/api/endpoints";
import { getLocalizedText } from "@/lib/utils/localization";
import { formatDate, formatTime, isSameDayUTC8 } from "@/lib/utils/timezone";
import { Registration } from "@sitcontix/types";
import { Calendar, Clock, ExternalLink, Eye, MapPin, RefreshCw, Ticket } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const statusClassnames: Record<string, string> = {
	confirmed: "bg-green-300 dark:bg-blue-500/80",
	cancelled: "bg-red-300 dark:bg-red-500/80",
	pending: "bg-yellow-300 dark:bg-yellow-500/80"
};

function formatEventDate(startDate: Date, endDate: Date) {
	const isSameDay = isSameDayUTC8(startDate, endDate);

	if (isSameDay) {
		return {
			date: formatDate(startDate),
			time: `${formatTime(startDate)} - ${formatTime(endDate)}`
		};
	}

	return {
		date: `${formatDate(startDate)} - ${formatDate(endDate)}`,
		time: `${formatTime(startDate)} - ${formatTime(endDate)}`
	};
}

export default function MyRegistrationsPage() {
	const locale = useLocale();
	const router = useRouter();
	const { showAlert } = useAlert();
	const [registrations, setRegistrations] = useState<Registration[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadFailed, setLoadFailed] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);
	const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

	const t = getTranslations(locale, {
		title: {
			"zh-Hant": "我的報名",
			en: "My Registrations"
		},
		noRegistrations: {
			"zh-Hant": "您還沒有任何報名記錄",
			en: "You don't have any registrations yet"
		},
		noFilteredRegistrations: {
			"zh-Hant": "沒有符合條件的報名記錄",
			en: "No registrations match this filter"
		},
		loadError: {
			"zh-Hant": "載入報名資料時發生錯誤",
			en: "Failed to load registrations"
		},
		upcoming: {
			"zh-Hant": "即將到來",
			en: "Upcoming"
		},
		past: {
			"zh-Hant": "已結束",
			en: "Past"
		},
		all: {
			"zh-Hant": "全部",
			en: "All"
		},
		confirmed: {
			"zh-Hant": "已確認",
			en: "Confirmed"
		},
		cancelled: {
			"zh-Hant": "已取消",
			en: "Cancelled"
		},
		pending: {
			"zh-Hant": "待處理",
			en: "Pending"
		},
		viewDetails: {
			"zh-Hant": "查看詳情",
			en: "View Details"
		},
		registeredOn: {
			"zh-Hant": "報名於",
			en: "Registered on"
		},
		retry: {
			"zh-Hant": "重試",
			en: "Retry"
		},
		unknownEvent: {
			"zh-Hant": "未知的活動",
			en: "Unknown Event"
		},
		unknownTicket: {
			"zh-Hant": "未知的票種",
			en: "Unknown Ticket"
		}
	});

	useEffect(() => {
		const fetchRegistrations = async () => {
			try {
				setLoading(true);
				setLoadFailed(false);

				const response = await registrationsAPI.getAll();
				setRegistrations(response.data || []);
			} catch (error) {
				console.error("Error fetching registrations:", error);
				setLoadFailed(true);
				showAlert(t.loadError, "error");
			} finally {
				setLoading(false);
			}
		};

		void fetchRegistrations();
	}, [locale, router, showAlert, t.loadError, reloadKey]);

	const handleViewDetails = (id: string) => {
		router.push(`/${locale}/my-registration/${id}?h`);
	};

	if (loading) {
		return <PageSpinner />;
	}

	const statusTranslations: Record<string, string> = {
		confirmed: t.confirmed,
		cancelled: t.cancelled,
		pending: t.pending
	};

	const filteredRegistrations = registrations.filter(reg => {
		if (filter === "upcoming") return reg.isUpcoming;
		if (filter === "past") return reg.isPast;
		return true;
	});

	return (
		<div className="container mx-auto py-10 pt-32 px-4 max-w-6xl">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
				<h1 className="text-3xl font-bold">{t.title}</h1>

				<div className="flex gap-2">
					<Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
						{t.all}
					</Button>
					<Button variant={filter === "upcoming" ? "default" : "outline"} size="sm" onClick={() => setFilter("upcoming")}>
						{t.upcoming}
					</Button>
					<Button variant={filter === "past" ? "default" : "outline"} size="sm" onClick={() => setFilter("past")}>
						{t.past}
					</Button>
				</div>
			</div>

			{loadFailed ? (
				<div className="flex flex-col items-center gap-4 py-12 text-center">
					<p className="text-destructive text-lg">{t.loadError}</p>
					<Button variant="outline" onClick={() => setReloadKey(key => key + 1)}>
						<RefreshCw className="h-4 w-4" />
						{t.retry}
					</Button>
				</div>
			) : registrations.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-muted-foreground text-lg">{t.noRegistrations}</p>
				</div>
			) : filteredRegistrations.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-muted-foreground text-lg">{t.noFilteredRegistrations}</p>
				</div>
			) : (
				<div className="grid gap-4 md:gap-6">
					{filteredRegistrations.map(registration => {
						const eventName = registration.event?.name ? getLocalizedText(registration.event.name, locale) : t.unknownEvent;
						const ticketName = registration.ticket?.name ? getLocalizedText(registration.ticket.name, locale) : t.unknownTicket;
						const locationText = registration.event?.locationText ? getLocalizedText(registration.event.locationText, locale) : null;
						const { date, time } = registration.event?.startDate && registration.event?.endDate ? formatEventDate(registration.event.startDate, registration.event.endDate) : { date: "-", time: "-" };

						return (
							<Card key={registration.id} className="hover:shadow-lg transition-shadow">
								<CardContent className="p-6">
									<div className="flex flex-col lg:flex-row gap-6">
										{/* Left: Time Display */}
										<div className="shrink-0 lg:w-64 bg-primary/5 rounded-lg p-4 flex flex-col items-center justify-center text-center">
											<Calendar className="h-8 w-8 mb-2 text-primary" />
											<div className="text-2xl font-bold mb-1">{date}</div>
											<div className="flex items-center gap-1 text-muted-foreground">
												<Clock className="h-4 w-4" />
												<span className="text-sm">{time}</span>
											</div>
											{registration.isUpcoming && (
												<Badge variant="outline" className="mt-3">
													{t.upcoming}
												</Badge>
											)}
											{registration.isPast && (
												<Badge variant="secondary" className="mt-3">
													{t.past}
												</Badge>
											)}
										</div>

										{/* Right: Event Details */}
										<div className="flex-1 flex flex-col justify-between">
											<div>
												<div className="flex items-start justify-between gap-4 mb-3">
													<h2 className="text-2xl font-bold">{eventName}</h2>
													<div className={`${statusClassnames[registration.status] || "bg-gray-100 text-gray-800"} rounded-md border-2 border-gray-300 dark:border-gray-800 px-4 py-2`}>
														{statusTranslations[registration.status] || registration.status}
													</div>
												</div>

												<div className="space-y-2 mb-4">
													<div className="flex items-center gap-2 text-muted-foreground">
														<Ticket className="h-4 w-4" />
														<span>{ticketName}</span>
													</div>
													{locationText && (
														<div className="flex items-center gap-3">
															<MapPin size={20} className="shrink-0" />
															{registration.event?.mapLink ? (
																<a
																	href={registration.event?.mapLink}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="text-base hover:underline text-blue-500 dark:text-blue-400 flex items-center"
																>
																	{getLocalizedText(locationText, locale)}
																	<ExternalLink size={16} className="ml-1" />
																</a>
															) : (
																<span className="text-base">{getLocalizedText(locationText, locale)}</span>
															)}
														</div>
													)}
												</div>

												<div className="text-sm text-muted-foreground">
													{t.registeredOn}{" "}
													{new Date(registration.createdAt).toLocaleDateString(locale, {
														year: "numeric",
														month: "long",
														day: "numeric"
													})}
												</div>
											</div>

											<div className="flex gap-2 mt-4">
												<Button onClick={() => handleViewDetails(registration.id)} className="flex items-center gap-2">
													<Eye className="h-4 w-4" />
													{t.viewDetails}
												</Button>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
