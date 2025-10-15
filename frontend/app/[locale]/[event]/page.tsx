"use client";

import Header from "@/components/home/Header";
import Info from "@/components/home/Info";
import Tickets from "@/components/home/Tickets";
import Welcome from "@/components/home/Welcome";
import PageSpinner from "@/components/PageSpinner";
import { eventsAPI } from "@/lib/api/endpoints";
import { EventListItem } from "@/lib/types/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Main() {
	const params = useParams();
	const router = useRouter();
	const eventSlug = params.event as string;

	const [event, setEvent] = useState<EventListItem | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchEvent() {
			try {
				const eventsData = await eventsAPI.getAll();

				if (eventsData?.success && Array.isArray(eventsData.data)) {
					// Find event by last 6 characters of ID
					const foundEvent = eventsData.data.find(e => e.id.slice(-6) === eventSlug);

					if (foundEvent) {
						setEvent(foundEvent);
					} else {
						setError("Event not found");
					}
				} else {
					setError("Failed to load events");
				}
			} catch (err) {
				console.error("Failed to load event:", err);
				setError("Failed to load event");
			} finally {
				setLoading(false);
			}
		}

		fetchEvent();

		const urlParams = new URLSearchParams(window.location.search);
		const referralCode = urlParams.get("ref");
		const invitationCode = urlParams.get("inv");

		if (referralCode) {
			localStorage.setItem("referralCode", referralCode);
			router.refresh();
		}
		if (invitationCode) {
			localStorage.setItem("invitationCode", invitationCode);
			router.refresh();
		}
	}, [eventSlug, router]);

	if (loading) {
		return (
			<>
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
			</>
		);
	}

	if (error || !event) {
		return (
			<>
				<main>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							height: "100vh",
							gap: "1rem"
						}}
					>
						<h1>Event Not Found</h1>
						<p>{error}</p>
					</div>
				</main>
			</>
		);
	}

	return (
		<>
			<main>
				<Header eventId={event.id} />
				<Welcome eventId={event.id} eventSlug={eventSlug} />
				<Tickets eventId={event.id} eventSlug={eventSlug} />
				<Info eventId={event.id} />
			</main>
		</>
	);
}
