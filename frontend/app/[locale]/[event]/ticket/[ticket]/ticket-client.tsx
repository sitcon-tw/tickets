"use client";

import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { Link, useRouter } from "@/i18n/navigation";
import { eventsAPI, invitationCodesAPI, ticketsAPI } from "@/lib/api/endpoints";
import { PublicTicketDetailSchema } from "@sitcontix/types";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useReducer, useState } from "react";
import { z } from "zod/v4";

const formDataStorageKey = "formData:v1";
const legacyFormDataStorageKey = "formData";
type TicketPageState = {
	isLoading: boolean;
	hasError: boolean;
	errorMessage: string;
	isNotYetAvailable: boolean;
	isReady: boolean;
};

type TicketPageAction = { type: "loadingFinished" } | { type: "ready" } | { type: "failed"; message?: string; isNotYetAvailable?: boolean } | { type: "reset" };

const initialTicketPageState: TicketPageState = {
	isLoading: true,
	hasError: false,
	errorMessage: "",
	isNotYetAvailable: false,
	isReady: false
};

function ticketPageReducer(state: TicketPageState, action: TicketPageAction): TicketPageState {
	switch (action.type) {
		case "loadingFinished":
			return { ...state, isLoading: false };
		case "ready":
			return { ...state, isLoading: false, isReady: true };
		case "failed":
			return {
				isLoading: false,
				hasError: true,
				errorMessage: action.message || "",
				isNotYetAvailable: action.isNotYetAvailable || false,
				isReady: false
			};
		case "reset":
			return initialTicketPageState;
	}
}

function isTicketExpired(ticket: z.infer<typeof PublicTicketDetailSchema>): boolean {
	if (!ticket.saleEnd) return false;
	return ticket.saleEnd < new Date();
}

function isTicketNotYetAvailable(ticket: z.infer<typeof PublicTicketDetailSchema>): boolean {
	if (!ticket.saleStart) return false;
	return ticket.saleStart > new Date();
}

function isTicketSoldOut(ticket: z.infer<typeof PublicTicketDetailSchema>): boolean {
	return ticket.available !== undefined && ticket.available <= 0;
}

