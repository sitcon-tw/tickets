"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Confirm from "@/components/Confirm";
import * as i18n from "@/i18n";
import { eventsAPI } from "@/lib/api/endpoints";
import { Ticket } from "@/lib/types/api";

export default function Tickets() {
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  const lang = i18n.local(currentPath);

  const t = useMemo(
    () =>
      i18n.t(lang, {
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
      }),
    [lang]
  );

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
              saleStart: ticket.saleStart ? new Date(ticket.saleStart).toLocaleString(lang) : "N/A",
              saleEnd: ticket.saleEnd ? new Date(ticket.saleEnd).toLocaleString(lang) : "N/A"
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
      <div className="tickets-container">
        {isLoading && tickets.length === 0 ? <p>Loading...</p> : null}
        {!isLoading && tickets.length === 0 ? <p>{t.selectTicketHint}</p> : null}
        {tickets.map(ticket => (
          <div
            key={ticket.id}
            className="ticket"
            role="button"
            tabIndex={0}
            onClick={() => handleTicketSelect(ticket)}
            onKeyDown={event => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleTicketSelect(ticket);
              }
            }}
          >
            <h3>{ticket.name}</h3>
            <p>
              {t.time}
              {ticket.saleStart}
              -
              {ticket.saleEnd}
            </p>
            <p className="remain">
              {t.remaining} {ticket.available} / {ticket.quantity}
            </p>
          </div>
        ))}
      </div>

      <Confirm isOpen={Boolean(selectedTicket)} onClose={closeConfirm}>
        {selectedTicket ? (
          <div className="confirm-content">
            <div className="ticket ticketConfirm">
              <h3>{selectedTicket.name}</h3>
              <p>
                {t.time}
                {selectedTicket.saleStart}
                -
                {selectedTicket.saleEnd}
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
        <a className="button" href="#" onClick={event => {
          event.preventDefault();
          handleConfirmRegistration();
        }}>
          {t.confirm}
        </a>
      </Confirm>

      <style jsx>{`
        .tickets-container > .ticket:nth-child(2n) {
          transform: rotate(-1.17deg);
        }

        .about + .button {
          margin-top: 2rem;
        }

        .ticket {
          border: solid 3px var(--color-gray-500);
          padding: 1rem;
          margin: 0 auto 2rem;
          max-width: 350px;
          transform: rotate(1.17deg);
          transition: transform 0.3s ease;
          cursor: pointer;
          background-color: var(--color-gray-800);
        }

        .ticket:hover {
          transform: rotate(1.17deg) scale(1.05);
        }

        .tickets-container > .ticket:nth-child(2n):hover {
          transform: rotate(-1.17deg) scale(1.05);
        }

        .remain {
          text-align: right;
        }

        #ticketAnimation {
          display: none;
          position: fixed;
          transition: none;
          z-index: 500;
          width: 100%;
        }

        .confirming + #ticketAnimation {
          transition: 0.3s ease-in-out;
        }

        .ticketConfirm {
          visibility: hidden;
          pointer-events: none;
        }

        .confirm-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .confirm-content {
            flex-direction: row;
            align-items: flex-start;
          }
        }

        .content {
          max-width: 400px;
        }

        .button {
          margin: 1.5rem auto 0;
          display: inline-block;
        }
      `}</style>
    </section>
  );
}
