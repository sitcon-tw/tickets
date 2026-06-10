import { generateMetadata as generateTicketMetadata } from "./layout";
import TicketPage from "./ticket-client";

export function generateMetadata(props: Parameters<typeof generateTicketMetadata>[0]) {
	return generateTicketMetadata(props);
}

export default function TicketRoutePage() {
	return <TicketPage />;
}
