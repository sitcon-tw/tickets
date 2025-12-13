"use client";

import PageSpinner from "@/components/PageSpinner";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { eventsAPI, ticketsAPI } from "@/lib/api/endpoints";
import { Ticket } from "@/lib/types/api";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function SetTicket() {
	const { showAlert } = useAlert();
	const locale = useLocale();
	const router = useRouter();
	const params = useParams();

	const [isLoading, setLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	const t = getTranslations(locale, {
		ticketSaleEnded: {
			"zh-Hant": "票券銷售已結束。",
			"zh-Hans": "票券销售已结束。",
			en: "Ticket sale has ended."
		},
		ticketSoldOut: {
			"zh-Hant": "票券已售完。",
			"zh-Hans": "票券已售完。",
			en: "Ticket is sold out."
		},
		error: {
			"zh-Hant": "發生錯誤，請稍後再試。",
			"zh-Hans": "发生错误，请稍后再试。",
			en: "An error occurred. Please try again later."
		},
		redirecting: {
			"zh-Hant": "正在重新導向...",
			"zh-Hans": "正在重定向...",
			en: "Redirecting..."
		},
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
		loadFailed: {
			"zh-Hant": "載入失敗",
			"zh-Hans": "载入失败",
			en: "Load failed"
		},
		ticketNotFound: {
			"zh-Hant": "找不到票券",
			"zh-Hans": "找不到票券",
			en: "Ticket not found"
		}
	});

	const isTicketExpired = (ticket: Ticket): boolean => {
		if (!ticket.saleEnd) return false;
		const saleEndDate = typeof ticket.saleEnd === "string" && ticket.saleEnd !== "N/A" ? new Date(ticket.saleEnd) : null;
		if (!saleEndDate) return false;
		return saleEndDate < new Date();
	};

	const isTicketSoldOut = (ticket: Ticket): boolean => {
		return ticket.available !== undefined && ticket.available <= 0;
	};

	const fetchEvent = useCallback(async () => {
		const eventSlug = params.event as string;
		try {
			const eventsData = await eventsAPI.getAll();

			if (eventsData?.success && Array.isArray(eventsData.data)) {
				const foundEvent = eventsData.data.find(e => e.slug === eventSlug || e.id.slice(-6) === eventSlug);

				if (foundEvent) {
					return foundEvent.id;
				} else {
					showAlert(t.eventNotFound, "error");
					setHasError(true);
				}
			} else {
				showAlert(t.loadFailed, "error");
				setHasError(true);
			}
		} catch (err) {
			showAlert(t.loadFailed, "error");
			setHasError(true);
		}
	}, [params.event, showAlert, t.eventNotFound, t.loadFailed]);

	const fetchTicket = useCallback(async () => {
		const ticketId = params.ticket as string;
		try {
			const ticketData = await ticketsAPI.getTicket(ticketId);

			if (ticketData?.success && ticketData.data) {
				const foundTicket = ticketData.data;

				if (foundTicket) {
					return foundTicket;
				} else {
					showAlert(t.ticketNotFound, "error");
					setHasError(true);
				}
			} else {
				showAlert(t.loadFailed, "error");
				setHasError(true);
			}
		} catch (err) {
			showAlert(t.loadFailed, "error");
			setHasError(true);
		} finally {
			setLoading(false);
		}
	}, [params.ticket, showAlert, t.loadFailed, t.ticketNotFound]);

	const handleTicketSelect = useCallback(
		(ticket: Ticket, eventId: string) => {
			if (isTicketExpired(ticket)) {
				showAlert(t.ticketSaleEnded, "warning");
				return;
			}

			if (isTicketSoldOut(ticket)) {
				showAlert(t.ticketSoldOut, "warning");
				return;
			}

			const referralCode = new URLSearchParams(window.location.search).get("ref");
			const invitationCode = new URLSearchParams(window.location.search).get("inv");

			try {
				const formData = {
					ticketId: ticket.id,
					eventId: eventId,
					referralCode: referralCode || localStorage.getItem("referralCode") || undefined,
					invitationCode: invitationCode || localStorage.getItem("invitationCode") || undefined
				};
				localStorage.setItem("formData", JSON.stringify(formData));
			} catch (error) {
				console.warn("Unable to access localStorage", error);
			}
		},
		[t.ticketSaleEnded, t.ticketSoldOut, showAlert]
	);

	useEffect(() => {
		const event = fetchEvent();
		const ticket = fetchTicket();

		Promise.all([event, ticket]).then(values => {
			const [eventId, ticketData] = values;
			if (eventId && ticketData) {
				handleTicketSelect(ticketData, eventId);
				router.push(`/${params.event}/form`);
			} else {
				setLoading(false);
			}
		});
	}, [fetchEvent, fetchTicket, handleTicketSelect, params.event, router]);

	return (
		<>
			{isLoading || !hasError ? (
				<main>
					<div className="flex items-center justify-center h-screen">
						<PageSpinner />
					</div>
				</main>
			) : (
				<main className="h-screen flex flex-col items-center justify-center">
					<h1 className="text-4xl font-bold mb-4 text-center text-foreground">{t.eventNotFound}</h1>
					<p className="text-center text-muted-foreground">{t.tryToDebug}</p>
				</main>
			)}
		</>
	);
}
