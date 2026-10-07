/**
 * Admin check-in types and schemas
 */

import { z } from "zod/v4";
import { LocalizedTextSchema, RegistrationStatusSchema } from "./common.js";

/**
 * One attendee row in the check-in tools
 */
export const CheckInAttendeeSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	email: z.string(),
	name: z.string().nullable(),
	phoneNumber: z.string().nullable(),
	status: RegistrationStatusSchema,
	ticketName: LocalizedTextSchema,
	formData: z.record(z.string(), z.unknown()),
	/** The token encoded in the attendee's ticket QR code */
	qrToken: z.string(),
	checkedIn: z.boolean(),
	checkedInAt: z.coerce.date().nullable(),
	createdAt: z.coerce.date()
});
export type CheckInAttendee = z.infer<typeof CheckInAttendeeSchema>;

/**
 * Check-in / undo check-in request
 */
export const CheckInUpdateRequestSchema = z.object({
	checkedIn: z.boolean()
});
export type CheckInUpdateRequest = z.infer<typeof CheckInUpdateRequestSchema>;

/**
 * Result of a check-in change.
 * `alreadyCheckedIn` is true when someone else (e.g. another desk) checked the attendee in first.
 */
export const CheckInResultSchema = z.object({
	id: z.string(),
	checkedIn: z.boolean(),
	checkedInAt: z.coerce.date().nullable(),
	alreadyCheckedIn: z.boolean()
});
export type CheckInResult = z.infer<typeof CheckInResultSchema>;
