"use client";

import { useEffect, useMemo, useState } from "react";
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
  }, []);

  function handleTicketSelect(ticket: Ticket) {
    setSelectedTicket(ticket);

    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem("selectedTicketId", ticket.id);
      sessionStorage.setItem("selectedTicketName", ticket.name);
      sessionStorage.setItem("selectedEventName", eventName);
    } catch (error) {
      console.warn("Unable to access sessionStorage", error);
    }
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

  function closeConfirm() {setSelectedTicket(null);}

  return (
    <section>
      <div>
        {isLoading && tickets.length === 0 ? <p>Loading...</p> : null}
        {!isLoading && tickets.length === 0 ? <p>{t.selectTicketHint}</p> : null}
        {tickets.map((ticket, index) => (
          <div
            key={ticket.id}
            role="button"
            tabIndex={0}
            onClick={() => handleTicketSelect(ticket)}
            onKeyDown={event => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleTicketSelect(ticket);
              }
            }}
            style={{
              border: "solid 3px var(--color-gray-500)",
              padding: "1rem",
              margin: "0 auto 2rem",
              maxWidth: "350px",
              transform: index % 2 === 0 ? "rotate(1.17deg)" : "rotate(-1.17deg)",
              transition: "transform 0.3s ease",
              cursor: "pointer",
              backgroundColor: "var(--color-gray-800)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = index % 2 === 0 ? "rotate(1.17deg) scale(1.05)" : "rotate(-1.17deg) scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = index % 2 === 0 ? "rotate(1.17deg)" : "rotate(-1.17deg)";
            }}
          >
            <h3>{ticket.name}</h3>
            <p>
              {t.time}
              {ticket.saleStart}
              -
              {ticket.saleEnd}
            </p>
            <p style={{ textAlign: "right" }}>
              {t.remaining} {ticket.available} / {ticket.quantity}
            </p>
          </div>
        ))}
      </div>

      <Confirm isOpen={Boolean(selectedTicket)} onClose={closeConfirm}>
        {selectedTicket ? (
          <div
            style={{
              display: "flex",
              flexDirection: window.innerWidth >= 768 ? "row" : "column",
              gap: "1.5rem",
              alignItems: window.innerWidth >= 768 ? "flex-start" : "stretch"
            }}
          >
            <div
              style={{
                border: "solid 3px var(--color-gray-500)",
                padding: "1rem",
                margin: "0 auto 2rem",
                maxWidth: "350px",
                transform: "rotate(1.17deg)",
                transition: "transform 0.3s ease",
                cursor: "pointer",
                backgroundColor: "var(--color-gray-800)",
                visibility: "hidden",
                pointerEvents: "none"
              }}
            >
              <h3>{selectedTicket.name}</h3>
              <p>
                {t.time}
                {selectedTicket.saleStart}
                -
                {selectedTicket.saleEnd}
              </p>
              <p style={{ textAlign: "right" }}>
                {t.remaining} {selectedTicket.quantity - selectedTicket.soldCount} / {selectedTicket.quantity}
              </p>
            </div>
            <div style={{ maxWidth: "400px" }}>
              <h2>{selectedTicket.name}</h2>
              <p>{t.selectTicketHint}</p>
              {selectedTicket.price ? <p>NT$ {selectedTicket.price}</p> : null}
            </div>
          </div>
        ) : null}
        <a
          style={{
            margin: "1.5rem auto 0",
            display: "inline-block"
          }}
          href="#"
          onClick={event => {
            event.preventDefault();
            handleConfirmRegistration();
          }}
        >
          {t.confirm}
        </a>
      </Confirm>
    </section>
  );
}
