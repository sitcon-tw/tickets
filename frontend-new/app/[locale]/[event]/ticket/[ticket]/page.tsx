"use client";

import { useEffect, useState } from "react"
import { Ticket } from "@/lib/types/api";
import { useAlert } from "@/contexts/AlertContext";
import { useLocale } from "next-intl";
import { getTranslations } from "@/i18n/helpers";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { eventsAPI, ticketsAPI } from "@/lib/api/endpoints";
import PageSpinner from "@/components/PageSpinner";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function SetTicket() {
  const { showAlert } = useAlert();
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();

  const t = getTranslations(locale, {
    ticketSaleEnded: {
      "zh-Hant": "票券銷售已結束。",
      "zh-Hans": "票券销售已结束。",
      en: "Ticket sale has ended."
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
    }
  });

  const [isLoading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Helper function to check if ticket sale has ended
	const isTicketExpired = (ticket: Ticket): boolean => {
		if (!ticket.saleEnd) return false;
		const saleEndDate = typeof ticket.saleEnd === 'string' && ticket.saleEnd !== 'N/A'
			? new Date(ticket.saleEnd)
			: null;
		if (!saleEndDate) return false;
		return saleEndDate < new Date();
	};

	// Helper function to check if ticket is sold out
	const isTicketSoldOut = (ticket: Ticket): boolean => {
		return ticket.available !== undefined && ticket.available <= 0;
	};

  async function fetchEvent() {
    const eventSlug = params.event as string;
    try {
      const eventsData = await eventsAPI.getAll();

      if (eventsData?.success && Array.isArray(eventsData.data)) {
        // Find event by last 6 characters of ID
        const foundEvent = eventsData.data.find(e => e.id.slice(-6) === eventSlug);

        if (foundEvent) {
          return foundEvent.id;
        } else {
          showAlert("Event not found", "error");
        }
      } else {
        showAlert("Failed to load events", "error");
      }
    } catch (err) {
      console.error("Failed to load event:", err);
      showAlert("Failed to load event", "error");
    }
  }

  async function fetchTicket() {
    const ticketId = params.ticket as string;
    try {
      const ticketData = await ticketsAPI.getTicket(ticketId);

      if (ticketData?.success && ticketData.data) {
        const foundTicket = ticketData.data;

        if (foundTicket) {
          return foundTicket;
        } else {
          showAlert("Ticket not found", "error");
        }
      } else {
        showAlert("Failed to load tickets", "error");
      }
    } catch (err) {
      console.error("Failed to load ticket:", err);
      showAlert("Failed to load ticket", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleTicketSelect(ticket: Ticket, eventId: string) {
		// Check if ticket sale has ended
		if (isTicketExpired(ticket)) {
			showAlert(t.ticketSaleEnded, "warning");
			return;
		}

		// Check if ticket is sold out
		if (isTicketSoldOut(ticket)) {
			showAlert(t.ticketSoldOut, "warning");
			return;
		}

    const referralCode = new URLSearchParams(window.location.search).get("ref");
    const invitationCode = new URLSearchParams(window.location.search).get("inv");

		try {
			const formData = {
				ticketId: ticket.id,
				eventId: eventId,
				referralCode: referralCode || localStorage.getItem("referralCode") || undefined,
        invitationCode: invitationCode || localStorage.getItem("invitationCode") || undefined
			};
			localStorage.setItem("formData", JSON.stringify(formData));
		} catch (error) {
			console.warn("Unable to access localStorage", error);
		}
	}

  useEffect(() => {
    const event = fetchEvent();
    const ticket = fetchTicket();

    Promise.all([event, ticket]).then(values => {
      const [eventId, ticketData] = values;
      if (eventId && ticketData) {
        handleTicketSelect(ticketData, eventId);
        router.push(`/${params.event}/form`);
      } else {
        setLoading(false);
      }
    });
  }, []);
  return (
    <>
    <Nav />
    {
      isLoading ? (
        <main>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh"
            }}
          >
            <PageSpinner size={48} />
          </div>
        </main>
      ) : (
        <main>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
              padding: "1rem",
              textAlign: "center"
            }}
          >
            <h1 className="text-3xl font-bold mb-4">{hasError ? t.error : t.redirecting}</h1>
          </div>
        </main>
      )
    }
    <Footer />
    </>
  )
}