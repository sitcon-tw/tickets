import EventList from "@/components/home/EventList";
import Hero from "@/components/home/Hero";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function HomePage() {
	return (
		<>
			<Nav />
			<main className="min-h-screen">
				<Hero />
				<EventList />
			</main>
			<Footer />
		</>
	);
}
