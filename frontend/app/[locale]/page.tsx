import EventList from "@/components/home/EventList";
import Hero from "@/components/home/Hero";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "SITCONTIX",
	description: "Register for SITCON events and manage your tickets."
};

export default function HomePage() {
	return (
		<div className="mt-20 max-w-6xl mx-auto">
			<Hero />
			<EventList />
		</div>
	);
}
