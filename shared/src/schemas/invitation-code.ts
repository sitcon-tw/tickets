import { z } from "zod";

/**
 * Invitation Code schemas
 */

export const invitationCodeCreateSchema = z.object({
	eventId: z.cuid(),
	code: z.string().min(1),
	name: z.string().optional(),
	usageLimit: z.number().int().positive().default(1).optional(),
	validFrom: z.string().optional(),
	validUntil: z.string().optional(),
	ticketId: z.cuid().optional(),
});

export const invitationCodeUpdateSchema = z.object({
	code: z.string().min(1).optional(),
	name: z.string().optional(),
	usageLimit: z.number().int().positive().optional(),
	validFrom: z.string().optional(),
	validUntil: z.string().optional(),
	isActive: z.boolean().optional(),
	ticketId: z.cuid().optional(),
});

export const invitationCodeVerifySchema = z.object({
	code: z.string().min(1),
	ticketId: z.cuid(),
});

export const invitationCodeBulkCreateSchema = z.object({
	ticketId: z.string(),
	prefix: z.string().min(1),
	count: z.number().int().min(1).max(100),
	usageLimit: z.number().int().min(1).optional(),
	validFrom: z.string().optional(),
	validUntil: z.string().optional(),
});

export const invitationCodeSendEmailSchema = z.object({
	email: z.string().email(),
	code: z.string(),
	message: z.string().optional(),
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
export type InvitationCodeBulkCreateRequest = z.infer<
	typeof invitationCodeBulkCreateSchema
>;
export type InvitationCodeSendEmailRequest = z.infer<
	typeof invitationCodeSendEmailSchema
>;
