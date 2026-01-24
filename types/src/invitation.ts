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
	validFrom: z.date().nullable().optional(),
	validUntil: z.date().nullable().optional(),
	isActive: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date()
});
export type InvitationCode = z.infer<typeof InvitationCodeSchema>;

/**
 * Invitation code with extra info
 */
export const InvitationCodeInfoSchema = InvitationCodeSchema.extend({
	description: z.string().optional(),
	expiresAt: z.date().optional()
});
export type InvitationCodeInfo = z.infer<typeof InvitationCodeInfoSchema>;

/**
 * Invitation code create request
 */
export const InvitationCodeCreateRequestSchema = z.object({
	ticketId: z.string(),
	code: z.string().min(1),
	name: z.string().optional(),
	usageLimit: z.number().int().min(1).optional(),
	validFrom: z.date().optional(),
	validUntil: z.date().optional()
});
export type InvitationCodeCreateRequest = z.infer<typeof InvitationCodeCreateRequestSchema>;

/**
 * Invitation code update request
 */
export const InvitationCodeUpdateRequestSchema = z.object({
	code: z.string().min(1).optional(),
	name: z.string().optional(),
	usageLimit: z.number().int().min(1).optional(),
	validFrom: z.date().optional(),
	validUntil: z.date().optional(),
	isActive: z.boolean().optional(),
	ticketId: z.string().optional()
});
export type InvitationCodeUpdateRequest = z.infer<typeof InvitationCodeUpdateRequestSchema>;

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
			description: z.string().optional(),
			usedCount: z.number().int().min(0),
			usageLimit: z.number().int().min(1).nullable().optional(),
			validFrom: z.date().nullable().optional(),
			validUntil: z.date().nullable().optional(),
			ticketId: z.string(),
			expiresAt: z.date().optional()
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
