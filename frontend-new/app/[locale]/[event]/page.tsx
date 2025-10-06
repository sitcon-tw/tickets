"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from "@/components/home/Header";
import Welcome from "@/components/home/Welcome";
import Tickets from "@/components/home/Tickets";
import Info from "@/components/home/Info";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { eventsAPI } from "@/lib/api/endpoints";
import { EventListItem } from "@/lib/types/api";
import PageSpinner from "@/components/PageSpinner";

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
						setError('Event not found');
					}
				} else {
					setError('Failed to load events');
				}
			} catch (err) {
				console.error('Failed to load event:', err);
				setError('Failed to load event');
			} finally {
				setLoading(false);
			}
		}

		fetchEvent();

		const urlParams = new URLSearchParams(window.location.search);
		const referralCode = urlParams.get('ref');

		if (referralCode) {
			sessionStorage.setItem('referralCode', referralCode);
			router.refresh();
		}
	}, [eventSlug, router]);

	if (loading) {
		return (
			<>
				<Nav />
				<main>
					<div style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						height: '100vh'
					}}>
						<PageSpinner size={48} />
					</div>
				</main>
			</>
		);
	}

	if (error || !event) {
		return (
			<>
				<Nav />
				<main>
					<div style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						height: '100vh',
						gap: '1rem'
					}}>
						<h1>Event Not Found</h1>
						<p>{error}</p>
					</div>
				</main>
			</>
		);
	}

	return (
		<>
			<Nav />
			<main>
				<Header eventId={event.id} />
				<Welcome eventId={event.id} eventSlug={eventSlug} />
				<Tickets eventId={event.id} eventSlug={eventSlug} />
				<Info eventId={event.id} />
				<Footer />
			</main>
		</>
	);
};