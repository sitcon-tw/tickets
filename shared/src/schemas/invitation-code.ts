import { z } from "zod";

/**
 * Invitation Code schemas
 */

export const invitationCodeCreateSchema = z.object({
	eventId: z.string().uuid(),
	code: z.string().min(1),
	name: z.string().optional(),
	usageLimit: z.number().int().positive().default(1).optional(),
	validFrom: z.string().datetime().optional(),
	validUntil: z.string().datetime().optional(),
	ticketId: z.string().uuid().optional(),
});

export const invitationCodeUpdateSchema = z.object({
	code: z.string().min(1).optional(),
	name: z.string().optional(),
	usageLimit: z.number().int().positive().optional(),
	validFrom: z.string().datetime().optional(),
	validUntil: z.string().datetime().optional(),
	isActive: z.boolean().optional(),
	ticketId: z.string().uuid().optional(),
});

export const invitationCodeVerifySchema = z.object({
	code: z.string().min(1),
	ticketId: z.string().uuid(),
});

/**
 * Type exports
 */
export type InvitationCodeCreateRequest = z.infer<
	typeof invitationCodeCreateSchema
>;
export type InvitationCodeUpdateRequest = z.infer<
	typeof invitationCodeUpdateSchema
>;
export type InvitationCodeVerifyRequest = z.infer<
	typeof invitationCodeVerifySchema
>;
