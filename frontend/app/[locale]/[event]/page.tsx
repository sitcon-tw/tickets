import EventPage from "./event-client";
import { generateMetadata as generateEventMetadata } from "./layout";

export function generateMetadata(props: Parameters<typeof generateEventMetadata>[0]) {
	return generateEventMetadata(props);
}

export default function EventRoutePage() {
	return <EventPage />;
}
