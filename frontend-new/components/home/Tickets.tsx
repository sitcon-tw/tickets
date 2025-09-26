"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Confirm from "@/components/Confirm";
import * as i18n from "@/i18n";

type Ticket = {
  id: string;
  name: string;
  time: string;
  remaining: string;
  price?: number;
  isOnSale?: boolean;
  isSoldOut?: boolean;
  formFields?: unknown[];
};

type TicketsResponse = {
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    saleStart?: string | null;
    saleEnd?: string | null;
    available: number;
    quantity: number;
    price?: number;
    isOnSale?: boolean;
    isSoldOut?: boolean;
    formFields?: unknown[];
  }>;
};

const fallbackTickets: Record<string, { en: string; time: string; remaining: string }> = {
  學生票: { en: "Student", time: "8/15 - 8/20", remaining: "50 / 200" },
  一般票: { en: "General", time: "8/15 - 8/20", remaining: "100 / 300" },
  遠道而來票: { en: "Long Distance", time: "8/15 - 8/20", remaining: "30 / 100" },
  邀請票: { en: "Invite", time: "8/15 - 8/20", remaining: "10 / 50" },
  開源貢獻票: {
    en: "Open Source Contribution",
    time: "8/15 - 8/20",
    remaining: "5 / 20"
  }
};

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
    let cancelled = false;

    const loadTickets = async () => {
      try {
        const eventsResponse = await fetch("http://localhost:3000/api/events");
        const eventsData = await eventsResponse.json();

        if (eventsData?.success && Array.isArray(eventsData.data) && eventsData.data.length > 0) {
          const event = eventsData.data[0];
          setEventName(event.name || "SITCON 2025");

          const ticketsResponse = await fetch(`http://localhost:3000/api/events/${event.id}/tickets`);
          const ticketsData: TicketsResponse = await ticketsResponse.json();

          if (ticketsData.success && Array.isArray(ticketsData.data) && !cancelled) {
            setTickets(
              ticketsData.data.map(ticket => ({
                id: ticket.id,
                name: ticket.name,
                time: `${ticket.saleStart ? new Date(ticket.saleStart).toLocaleDateString() : "TBD"} - ${
                  ticket.saleEnd ? new Date(ticket.saleEnd).toLocaleDateString() : "TBD"
                }`,
                remaining: `${ticket.available} / ${ticket.available + (ticket.quantity - ticket.available)}`,
                price: ticket.price,
                isOnSale: ticket.isOnSale,
                isSoldOut: ticket.isSoldOut,
                formFields: ticket.formFields
              }))
            );
            return;
          }
        }
      } catch (error) {
        console.error("Failed to load tickets", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }

      if (!cancelled) {
        setTickets(
          Object.entries(fallbackTickets).map(([id, info]) => ({
            id,
            name: id,
            time: info.time,
            remaining: info.remaining
          }))
        );
      }
    };

    loadTickets();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleTicketSelect = (ticket: Ticket) => {
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

  const handleConfirmRegistration = () => {
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

    window.location.href = `/form/?${params.toString()}`;
  };

  const closeConfirm = () => setSelectedTicket(null);

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
              {ticket.time}
            </p>
            <p className="remain">
              {t.remaining} {ticket.remaining}
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
                {selectedTicket.time}
              </p>
              <p className="remain">
                {t.remaining} {selectedTicket.remaining}
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

        .ticketConfirm {
          visibility: visible;
          pointer-events: none;
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
