"use client";

import MarkdownContent from "../MarkdownContent";
import { eventsAPI } from "@/lib/api/endpoints";
import { useState, useEffect } from "react";
import PageSpinner from "../PageSpinner";

interface InfoProps {
  eventId: string;
}

export default function Info({ eventId }: InfoProps) {
  const [eventDescription, setEventDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const eventData = await eventsAPI.getInfo(eventId);
        if (eventData?.success && eventData.data) {
          setEventDescription(eventData.data.description || "");
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
  }, [eventId]);

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
