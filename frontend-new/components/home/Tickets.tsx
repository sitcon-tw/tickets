"use client";

import { useEffect, useState, useRef } from "react";
import { useLocale } from "next-intl";
import Confirm from "@/components/Confirm";
import { getTranslations } from "@/i18n/helpers";
import { eventsAPI } from "@/lib/api/endpoints";
import { Ticket } from "@/lib/types/api";

export default function Tickets() {
  const locale = useLocale();

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
    selectTicketHint: {
      "zh-Hant": "請選擇想要的票種",
      "zh-Hans": "请选择想要的票种",
      en: "Please select a ticket type"
    }
  });

  const [eventName, setEventName] = useState("SITCON 2025");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const ticketAnimationRef = useRef<HTMLDivElement>(null);
  const ticketConfirmRef = useRef<HTMLDivElement>(null);
  const hiddenTicketRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadTickets() {
      try {
        const eventsData = await eventsAPI.getAll();

        if (eventsData?.success && Array.isArray(eventsData.data) && eventsData.data.length > 0) {
          const event = eventsData.data[0];
          setEventName(event.name || "SITCON 2025");

          const ticketsData = await eventsAPI.getTickets(event.id);

          if (ticketsData.success && Array.isArray(ticketsData.data)) {
            const prosceedTicketData = ticketsData.data.map(ticket => ({
              ...ticket,
              saleStart: ticket.saleStart ? new Date(ticket.saleStart).toLocaleDateString(locale) : "N/A",
              saleEnd: ticket.saleEnd ? new Date(ticket.saleEnd).toLocaleDateString(locale) : "N/A"
            }));
            setTickets(prosceedTicketData);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to load tickets", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, [locale]);

  function handleTicketSelect(ticket: Ticket, element: HTMLDivElement) {
    if (typeof window === "undefined") return;

    setSelectedTicket(ticket);

    try {
      sessionStorage.setItem("selectedTicketId", ticket.id);
      sessionStorage.setItem("selectedTicketName", ticket.name);
      sessionStorage.setItem("selectedEventName", eventName);
    } catch (error) {
      console.warn("Unable to access sessionStorage", error);
    }

    // Animation logic
    const ticketAnimation = ticketAnimationRef.current;
    const ticketConfirm = ticketConfirmRef.current;

    if (!ticketAnimation || !ticketConfirm) return;

    hiddenTicketRef.current = element;

    // Get position and transform of clicked ticket
    const { top, left } = element.getBoundingClientRect();
    const transform = window.getComputedStyle(element).transform;

    // Set animation ticket to same position
    ticketAnimation.style.top = `${top}px`;
    ticketAnimation.style.left = `${left}px`;
    ticketAnimation.style.transform = transform;
    ticketAnimation.style.display = "block";

    // Hide original ticket and confirm ticket
    element.style.visibility = "hidden";
    ticketConfirm.style.visibility = "hidden";

    // Start animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsConfirming(true);

        // Get final position
        const confirmRect = ticketConfirm.getBoundingClientRect();
        const confirmTransform = window.getComputedStyle(ticketConfirm).transform;

        ticketAnimation.style.top = `${confirmRect.top}px`;
        ticketAnimation.style.left = `${confirmRect.left}px`;
        ticketAnimation.style.transform = confirmTransform;

        // After animation completes
        setTimeout(() => {
          ticketAnimation.style.display = "none";
          ticketConfirm.style.visibility = "visible";
        }, 300);
      });
    });
  };

  function handleConfirmRegistration() {
    if (!selectedTicket || typeof window === "undefined") return;

    const params = new URLSearchParams();
    params.set("ticket", selectedTicket.id);
    params.set("ticketType", selectedTicket.name);
    params.set("eventName", eventName);

    try {
      const invitationCode = sessionStorage.getItem("invitationCode");
      const referralCode = sessionStorage.getItem("referralCode");

      if (invitationCode) {
        params.set("invite", invitationCode);
      }

      if (referralCode) {
        params.set("ref", referralCode);
      }
    } catch (error) {
      console.warn("Unable to read codes from sessionStorage", error);
    }

    window.location.href = `form/?${params.toString()}`;
  };

  function closeConfirm() {
    setIsConfirming(false);
    setSelectedTicket(null);

    // Restore visibility of hidden ticket
    if (hiddenTicketRef.current) {
      hiddenTicketRef.current.style.visibility = "visible";
      hiddenTicketRef.current = null;
    }

    // Hide animation ticket
    if (ticketAnimationRef.current) {
      ticketAnimationRef.current.style.display = "none";
    }
  }

  return (
    <>
      <div className="tickets-container">
        {isLoading && tickets.length === 0 ? <p>Loading...</p> : null}
        {!isLoading && tickets.length === 0 ? <p>{t.selectTicketHint}</p> : null}
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="ticket"
            role="button"
            tabIndex={0}
            onClick={(e) => handleTicketSelect(ticket, e.currentTarget)}
            onKeyDown={event => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleTicketSelect(ticket, event.currentTarget);
              }
            }}
          >
            <h3>{ticket.name}</h3>
            <p>
              {t.time}{ticket.saleStart} - {ticket.saleEnd}
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
              <h3>{selectedTicket.name}</h3>
              <p>
                {t.time}{selectedTicket.saleStart} - {selectedTicket.saleEnd}
              </p>
              <p className="remain">
                {t.remaining} {selectedTicket.quantity - selectedTicket.soldCount} / {selectedTicket.quantity}
              </p>
            </div>
            <div className="content">
              <h2>{selectedTicket.name}</h2>
              <p>{t.selectTicketHint}</p>
              {selectedTicket.price ? <p>NT$ {selectedTicket.price}</p> : null}
            </div>
          </div>
        ) : null}
        <a
          className="button"
          href="#"
          onClick={event => {
            event.preventDefault();
            handleConfirmRegistration();
          }}
        >
          {t.confirm}
        </a>
      </Confirm>

      {/* Animation ticket */}
      <div className="ticket" id="ticketAnimation" ref={ticketAnimationRef}>
        {selectedTicket ? (
          <>
            <h3>{selectedTicket.name}</h3>
            <p>
              {t.time}{selectedTicket.saleStart} - {selectedTicket.saleEnd}
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
