import EventList from "@/components/home/EventList";
import Hero from "@/components/home/Hero";

export default function HomePage() {
	return (
		<div className="mt-20 max-w-6xl mx-auto">
			<Hero />
			<EventList />
		</div>
	);
}
