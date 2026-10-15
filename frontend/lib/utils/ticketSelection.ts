import { z } from "zod/v4";

/** localStorage key of the ticket picked on the event / ticket page, read by the registration form. */
export const ticketSelectionStorageKey = "formData:v1";
/** Key used before the value was versioned; only read (and removed) for migration. */
export const legacyTicketSelectionStorageKey = "formData";

const StoredTicketSelectionSchema = z.object({
	ticketId: z.string().optional().catch(undefined),
	eventId: z.string().optional().catch(undefined),
	referralCode: z.string().optional().catch(undefined),
	invitationCode: z.string().optional().catch(undefined)
});
export type StoredTicketSelection = z.infer<typeof StoredTicketSelectionSchema>;

/** The stored ticket selection, or null when there is none or it is not valid JSON of the expected shape. Throws if localStorage is unavailable. */
export function readStoredTicketSelection(): StoredTicketSelection | null {
	const raw = localStorage.getItem(ticketSelectionStorageKey) || localStorage.getItem(legacyTicketSelectionStorageKey);
	if (!raw) return null;
	try {
		const parsed = StoredTicketSelectionSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

/** Replaces the stored ticket selection (and drops the legacy key). Throws if localStorage is unavailable. */
export function writeStoredTicketSelection(selection: StoredTicketSelection): void {
	localStorage.setItem(ticketSelectionStorageKey, JSON.stringify(selection));
	localStorage.removeItem(legacyTicketSelectionStorageKey);
}
