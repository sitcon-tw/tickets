"use client";

import Confirm from "@/components/Confirm";
import MarkdownContent from "@/components/MarkdownContent";
import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { authAPI, eventsAPI, registrationsAPI, smsVerificationAPI } from "@/lib/api/endpoints";
import { Ticket } from "@/lib/types/api";
import { getLocalizedText } from "@/lib/utils/localization";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
	const [isMounted, setIsMounted] = useState(false);

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

		// Store reference to the original ticket element
		hiddenTicketRef.current = element;

		// Start animation after a frame to ensure refs are ready
		requestAnimationFrame(() => {
			const ticketAnimation = ticketAnimationRef.current;
			const ticketConfirm = ticketConfirmRef.current;

			if (!ticketAnimation || !ticketConfirm) {
				// If refs aren't ready, just show the popup
				setIsConfirming(true);
				return;
			}

			// Step 1: Clone styling and position to original position
			const rect = element.getBoundingClientRect();

			// Position the animation ticket at the original ticket's position
			ticketAnimation.style.top = `${rect.top}px`;
			ticketAnimation.style.left = `${rect.left}px`;
			ticketAnimation.style.width = `${rect.width}px`;
			ticketAnimation.style.height = `${rect.height}px`;
			ticketAnimation.style.transform = "rotate(0deg)";
			ticketAnimation.style.opacity = "1";
			ticketAnimation.style.display = "block";

			// Step 2: Hide original ticket
			element.style.visibility = "hidden";

			// Step 3: Show the confirm popup (popup ticket is initially hidden)
			ticketConfirm.style.opacity = "0";
			ticketConfirm.style.visibility = "hidden";
			setIsConfirming(true);

			// Step 4: Wait for popup to render in DOM, then get its position
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					const confirmRect = ticketConfirm.getBoundingClientRect();

					// Step 5: Animate to popup position and rotation simultaneously
					ticketAnimation.style.top = `${confirmRect.top-10}px`;
					ticketAnimation.style.left = `${confirmRect.left}px`;
					ticketAnimation.style.width = `${confirmRect.width}px`;
					ticketAnimation.style.height = `${confirmRect.height}px`;
					ticketAnimation.style.transform = "rotate(2deg)";

					// Step 6: After animation completes, swap to real popup ticket
					const handleTransitionEnd = () => {
						ticketAnimation.removeEventListener("transitionend", handleTransitionEnd);
						ticketAnimation.style.opacity = "0";
						ticketConfirm.style.visibility = "visible";
						ticketConfirm.style.opacity = "1";
						// Hide animation ticket after fade completes
						setTimeout(() => {
							ticketAnimation.style.display = "none";
						}, 200);
					};

					ticketAnimation.addEventListener("transitionend", handleTransitionEnd, { once: true });
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
			
			setIsMounted(true);
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
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
				{isLoading && tickets.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-4 p-12 opacity-70 h-[500px]">
						<PageSpinner />
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
							<div className="space-y-2">
								<h3 className="text-xl font-bold">{getLocalizedText(ticket.name, locale)}</h3>
								<div className="border-t-2 border-gray-500 max-w-32" />
								<div>
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
							</div>
						</div>
					);
				})}
			</div>
			<Confirm isOpen={Boolean(selectedTicket)} onClose={closeConfirm} isConfirming={isConfirming}>
				{selectedTicket ? (
					<div className="p-8 pt-12">
						<div className="ticket ticketConfirm rotate-2" ref={ticketConfirmRef}>
							<div className="space-y-2">
									<h3 className="text-xl font-bold">{getLocalizedText(selectedTicket.name, locale)}</h3>
									<div className="border-t-2 border-gray-500 max-w-32" />
									<div>
										<p>
											{t.time}
											{selectedTicket.saleStart ? new Date(selectedTicket.saleStart).toLocaleDateString(locale) : "N/A"} - {selectedTicket.saleEnd ? new Date(selectedTicket.saleEnd).toLocaleDateString(locale) : "N/A"}
										</p>
										<p className="remain">
											{t.remaining} {selectedTicket.available} / {selectedTicket.quantity}
										</p>
									</div>
								</div>
						</div>
						<div className="mb-6 mt-4 max-h-[50vh] overflow-y-auto">
							<h2 className="text-2xl font-bold">{getLocalizedText(selectedTicket.name, locale)}</h2>
							<MarkdownContent content={getLocalizedText(selectedTicket.description, locale)} />
							{selectedTicket.price ? <p>NT$ {selectedTicket.price}</p> : null}
						</div>
						<Button
							className={`inline-flex items-center gap-2`}
							disabled={!canRegister}
							isLoading={isSubmitting}
							onClick={() => handleConfirmRegistration()}
						>
							{canRegister ? t.confirm : t.cannotRegister}
						</Button>
					</div>
				) : null}
			</Confirm>
			{/* Animation ticket - rendered at body level via portal */}
			{isMounted && typeof window !== 'undefined' && createPortal(
				<div className="ticket" id="ticketAnimation" ref={ticketAnimationRef}>
					{selectedTicket ? (
						<div className="space-y-2">
							<h3 className="text-xl font-bold">{getLocalizedText(selectedTicket.name, locale)}</h3>
							<div className="border-t-2 border-gray-500 max-w-32" />
							<div>
								<p>
									{t.time}
									{selectedTicket.saleStart ? new Date(selectedTicket.saleStart).toLocaleDateString(locale) : "N/A"} - {selectedTicket.saleEnd ? new Date(selectedTicket.saleEnd).toLocaleDateString(locale) : "N/A"}
								</p>
								<p className="remain">
									{t.remaining} {selectedTicket.available} / {selectedTicket.quantity}
								</p>
							</div>
						</div>
					) : null}
				</div>,
				document.body
			)}
			{/* Animation ticket */}
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
		</div>
		</>
	);
}
