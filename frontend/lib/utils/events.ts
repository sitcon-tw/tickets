import type { PublicEventListItem } from "@sitcontix/types";

/** Upcoming events first (soonest first), then past events (most recent first). */
export function sortEventsForDisplay<T extends Pick<PublicEventListItem, "startDate">>(events: T[], now = new Date()): T[] {
	return [...events].sort((a, b) => {
		const aIsUpcoming = a.startDate >= now;
		const bIsUpcoming = b.startDate >= now;

		if (aIsUpcoming && !bIsUpcoming) return -1;
		if (!aIsUpcoming && bIsUpcoming) return 1;

		return aIsUpcoming ? a.startDate.getTime() - b.startDate.getTime() : b.startDate.getTime() - a.startDate.getTime();
	});
}
