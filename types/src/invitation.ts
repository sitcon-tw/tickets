/**
 * Invitation code types and schemas
 */

import { z } from "zod/v4";
import { LocalizedTextSchema } from "./common.js";

/**
 * Invitation code entity
 */
export const InvitationCodeSchema = z.object({
	id: z.string(),
	ticketId: z.string(),
	code: z.string(),
	name: z.string().nullable().optional(),
	usageLimit: z.number().int().min(1).nullable().optional(),
	usedCount: z.number().int().min(0),
	validFrom: z.coerce.date().nullable().optional(),
	validUntil: z.coerce.date().nullable().optional(),
	isActive: z.boolean(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date()
});
export type InvitationCode = z.infer<typeof InvitationCodeSchema>;

/**
 * Invitation code with extra info
 */
export const InvitationCodeInfoSchema = InvitationCodeSchema;
export type InvitationCodeInfo = z.infer<typeof InvitationCodeInfoSchema>;

/**
 * Invitation code create request
 */
export const InvitationCodeCreateRequestSchema = z.object({
	ticketId: z.string(),
	code: z.string().min(1),
	name: z.string().optional(),
	// null = no limit / no bound (z.coerce.date() alone would turn null into 1970-01-01)
	usageLimit: z.number().int().min(1).nullable().optional(),
	validFrom: z.coerce.date().nullable().optional(),
	validUntil: z.coerce.date().nullable().optional()
});
export type InvitationCodeCreateRequest = z.infer<typeof InvitationCodeCreateRequestSchema>;

/**
 * Invitation code update request
 */
export const InvitationCodeUpdateRequestSchema = z.object({
	code: z.string().min(1).optional(),
	// null clears the value
	name: z.string().nullable().optional(),
	usageLimit: z.number().int().min(1).nullable().optional(),
	validFrom: z.coerce.date().nullable().optional(),
	validUntil: z.coerce.date().nullable().optional(),
	isActive: z.boolean().optional(),
	ticketId: z.string().optional()
});
export type InvitationCodeUpdateRequest = z.infer<typeof InvitationCodeUpdateRequestSchema>;

/**
 * Bulk invitation code create request (codes are generated)
 */
export const InvitationCodeBulkCreateRequestSchema = z.object({
	ticketId: z.string(),
	name: z.string().min(1),
	count: z.number().int().min(1).max(100),
	usageLimit: z.number().int().min(1).optional(),
	validFrom: z.coerce.date().optional(),
	validUntil: z.coerce.date().optional()
});
export type InvitationCodeBulkCreateRequest = z.infer<typeof InvitationCodeBulkCreateRequestSchema>;

/**
 * Send an invitation code by email
 */
export const InvitationCodeSendEmailRequestSchema = z.object({
	email: z.email(),
	code: z.string(),
	// Codes are only unique per ticket, so callers should pass the ticket the code belongs to
	ticketId: z.string().optional(),
	message: z.string().max(5000).default("").optional()
});
export type InvitationCodeSendEmailRequest = z.infer<typeof InvitationCodeSendEmailRequestSchema>;

/**
 * Invitation code verify request
 */
export const InvitationCodeVerifyRequestSchema = z.object({
	code: z.string().min(1),
	ticketId: z.string()
});
export type InvitationCodeVerifyRequest = z.infer<typeof InvitationCodeVerifyRequestSchema>;

/**
 * Invitation code verification response
 */
export const InvitationCodeVerificationSchema = z.object({
	valid: z.boolean(),
	message: z.string().optional(),
	invitationCode: z
		.object({
			id: z.string(),
			code: z.string(),
			name: z.string().nullable().optional(),
			usedCount: z.number().int().min(0),
			usageLimit: z.number().int().min(1).nullable().optional(),
			validFrom: z.coerce.date().nullable().optional(),
			validUntil: z.coerce.date().nullable().optional(),
			ticketId: z.string()
		})
		.optional(),
	availableTickets: z
		.array(
			z.object({
				id: z.string(),
				name: LocalizedTextSchema,
				description: LocalizedTextSchema.nullable().optional(),
				plainDescription: LocalizedTextSchema.nullable().optional(),
				price: z.number().min(0),
				quantity: z.number().int().min(0),
				soldCount: z.number().int().min(0),
				available: z.number().int().min(0),
				isOnSale: z.boolean()
			})
		)
		.optional()
});
export type InvitationCodeVerification = z.infer<typeof InvitationCodeVerificationSchema>;
