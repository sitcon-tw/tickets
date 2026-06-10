"use client";

import Confirm from "@/components/Confirm";
import Text from "@/components/input/Text";
import MarkdownContent from "@/components/MarkdownContent";
import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { authAPI, eventsAPI, invitationCodesAPI, registrationsAPI, smsVerificationAPI } from "@/lib/api/endpoints";
import { TicketsProps } from "@/lib/types/components";
import { getLocalizedText } from "@/lib/utils/localization";
import { formatDateTime, isAfterNowUTC8, isBeforeNowUTC8 } from "@/lib/utils/timezone";
import { PublicTicketListItemSchema } from "@sitcontix/types";
import { CheckCircle2, XCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useReducer, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { z } from "zod/v4";

const formDataStorageKey = "formData:v1";
const legacyFormDataStorageKey = "formData";
type TicketItem = z.infer<typeof PublicTicketListItemSchema>;
type CodeVerificationStatus = "idle" | "valid" | "invalid";

type TicketsState = {
	tickets: TicketItem[];
	isLoading: boolean;
	selectedTicket: TicketItem | null;
	isConfirming: boolean;
	isSubmitting: boolean;
	canRegister: boolean;
	isMounted: boolean;
	invitationCode: string;
	isVerifyingCode: boolean;
	codeVerificationStatus: CodeVerificationStatus;
	verificationMessage: string;
};

type TicketsAction =
	| { type: "ticketsLoaded"; tickets: TicketItem[] }
	| { type: "loadingFinished" }
	| { type: "ticketSelected"; ticket: TicketItem }
	| { type: "confirmationVisibilityChanged"; isConfirming: boolean }
	| { type: "submittingChanged"; isSubmitting: boolean }
	| { type: "registrationEligibilityChanged"; canRegister: boolean }
	| { type: "mounted" }
	| { type: "invitationCodeChanged"; invitationCode: string }
	| { type: "verificationStarted" }
	| { type: "verificationFinished"; status: CodeVerificationStatus; message: string }
	| { type: "confirmationClosed" };

const initialTicketsState: TicketsState = {
	tickets: [],
	isLoading: true,
	selectedTicket: null,
	isConfirming: false,
	isSubmitting: false,
	canRegister: true,
	isMounted: false,
	invitationCode: "",
	isVerifyingCode: false,
	codeVerificationStatus: "idle",
	verificationMessage: ""
};

function ticketsReducer(state: TicketsState, action: TicketsAction): TicketsState {
	switch (action.type) {
		case "ticketsLoaded":
			return { ...state, tickets: action.tickets };
		case "loadingFinished":
			return { ...state, isLoading: false };
		case "ticketSelected":
			return {
				...state,
				selectedTicket: action.ticket,
				invitationCode: "",
				codeVerificationStatus: "idle",
				verificationMessage: ""
			};
		case "confirmationVisibilityChanged":
			return { ...state, isConfirming: action.isConfirming };
		case "submittingChanged":
			return { ...state, isSubmitting: action.isSubmitting };
		case "registrationEligibilityChanged":
			return { ...state, canRegister: action.canRegister };
		case "mounted":
			return { ...state, isMounted: true };
		case "invitationCodeChanged":
			return {
				...state,
				invitationCode: action.invitationCode,
				codeVerificationStatus: "idle",
				verificationMessage: ""
			};
		case "verificationStarted":
			return {
				...state,
				isVerifyingCode: true,
				codeVerificationStatus: "idle",
				verificationMessage: ""
			};
		case "verificationFinished":
			return {
				...state,
				isVerifyingCode: false,
				codeVerificationStatus: action.status,
				verificationMessage: action.message
			};
		case "confirmationClosed":
			return {
				...state,
				isConfirming: false,
				selectedTicket: null
			};
	}
}

function isTicketExpired(ticket: TicketItem): boolean {
	if (!ticket.saleEnd) return false;
	return isBeforeNowUTC8(ticket.saleEnd);
}

function isTicketNotYetAvailable(ticket: TicketItem): boolean {
	if (!ticket.saleStart) return false;
	return isAfterNowUTC8(ticket.saleStart);
}

function isTicketSoldOut(ticket: TicketItem): boolean {
	return ticket.available !== undefined && ticket.available <= 0;
}

type TicketTranslations = Record<string, string>;

function TicketSummary({ ticket, locale, t, compact = false }: { ticket: TicketItem; locale: string; t: TicketTranslations; compact?: boolean }) {
	return (
		<div className={compact ? "" : "space-y-2"}>
			<h3 className={compact ? "" : "text-xl font-bold"}>{getLocalizedText(ticket.name, locale)}</h3>
			{!compact && <div className="border-t-2 border-gray-500 max-w-32" />}
			<div>
				<p>
					{t.time}
					{ticket.saleStart ? formatDateTime(ticket.saleStart) : "N/A"} - {ticket.saleEnd ? formatDateTime(ticket.saleEnd) : "N/A"}
				</p>
				{ticket.showRemaining !== false && (
					<p className="remain">
						{t.remaining} {ticket.available} / {ticket.quantity}
					</p>
				)}
			</div>
		</div>
	);
}

function TicketsGrid({
	isLoading,
	tickets,
	locale,
	t,
	onTicketSelect
}: {
	isLoading: boolean;
	tickets: TicketItem[];
	locale: string;
	t: TicketTranslations;
	onTicketSelect: (ticket: TicketItem, element: HTMLElement) => void;
}) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
			{isLoading && tickets.length === 0 && (
				<div className="flex flex-col items-center justify-center gap-4 p-12 opacity-70 h-[500px]">
					<PageSpinner />
				</div>
			)}
			{!isLoading && tickets.length === 0 ? <p>{t.selectTicketHint}</p> : null}
			{tickets.map(ticket => {
				const isExpired = isTicketExpired(ticket);
				const isSoldOut = isTicketSoldOut(ticket);
				const isNotYetAvailable = isTicketNotYetAvailable(ticket);
				const isUnavailable = isExpired || isSoldOut || isNotYetAvailable;
				return (
					<button
						type="button"
						key={ticket.id}
						className={`ticket w-full text-left ${isUnavailable ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"}`}
						onClick={e => onTicketSelect(ticket, e.currentTarget)}
					>
						<div className="space-y-2">
							<TicketSummary ticket={ticket} locale={locale} t={t} />
							{isExpired && <p className="text-red-600 dark:text-red-400 font-bold">({t.registrationEnded})</p>}
							{isSoldOut && !isExpired && <p className="text-red-600 dark:text-red-400 font-bold">({t.soldOut})</p>}
						</div>
					</button>
				);
			})}
		</div>
	);
}

