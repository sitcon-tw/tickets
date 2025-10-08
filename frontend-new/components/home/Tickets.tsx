"use client";

import Confirm from "@/components/Confirm";
import MarkdownContent from "@/components/MarkdownContent";
import PageSpinner from "@/components/PageSpinner";
import Spinner from "@/components/Spinner";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { authAPI, eventsAPI, registrationsAPI } from "@/lib/api/endpoints";
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

	const t = getTranslations(locale, {
		description: {
			"zh-Hant": "毛哥EM的網站起始模板，使用Astro和Fastify構建。",
			"zh-Hans": "毛哥EM的网站起始模板，使用Astro和Fastify构建。",
			en: "Elvis Mao's Website starter template using Astro and Fastify."
		},
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

	useEffect(() => {
		async function loadTickets() {
			try {
				const ticketsData = await eventsAPI.getTickets(eventId);

				if (ticketsData.success && Array.isArray(ticketsData.data)) {
					const prosceedTicketData = ticketsData.data.map(ticket => ({
						...ticket,
						saleStart: ticket.saleStart ? new Date(ticket.saleStart).toLocaleDateString(locale) : "N/A",
						saleEnd: ticket.saleEnd ? new Date(ticket.saleEnd).toLocaleDateString(locale) : "N/A"
					}));
					setTickets(prosceedTicketData);
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

	function handleTicketSelect(ticket: Ticket, element: HTMLDivElement) {
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
		router.push(`/${eventSlug}/form`);
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

	return (
		<>
			<div className="tickets-container">
				{isLoading && tickets.length === 0 ? (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							gap: "1rem",
							padding: "3rem",
							opacity: 0.7,
							height: "500px"
						}}
					>
						<PageSpinner size={48} />
					</div>
				) : null}
				{!isLoading && tickets.length === 0 ? <p>{t.selectTicketHint}</p> : null}
				{tickets.map(ticket => (
					<div
						key={ticket.id}
						className="ticket"
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
							{ticket.saleStart} - {ticket.saleEnd}
						</p>
						<p className="remain">
							{t.remaining} {ticket.available} / {ticket.quantity}
						</p>
					</div>
				))}
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
				<button
					className="button"
					onClick={() => handleConfirmRegistration()}
					style={{
						opacity: isSubmitting ? 0.7 : 1,
						cursor: !canRegister || isSubmitting ? "not-allowed" : "pointer",
						pointerEvents: isSubmitting ? "none" : "auto",
						transition: "opacity 0.2s",
						display: "inline-flex",
						alignItems: "center",
						gap: "0.5rem"
					}}
				>
					{isSubmitting && <Spinner size="sm" color="currentColor" />}
					{canRegister ? t.confirm : t.cannotRegister}
				</button>
			</Confirm>

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
		</>
	);
}
