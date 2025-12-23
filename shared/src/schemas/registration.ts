import { z } from "zod";

/**
 * Registration schemas
 */

export const registrationStatusSchema = z.enum([
	"pending",
	"confirmed",
	"cancelled",
	"waitlisted",
]);

export const registrationCreateSchema = z.object({
	eventId: z.cuid(),
	ticketId: z.cuid(),
	invitationCode: z.string().optional(),
	referralCode: z.string().optional(),
	formData: z.record(z.string(), z.any()),
});

export const registrationUpdateSchema = z.object({
	formData: z.record(z.string(), z.any()).optional(),
	status: registrationStatusSchema.optional(),
});

/**
 * Type exports
 */
export type RegistrationStatus = z.infer<typeof registrationStatusSchema>;
export type RegistrationCreateRequest = z.infer<
	typeof registrationCreateSchema
>;
export type RegistrationUpdateRequest = z.infer<
	typeof registrationUpdateSchema
>;