function TicketConfirmContent({
	selectedTicket,
	locale,
	t,
	ticketConfirmRef,
	invitationCode,
	isVerifyingCode,
	verificationMessage,
	codeVerificationStatus,
	canRegister,
	isSubmitting,
	dispatch,
	onVerifyInvitationCode,
	onConfirmRegistration
}: {
	selectedTicket: TicketItem;
	locale: string;
	t: TicketTranslations;
	ticketConfirmRef: RefObject<HTMLDivElement | null>;
	invitationCode: string;
	isVerifyingCode: boolean;
	verificationMessage: string;
	codeVerificationStatus: CodeVerificationStatus;
	canRegister: boolean;
	isSubmitting: boolean;
	dispatch: React.Dispatch<TicketsAction>;
	onVerifyInvitationCode: () => void;
	onConfirmRegistration: () => void;
}) {
	return (
		<div className="p-8 pt-12">
			<div className="ticket ticketConfirm rotate-2" ref={ticketConfirmRef}>
				<div className="space-y-2">
					<TicketSummary ticket={selectedTicket} locale={locale} t={t} />
				</div>
			</div>
			<div className="mb-6 mt-4 max-h-[50vh] overflow-y-auto">
				<h2 className="text-2xl font-bold">{getLocalizedText(selectedTicket.name, locale)}</h2>
				<MarkdownContent content={getLocalizedText(selectedTicket.description, locale)} />
				{selectedTicket.price ? <p>NT$ {selectedTicket.price}</p> : null}
			</div>

			{selectedTicket.requireInviteCode && (
				<div className="mb-4 space-y-2">
					<div className="flex gap-2">
						<div className="flex-1">
							<Text
								label={`${t.invitationCode} *`}
								id="invitationCode"
								value={invitationCode}
								onChange={e => {
									dispatch({ type: "invitationCodeChanged", invitationCode: e.target.value });
								}}
								required={true}
								placeholder={t.invitationCode}
							/>
						</div>
						<div className="flex items-end">
							<Button type="button" onClick={onVerifyInvitationCode} disabled={!invitationCode.trim() || isVerifyingCode} variant="secondary" className="whitespace-nowrap">
								{isVerifyingCode ? t.verifying : t.verifyCode}
							</Button>
						</div>
					</div>
					{verificationMessage && (
						<div className={`flex items-center gap-2 text-sm ${codeVerificationStatus === "valid" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
							{codeVerificationStatus === "valid" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
							<span>{verificationMessage}</span>
						</div>
					)}
				</div>
			)}

			<Button className="inline-flex items-center gap-2" disabled={!canRegister} isLoading={isSubmitting} onClick={onConfirmRegistration}>
				{canRegister ? t.confirm : t.cannotRegister}
			</Button>
		</div>
	);
}

function AnimatedTicket({
	selectedTicket,
	locale,
	t,
	ticketAnimationRef,
	compact = false
}: {
	selectedTicket: TicketItem | null;
	locale: string;
	t: TicketTranslations;
	ticketAnimationRef: RefObject<HTMLDivElement | null>;
	compact?: boolean;
}) {
	return (
		<div className="ticket" id="ticketAnimation" ref={ticketAnimationRef}>
			{selectedTicket ? <TicketSummary ticket={selectedTicket} locale={locale} t={t} compact={compact} /> : null}
		</div>
	);
}

function animateTicketSelection(element: HTMLElement, ticketAnimationRef: RefObject<HTMLDivElement | null>, ticketConfirmRef: RefObject<HTMLDivElement | null>, showConfirm: () => void) {
	requestAnimationFrame(() => {
		const ticketAnimation = ticketAnimationRef.current;
		const ticketConfirm = ticketConfirmRef.current;

		if (!ticketAnimation || !ticketConfirm) {
			showConfirm();
			return;
		}

		const rect = element.getBoundingClientRect();
		ticketAnimation.style.top = `${rect.top}px`;
		ticketAnimation.style.left = `${rect.left}px`;
		ticketAnimation.style.width = `${rect.width}px`;
		ticketAnimation.style.height = `${rect.height}px`;
		ticketAnimation.style.transform = "rotate(0deg)";
		ticketAnimation.style.opacity = "1";
		ticketAnimation.style.display = "block";

		element.style.visibility = "hidden";
		ticketConfirm.style.opacity = "0";
		ticketConfirm.style.visibility = "hidden";
		showConfirm();

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				const confirmRect = ticketConfirm.getBoundingClientRect();
				ticketAnimation.style.top = `${confirmRect.top - 10}px`;
				ticketAnimation.style.left = `${confirmRect.left}px`;
				ticketAnimation.style.width = `${confirmRect.width}px`;
				ticketAnimation.style.height = `${confirmRect.height}px`;
				ticketAnimation.style.transform = "rotate(2deg)";

				const handleTransitionEnd = () => {
					ticketAnimation.removeEventListener("transitionend", handleTransitionEnd);
					ticketAnimation.style.opacity = "0";
					ticketConfirm.style.visibility = "visible";
					ticketConfirm.style.opacity = "1";
					setTimeout(() => {
						ticketAnimation.style.display = "none";
					}, 200);
				};

				ticketAnimation.addEventListener("transitionend", handleTransitionEnd, { once: true });
			});
		});
	});
}

const ticketsTranslations = {
	time: {
		"zh-Hant": "報名時間：",
		"zh-Hans": "报名时间：",
		en: "Registration Time: "
	},
	remaining: {
		"zh-Hant": "剩餘",
		"zh-Hans": "剩余",
		en: "Remaining"
	},
	confirm: {
		"zh-Hant": "確認報名",
		"zh-Hans": "确认报名",
		en: "Confirm Registration"
	},
	cannotRegister: {
		"zh-Hant": "你已經報名過了！",
		"zh-Hans": "你已经报名过了！",
		en: "You have already registered!"
	},
	registrationEnded: {
		"zh-Hant": "報名已截止",
		"zh-Hans": "报名已截止",
		en: "Registration Ended"
	},
	ticketSaleEnded: {
		"zh-Hant": "此票種報名時間已結束",
		"zh-Hans": "此票种报名时间已结束",
		en: "This ticket's registration period has ended"
	},
	ticketNotYetAvailable: {
		"zh-Hant": "此票種尚未開放報名",
		"zh-Hans": "此票种尚未开放报名",
		en: "This ticket is not yet available for registration"
	},
	soldOut: {
		"zh-Hant": "已售完",
		"zh-Hans": "已售完",
		en: "Sold Out"
	},
	ticketSoldOut: {
		"zh-Hant": "此票種已售完",
		"zh-Hans": "此票种已售完",
		en: "This ticket is sold out"
	},
	invitationCode: {
		"zh-Hant": "邀請碼",
		"zh-Hans": "邀请码",
		en: "Invitation Code"
	},
	verifyCode: {
		"zh-Hant": "驗證",
		"zh-Hans": "验证",
		en: "Verify"
	},
	verifying: {
		"zh-Hant": "驗證中...",
		"zh-Hans": "验证中...",
		en: "Verifying..."
	},
	codeValid: {
		"zh-Hant": "邀請碼有效",
		"zh-Hans": "邀请码有效",
		en: "Code is valid"
	},
	codeInvalid: {
		"zh-Hant": "邀請碼無效或已過期",
		"zh-Hans": "邀请码无效或已过期",
		en: "Code is invalid or expired"
	},
	enterCodeFirst: {
		"zh-Hant": "請先驗證邀請碼",
		"zh-Hans": "请先验证邀请码",
		en: "Please verify invitation code first"
	}
};
export default function Tickets({ eventId, eventSlug }: TicketsProps) {
	const locale = useLocale();
	const router = useRouter();
	const { showAlert } = useAlert();

	const t = getTranslations(locale, ticketsTranslations);

	const [state, dispatch] = useReducer(ticketsReducer, initialTicketsState);
	const { tickets, isLoading, selectedTicket, isConfirming, isSubmitting, canRegister, isMounted, invitationCode, isVerifyingCode, codeVerificationStatus, verificationMessage } = state;

	const ticketAnimationRef = useRef<HTMLDivElement>(null);
	const ticketConfirmRef = useRef<HTMLDivElement>(null);
	const hiddenTicketRef = useRef<HTMLElement | null>(null);

	async function handleVerifyInvitationCode() {
		if (!invitationCode.trim() || !selectedTicket) {
			return;
		}

		dispatch({ type: "verificationStarted" });

		try {
			const result = await invitationCodesAPI.verify({
				code: invitationCode.trim(),
				ticketId: selectedTicket.id
			});

			if (result.success && result.data?.valid) {
				dispatch({ type: "verificationFinished", status: "valid", message: t.codeValid });
			} else {
				dispatch({ type: "verificationFinished", status: "invalid", message: t.codeInvalid });
			}
		} catch (error) {
			dispatch({ type: "verificationFinished", status: "invalid", message: t.codeInvalid });
		}
	}

	function handleTicketSelect(ticket: TicketItem, element: HTMLElement) {
		if (isTicketExpired(ticket)) {
			showAlert(t.ticketSaleEnded, "warning");
			return;
		}

		if (isTicketNotYetAvailable(ticket)) {
			showAlert(t.ticketNotYetAvailable, "warning");
			return;
		}

		if (isTicketSoldOut(ticket)) {
			showAlert(t.ticketSoldOut, "warning");
			return;
		}

		dispatch({ type: "ticketSelected", ticket });

		try {
			const formData = {
				ticketId: ticket.id,
				eventId: eventId,
				referralCode: localStorage.getItem("referralCode") || undefined
			};
			localStorage.setItem(formDataStorageKey, JSON.stringify(formData));
			localStorage.removeItem(legacyFormDataStorageKey);
		} catch (error) {
			console.warn("Unable to access localStorage", error);
		}

		// Store reference to the original ticket element
		hiddenTicketRef.current = element;

		animateTicketSelection(element, ticketAnimationRef, ticketConfirmRef, () => dispatch({ type: "confirmationVisibilityChanged", isConfirming: true }));
	}

	async function handleConfirmRegistration() {
		if (!canRegister) return;
		if (!selectedTicket || typeof window === "undefined" || isSubmitting) return;

		// Check if invitation code is required and verified
		if (selectedTicket.requireInviteCode && codeVerificationStatus !== "valid") {
			showAlert(t.enterCodeFirst, "warning");
			return;
		}

		dispatch({ type: "submittingChanged", isSubmitting: true });

		try {
			// Store invitation code in localStorage if it was verified
			if (selectedTicket.requireInviteCode && invitationCode.trim()) {
				const formData = JSON.parse(localStorage.getItem(formDataStorageKey) || localStorage.getItem(legacyFormDataStorageKey) || "{}");
				formData.invitationCode = invitationCode.trim();
				localStorage.setItem(formDataStorageKey, JSON.stringify(formData));
				localStorage.removeItem(legacyFormDataStorageKey);
			}

			const verificationCheck = await smsVerificationAPI.getStatus();

			if (selectedTicket.requireSmsVerification && !verificationCheck.data.phoneVerified) {
				const currentUrl = `/${eventSlug}/form`;
				router.push(`/verify?redirect=${encodeURIComponent(currentUrl)}`);
			} else {
				router.push(`/${eventSlug}/form`);
			}
		} catch (error) {
			console.error("Failed to check SMS verification:", error);
			router.push(`/${eventSlug}/form`);
		}
	}

	function closeConfirm() {
		dispatch({ type: "confirmationClosed" });

		// Restore the original ticket visibility
		if (hiddenTicketRef.current) {
			hiddenTicketRef.current.style.visibility = "visible";
			hiddenTicketRef.current = null;
		}

		// Hide the animation ticket
		if (ticketAnimationRef.current) {
			ticketAnimationRef.current.style.display = "none";
		}

		// Reset the popup ticket opacity and visibility
		if (ticketConfirmRef.current) {
			ticketConfirmRef.current.style.opacity = "0";
			ticketConfirmRef.current.style.visibility = "hidden";
		}
	}

	useEffect(() => {
		async function loadTickets() {
			try {
				const ticketsData = await eventsAPI.getTickets(eventId);

				if (ticketsData.success && Array.isArray(ticketsData.data)) {
					dispatch({ type: "ticketsLoaded", tickets: ticketsData.data });
				}
			} catch (error) {
				console.error("Failed to load tickets", error);
			} finally {
				dispatch({ type: "loadingFinished" });
			}
		}

		async function checkRegistrationStatus() {
			try {
				const regDataRes = await registrationsAPI.getAll();
				if (regDataRes.success && regDataRes.data) {
					const hasActiveRegistration = regDataRes.data.some(reg => reg.event?.id === eventId && reg.status !== "cancelled");
					dispatch({ type: "registrationEligibilityChanged", canRegister: !hasActiveRegistration });
				}
			} catch (error) {
				console.error("Failed to check registration status", error);
			}
		}

		async function checkAuth() {
			try {
				const sessionData = await authAPI.getSession();
				if (!sessionData) {
					return false;
				}
				return true;
			} catch (error) {
				console.error("Failed to check auth status", error);
				return false;
			}
		}

		async function init() {
			await loadTickets();

			if (await checkAuth()) {
				await checkRegistrationStatus();
			}

			dispatch({ type: "mounted" });
		}

		init();

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				closeConfirm();
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [locale, eventId]);

	return (
		<>
			<div className="max-w-4xl mx-auto w-full">
				<TicketsGrid isLoading={isLoading} tickets={tickets} locale={locale} t={t} onTicketSelect={handleTicketSelect} />
				<Confirm isOpen={Boolean(selectedTicket)} onClose={closeConfirm} isConfirming={isConfirming}>
					{selectedTicket ? (
						<TicketConfirmContent
							selectedTicket={selectedTicket}
							locale={locale}
							t={t}
							ticketConfirmRef={ticketConfirmRef}
							invitationCode={invitationCode}
							isVerifyingCode={isVerifyingCode}
							verificationMessage={verificationMessage}
							codeVerificationStatus={codeVerificationStatus}
							canRegister={canRegister}
							isSubmitting={isSubmitting}
							dispatch={dispatch}
							onVerifyInvitationCode={handleVerifyInvitationCode}
							onConfirmRegistration={handleConfirmRegistration}
						/>
					) : null}
				</Confirm>
				{/* Animation ticket - rendered at body level via portal */}
				{isMounted && typeof window !== "undefined" && createPortal(<AnimatedTicket selectedTicket={selectedTicket} locale={locale} t={t} ticketAnimationRef={ticketAnimationRef} />, document.body)}
				{/* Animation ticket */}
				<AnimatedTicket selectedTicket={selectedTicket} locale={locale} t={t} ticketAnimationRef={ticketAnimationRef} compact />
			</div>
		</>
	);
}
