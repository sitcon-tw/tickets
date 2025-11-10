import EventList from "@/components/home/EventList";
import Hero from "@/components/home/Hero";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function HomePage() {
	return (
		<>
			<Nav />
			<main>
				<Hero />
				<EventList />
			</main>
			<Footer />
		</>
	);
}
