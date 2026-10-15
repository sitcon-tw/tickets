import type { RegistrationStatus } from "@sitcontix/types";

const statusPriority: Record<RegistrationStatus, number> = {
	confirmed: 0,
	pending: 1,
	cancelled: 2
};

type EventRegistrationLike = {
	status: RegistrationStatus;
	createdAt?: Date;
	event?: { id: string } | null;
};

/**
 * Pick the registration that best represents the user's state for an event.
 * A user can have several rows per event (an unfinished seat hold, older cancelled ones),
 * so confirmed wins over pending, pending over cancelled, and newer rows win within a status.
 */
export function findEventRegistration<T extends EventRegistrationLike>(registrations: readonly T[], eventId: string): T | undefined {
	let best: T | undefined;
	for (const registration of registrations) {
		if (registration.event?.id !== eventId) continue;
		if (!best) {
			best = registration;
			continue;
		}
		const priorityDiff = statusPriority[registration.status] - statusPriority[best.status];
		const isNewer = (registration.createdAt?.getTime() ?? 0) > (best.createdAt?.getTime() ?? 0);
		if (priorityDiff < 0 || (priorityDiff === 0 && isNewer)) {
			best = registration;
		}
	}
	return best;
}
