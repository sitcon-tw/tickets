"use client";

import Confirm from "@/components/Confirm";
import MarkdownContent from "@/components/MarkdownContent";
import PageSpinner from "@/components/PageSpinner";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { authAPI, eventsAPI, registrationsAPI, smsVerificationAPI } from "@/lib/api/endpoints";
import { Ticket } from "@/lib/types/api";
import { getLocalizedText } from "@/lib/utils/localization";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface TicketsProps {
	eventId: string;
	eventSlug: string;
}

export default function Tickets({ eventId, eventSlug }: TicketsProps) {
	const locale = useLocale();
	const router = useRouter();
	const { showAlert } = useAlert();

	const t = getTranslations(locale, {
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
		soldOut: {
			"zh-Hant": "已售完",
			"zh-Hans": "已售完",
			en: "Sold Out"
		},
		ticketSoldOut: {
			"zh-Hant": "此票種已售完",
			"zh-Hans": "此票种已售完",
			en: "This ticket is sold out"
		}
	});

	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
	const [isConfirming, setIsConfirming] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [canRegister, setCanRegister] = useState(true);

	const ticketAnimationRef = useRef<HTMLDivElement>(null);
	const ticketConfirmRef = useRef<HTMLDivElement>(null);
	const hiddenTicketRef = useRef<HTMLDivElement | null>(null);

	function isTicketExpired(ticket: Ticket): boolean {
		if (!ticket.saleEnd) return false;
		const saleEndDate = typeof ticket.saleEnd === "string" && ticket.saleEnd !== "N/A" ? new Date(ticket.saleEnd) : null;
		if (!saleEndDate) return false;
		return saleEndDate < new Date();
	}

	function isTicketSoldOut(ticket: Ticket): boolean {
		return ticket.available !== undefined && ticket.available <= 0;
	}

	function handleTicketSelect(ticket: Ticket, element: HTMLDivElement) {
		if (isTicketExpired(ticket)) {
			showAlert(t.ticketSaleEnded, "warning");
			return;
		}

		if (isTicketSoldOut(ticket)) {
			showAlert(t.ticketSoldOut, "warning");
			return;
		}

		setSelectedTicket(ticket);

		try {
			const formData = {
				ticketId: ticket.id,
				eventId: eventId,
				referralCode: localStorage.getItem("referralCode") || undefined
			};
			localStorage.setItem("formData", JSON.stringify(formData));
		} catch (error) {
			console.warn("Unable to access localStorage", error);
		}

		hiddenTicketRef.current = element;

		requestAnimationFrame(() => {
			const ticketAnimation = ticketAnimationRef.current;
			const ticketConfirm = ticketConfirmRef.current;

			if (!ticketAnimation || !ticketConfirm) return;

			const { top, left } = element.getBoundingClientRect();
			const transform = window.getComputedStyle(element).transform;

			ticketAnimation.style.top = `${top}px`;
			ticketAnimation.style.left = `${left}px`;
			ticketAnimation.style.transform = transform;
			ticketAnimation.style.display = "block";

			element.style.visibility = "hidden";
			ticketConfirm.style.visibility = "hidden";

			setIsConfirming(true);

			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					const confirmRect = ticketConfirm.getBoundingClientRect();
					const confirmTransform = window.getComputedStyle(ticketConfirm).transform;

					ticketAnimation.style.top = `${confirmRect.top}px`;
					ticketAnimation.style.left = `${confirmRect.left}px`;
					ticketAnimation.style.transform = confirmTransform;

					setTimeout(() => {
						ticketAnimation.style.display = "none";
						ticketConfirm.style.visibility = "visible";
					}, 300);
				});
			});
		});
	}

	async function handleConfirmRegistration() {
		if (!canRegister) return;
		if (!selectedTicket || typeof window === "undefined" || isSubmitting) return;
		setIsSubmitting(true);

		try {
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
		setIsConfirming(false);
		setSelectedTicket(null);

		if (hiddenTicketRef.current) {
			hiddenTicketRef.current.style.visibility = "visible";
			hiddenTicketRef.current = null;
		}

		if (ticketAnimationRef.current) {
			ticketAnimationRef.current.style.display = "none";
		}
	}

	useEffect(() => {
		async function loadTickets() {
			try {
				const ticketsData = await eventsAPI.getTickets(eventId);

				if (ticketsData.success && Array.isArray(ticketsData.data)) {
					setTickets(ticketsData.data);
				}
			} catch (error) {
				console.error("Failed to load tickets", error);
			} finally {
				setIsLoading(false);
			}
		}

		async function checkRegistrationStatus() {
			try {
				const regDataRes = await registrationsAPI.getAll();
				if (regDataRes.success && regDataRes.data) {
					const hasRegistered = regDataRes.data.some(reg => reg.event?.id === eventId);
					setCanRegister(!hasRegistered);
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
			<div className="tickets-container">
				{isLoading && tickets.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-4 p-12 opacity-70 h-[500px]">
						<PageSpinner size={48} />
					</div>
				) : null}
				{!isLoading && tickets.length === 0 ? <p>{t.selectTicketHint}</p> : null}
				{tickets.map(ticket => {
					const isExpired = isTicketExpired(ticket);
					const isSoldOut = isTicketSoldOut(ticket);
					const isUnavailable = isExpired || isSoldOut;
					return (
						<div
							key={ticket.id}
							className={`ticket ${isUnavailable ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"}`}
							role="button"
							tabIndex={0}
							onClick={e => handleTicketSelect(ticket, e.currentTarget)}
							onKeyDown={event => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									handleTicketSelect(ticket, event.currentTarget);
								}
							}}
						>
							<h3>{getLocalizedText(ticket.name, locale)}</h3>
							<p>
								{t.time}
								{ticket.saleStart ? new Date(ticket.saleStart).toLocaleDateString(locale) : "N/A"} - {ticket.saleEnd ? new Date(ticket.saleEnd).toLocaleDateString(locale) : "N/A"}
							</p>
							<p className="remain">
								{t.remaining} {ticket.available} / {ticket.quantity}
								{isExpired && <span className="text-red-600 dark:text-red-400 font-bold ml-2">({t.registrationEnded})</span>}
								{isSoldOut && !isExpired && <span className="text-red-600 dark:text-red-400 font-bold ml-2">({t.soldOut})</span>}
							</p>
						</div>
					);
				})}
			</div>

			<Confirm isOpen={Boolean(selectedTicket)} onClose={closeConfirm} isConfirming={isConfirming}>
				{selectedTicket ? (
					<div className="about">
						<div className="ticket ticketConfirm" ref={ticketConfirmRef}>
							<h3>{getLocalizedText(selectedTicket.name, locale)}</h3>
							<p>
								{t.time}
								{selectedTicket.saleStart} - {selectedTicket.saleEnd}
							</p>
							<p className="remain">
								{t.remaining} {selectedTicket.available} / {selectedTicket.quantity}
							</p>
					</div>
					<div className="content">
						<h2 className="text-2xl font-bold">{getLocalizedText(selectedTicket.name, locale)}</h2>
						<MarkdownContent content={getLocalizedText(selectedTicket.description, locale)} />
						{selectedTicket.price ? <p>NT$ {selectedTicket.price}</p> : null}
					</div>
				</div>
			) : null}
			<Button
				className={`inline-flex items-center gap-2 transition-opacity duration-200 ${
					isSubmitting ? "opacity-70" : ""
				}`}
				disabled={!canRegister || isSubmitting}
				onClick={() => handleConfirmRegistration()}
			>
				{isSubmitting && <Spinner size="sm" />}
				{canRegister ? t.confirm : t.cannotRegister}
			</Button>
		</Confirm>			{/* Animation ticket */}
			<div className="ticket" id="ticketAnimation" ref={ticketAnimationRef}>
				{selectedTicket ? (
					<>
						<h3>{getLocalizedText(selectedTicket.name, locale)}</h3>
						<p>
							{t.time}
							{selectedTicket.saleStart} - {selectedTicket.saleEnd}
						</p>
						<p className="remain">
							{t.remaining} {selectedTicket.available} / {selectedTicket.quantity}
						</p>
					</>
				) : null}
			</div>
		</>
	);
}
