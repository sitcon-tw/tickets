"use client";

import { useLocale } from "next-intl";
import { getTranslations } from "@/i18n/helpers";
import MarkdownContent from "../MarkdownContent";
import { eventsAPI } from "@/lib/api/endpoints";
import { Event } from "@/lib/types/api";
import { useState, useEffect } from "react";
import PageSpinner from "../PageSpinner";

export default function Info() {
  const locale = useLocale();
  const [eventDescription, setEventDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const eventsData = await eventsAPI.getAll();
        if (eventsData?.success && Array.isArray(eventsData.data) && eventsData.data.length > 0) {
          const event: Event = eventsData.data[0];
          setEventDescription(event.description || "");
        } else {
          setLoadError("No event data available.");
        }
      } catch (error) {
        console.error("Failed to load event data:", error);
        setLoadError("Failed to load event data.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvent();
  }, []);

  return (
    <section className="content"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}
    >
      {isLoading && <PageSpinner size={48} />}
      {loadError && <p>Error: {loadError}</p>}
      {eventDescription && <MarkdownContent content={eventDescription} />}
    </section>
  );
}
