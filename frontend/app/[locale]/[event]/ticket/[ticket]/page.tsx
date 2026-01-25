"use client";

import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { eventsAPI, invitationCodesAPI, ticketsAPI, ticketSchema } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod/v4";

export default function SetTicket() {
	const { showAlert } = useAlert();
	const locale = useLocale();
	const router = useRouter();
	const params = useParams();

	const [isLoading, setLoading] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [isNotYetAvailable, setIsNotYetAvailable] = useState(false);

	const t = getTranslations(locale, {
		ticketSaleEnded: {
			"zh-Hant": "票券銷售已結束。",
			"zh-Hans": "票券销售已结束。",
			en: "Ticket sale has ended."
		},
		ticketNotYetAvailable: {
			"zh-Hant": "此票種尚未開放報名。您可以先登入，並在開放時間後再試。",
			"zh-Hans": "此票种尚未开放报名。您可以先登录，并在开放时间后再试。",
			en: "This ticket is not yet available for registration. You can log in first and try again after the sale starts."
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
		},
		pleaseLoginFirst: {
			"zh-Hant": "請先登入以查看報名時間",
			"zh-Hans": "请先登录以查看报名时间",
			en: "Please log in first to view registration schedule"
		},
		goToLogin: {
			"zh-Hant": "前往登入",
			"zh-Hans": "前往登录",
			en: "Go to Login"
		},
		ticketUnavailable: {
			"zh-Hant": "票券暫時無法使用",
			"zh-Hans": "票券暂时无法使用",
			en: "Ticket Currently Unavailable"
		},
		backToEvent: {
			"zh-Hant": "返回活動頁面",
			"zh-Hans": "返回活动页面",
			en: "Back to Event"
		},
		inviteCodeRequired: {
			"zh-Hant": "此票券需要邀請碼才能報名。",
			"zh-Hans": "此票券需要邀请码才能报名。",
			en: "This ticket requires an invitation code to register."
		},
		inviteCodeInvalid: {
			"zh-Hant": "邀請碼無效或已過期。",
			"zh-Hans": "邀请码无效或已过期。",
			en: "The invitation code is invalid or has expired."
		}
	});

	const isTicketExpired = (ticket: z.infer<typeof ticketSchema>): boolean => {
		if (!ticket.saleEnd) return false;
		const saleEndDate = typeof ticket.saleEnd === "string" && ticket.saleEnd !== "N/A" ? new Date(ticket.saleEnd) : null;
		if (!saleEndDate) return false;
		return saleEndDate < new Date();
	};

	const isTicketNotYetAvailable = (ticket: z.infer<typeof ticketSchema>): boolean => {
		if (!ticket.saleStart) return false;
		const saleStartDate = typeof ticket.saleStart === "string" && ticket.saleStart !== "N/A" ? new Date(ticket.saleStart) : null;
		if (!saleStartDate) return false;
		return saleStartDate > new Date();
	};

	const isTicketSoldOut = (ticket: z.infer<typeof ticketSchema>): boolean => {
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
		async (ticket: z.infer<typeof ticketSchema>, eventId: string): Promise<boolean> => {
			if (isTicketExpired(ticket)) {
				setErrorMessage(t.ticketSaleEnded);
				showAlert(t.ticketSaleEnded, "error");
				setHasError(true);
				setLoading(false);
				return false;
			}

			if (isTicketNotYetAvailable(ticket)) {
				setErrorMessage(t.ticketNotYetAvailable);
				showAlert(t.ticketNotYetAvailable, "warning");
				setHasError(true);
				setIsNotYetAvailable(true);
				setLoading(false);
				return false;
			}

			if (isTicketSoldOut(ticket)) {
				setErrorMessage(t.ticketSoldOut);
				showAlert(t.ticketSoldOut, "error");
				setHasError(true);
				setLoading(false);
				return false;
			}

			const referralCode = new URLSearchParams(window.location.search).get("ref");
			const invitationCode = new URLSearchParams(window.location.search).get("inv") || localStorage.getItem("invitationCode");

			// Check if ticket requires invite code
			if (ticket.requireInviteCode) {
				if (!invitationCode) {
					setErrorMessage(t.inviteCodeRequired);
					showAlert(t.inviteCodeRequired, "error");
					setHasError(true);
					setLoading(false);
					return false;
				}

				// Validate the invite code
				try {
					const verifyResult = await invitationCodesAPI.verify({ code: invitationCode, ticketId: ticket.id });
					if (!verifyResult?.success || !verifyResult.data?.valid) {
						setErrorMessage(t.inviteCodeInvalid);
						showAlert(t.inviteCodeInvalid, "error");
						setHasError(true);
						setLoading(false);
						return false;
					}
				} catch {
					setErrorMessage(t.inviteCodeInvalid);
					showAlert(t.inviteCodeInvalid, "error");
					setHasError(true);
					setLoading(false);
					return false;
				}
			}

			try {
				const formData = {
					ticketId: ticket.id,
					eventId: eventId,
					referralCode: referralCode || localStorage.getItem("referralCode") || undefined,
					invitationCode: invitationCode || undefined
				};
				localStorage.setItem("formData", JSON.stringify(formData));
				return true;
			} catch (error) {
				console.warn("Unable to access localStorage", error);
				return false;
			}
		},
		[t.ticketSaleEnded, t.ticketNotYetAvailable, t.ticketSoldOut, t.inviteCodeRequired, t.inviteCodeInvalid, showAlert]
	);

	useEffect(() => {
		const event = fetchEvent();
		const ticket = fetchTicket();

		Promise.all([event, ticket]).then(async values => {
			const [eventId, ticketData] = values;
			if (eventId && ticketData) {
				const isValid = await handleTicketSelect(ticketData, eventId);
				if (isValid) {
					router.push(`/${params.event}/form`);
				}
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
				<main className="h-screen flex flex-col items-center justify-center gap-6 p-8">
					<h1 className="text-4xl font-bold mb-4 text-center text-foreground">{errorMessage ? t.ticketUnavailable : t.eventNotFound}</h1>
					<p className="text-center text-muted-foreground max-w-md">{errorMessage || t.tryToDebug}</p>

					<div className="flex gap-4 mt-4">
						{isNotYetAvailable && (
							<Link href={`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`}>
								<Button variant="default">{t.goToLogin}</Button>
							</Link>
						)}
						<Link href={`/${params.event}`}>
							<Button variant="secondary">{t.backToEvent}</Button>
						</Link>
					</div>
				</main>
			)}
		</>
	);
}