/** Fallback link, shown only if the automatic redirect has not happened after a few seconds. */
function ManualContinue({ href, label }: { href: string; label: string }) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const timer = window.setTimeout(() => setVisible(true), 4000);
		return () => window.clearTimeout(timer);
	}, []);

	return (
		<Link
			href={href}
			className={`text-sm text-muted-foreground underline underline-offset-4 transition-opacity duration-500 hover:text-foreground ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
			tabIndex={visible ? 0 : -1}
		>
			{label}
		</Link>
	);
}

export default function SetTicket() {
	const { showAlert } = useAlert();
	const locale = useLocale();
	const params = useParams();
	const router = useRouter();

	const [state, dispatch] = useReducer(ticketPageReducer, initialTicketPageState);
	const { isLoading, errorMessage, isNotYetAvailable, isReady } = state;

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
			"zh-Hant": "正在前往報名表單",
			"zh-Hans": "正在前往报名表单",
			en: "Taking you to the registration form"
		},
		redirectingHint: {
			"zh-Hant": "票券已確認，馬上就好。",
			"zh-Hans": "票券已确认，马上就好。",
			en: "Your ticket is confirmed. Just a moment."
		},
		redirectManual: {
			"zh-Hant": "沒有自動跳轉？點此繼續",
			"zh-Hans": "没有自动跳转？点此继续",
			en: "Not redirected? Continue here"
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
					dispatch({ type: "failed" });
				}
			} else {
				showAlert(t.loadFailed, "error");
				dispatch({ type: "failed" });
			}
		} catch {
			showAlert(t.loadFailed, "error");
			dispatch({ type: "failed" });
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
					dispatch({ type: "failed" });
				}
			} else {
				showAlert(t.loadFailed, "error");
				dispatch({ type: "failed" });
			}
		} catch {
			showAlert(t.loadFailed, "error");
			dispatch({ type: "failed" });
		} finally {
			dispatch({ type: "loadingFinished" });
		}
	}, [params.ticket, showAlert, t.loadFailed, t.ticketNotFound]);

	const handleTicketSelect = useCallback(
		async (ticket: z.infer<typeof PublicTicketDetailSchema>, eventId: string): Promise<boolean> => {
			if (isTicketExpired(ticket)) {
				showAlert(t.ticketSaleEnded, "error");
				dispatch({ type: "failed", message: t.ticketSaleEnded });
				return false;
			}

			if (isTicketNotYetAvailable(ticket)) {
				showAlert(t.ticketNotYetAvailable, "warning");
				dispatch({ type: "failed", message: t.ticketNotYetAvailable, isNotYetAvailable: true });
				return false;
			}

			if (isTicketSoldOut(ticket)) {
				showAlert(t.ticketSoldOut, "error");
				dispatch({ type: "failed", message: t.ticketSoldOut });
				return false;
			}

			const referralCode = new URLSearchParams(window.location.search).get("ref");
			const invitationCode = new URLSearchParams(window.location.search).get("inv") || localStorage.getItem("invitationCode");

			// Check if ticket requires invite code
			if (ticket.requireInviteCode) {
				if (!invitationCode) {
					showAlert(t.inviteCodeRequired, "error");
					dispatch({ type: "failed", message: t.inviteCodeRequired });
					return false;
				}

				// Validate the invite code
				try {
					const verifyResult = await invitationCodesAPI.verify({ code: invitationCode, ticketId: ticket.id });
					if (!verifyResult?.success || !verifyResult.data?.valid) {
						showAlert(t.inviteCodeInvalid, "error");
						dispatch({ type: "failed", message: t.inviteCodeInvalid });
						return false;
					}
				} catch {
					showAlert(t.inviteCodeInvalid, "error");
					dispatch({ type: "failed", message: t.inviteCodeInvalid });
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
				localStorage.setItem(formDataStorageKey, JSON.stringify(formData));
				localStorage.removeItem(legacyFormDataStorageKey);
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

		void Promise.all([event, ticket]).then(async values => {
			const [eventId, ticketData] = values;
			if (eventId && ticketData) {
				const isValid = await handleTicketSelect(ticketData, eventId);
				if (isValid) {
					dispatch({ type: "ready" });
				}
			} else {
				dispatch({ type: "loadingFinished" });
			}
		});
	}, [fetchEvent, fetchTicket, handleTicketSelect]);

	// The ticket is validated and stashed in localStorage, so send the visitor straight on to the form.
	// The link below stays as a fallback if the navigation does not happen.
	useEffect(() => {
		if (isReady) router.replace(`/${params.event as string}/form`);
	}, [isReady, router, params.event]);

	return (
		<>
			{isLoading ? (
				<main>
					<div className="flex items-center justify-center h-screen">
						<PageSpinner />
					</div>
				</main>
			) : isReady ? (
				<main className="h-screen flex flex-col items-center justify-center gap-5 p-8 text-center" aria-live="polite">
					<Image src="/assets/small-stone.png" alt="" width={56} height={56} className="animate-spin" />
					<div className="space-y-2">
						<h1 className="text-2xl font-bold text-foreground">{t.redirecting}</h1>
						<p className="text-muted-foreground">{t.redirectingHint}</p>
					</div>
					<div className="h-1 w-48 overflow-hidden rounded-full bg-muted" aria-hidden="true">
						<div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
					</div>
					<ManualContinue href={`/${params.event as string}/form`} label={t.redirectManual} />
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
						<Link href={`/${params.event as string}`}>
							<Button variant="secondary">{t.backToEvent}</Button>
						</Link>
					</div>
				</main>
			)}
		</>
	);
}
