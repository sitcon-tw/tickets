import { z } from "zod";
import { invitationCodeSchema, localizedTextSchema, formFieldTypeSchema } from "@tickets/shared";

/**
 * API-specific Zod schemas
 * Backend-only API response types
 */

// Public ticket response schema
export const publicTicketResponseSchema = z.object({
	id: z.string(),
	name: localizedTextSchema,
	description: localizedTextSchema.nullable(),
	plainDescription: localizedTextSchema.nullable(),
	price: z.number(),
	quantity: z.number().int(),
	soldCount: z.number().int(),
	available: z.number().int(),
	saleStart: z.date().nullable(),
	saleEnd: z.date().nullable(),
	isOnSale: z.boolean(),
	isSoldOut: z.boolean(),
	requireInviteCode: z.boolean(),
	requireSmsVerification: z.boolean(),
});

// InvitationCodeResponse - extends InvitationCode with additional fields
export const invitationCodeResponseSchema = invitationCodeSchema.extend({
	ticketName: z.string(),
	eventName: z.string(),
	eventId: z.string(),
	remainingUses: z.number().int().nullable(),
});

// AnalyticsData schema
export const analyticsDataSchema = z.object({
	totalRegistrations: z.number().int(),
	confirmedRegistrations: z.number().int(),
	pendingRegistrations: z.number().int(),
	cancelledRegistrations: z.number().int(),
	totalRevenue: z.number(),
	registrationsByTicket: z.array(z.object({
		ticketId: z.string(),
		ticketName: z.string(),
		count: z.number().int(),
		revenue: z.number(),
	})),
	registrationsByDate: z.array(z.object({
		date: z.string(),
		count: z.number().int(),
	})),
	topReferrals: z.array(z.object({
		referralCode: z.string(),
		userId: z.string(),
		userName: z.string(),
		count: z.number().int(),
	})).optional(),
});

// Public form field response schema
export const publicFormFieldResponseSchema = z.object({
	id: z.string(),
	name: localizedTextSchema,
	description: localizedTextSchema,
	type: formFieldTypeSchema,
	required: z.boolean(),
	options: z.array(z.any()),
	validater: z.string().nullable(),
	placeholder: z.string().nullable(),
	order: z.number().int(),
	filters: z.record(z.string(), z.any()),
	prompts: z.record(z.string(), z.any()),
});

/**
 * Type exports
 */
export type PublicTicketResponse = z.infer<typeof publicTicketResponseSchema>;
export type InvitationCodeResponse = z.infer<typeof invitationCodeResponseSchema>;
export type AnalyticsData = z.infer<typeof analyticsDataSchema>;
export type PublicFormFieldResponse = z.infer<typeof publicFormFieldResponseSchema>;
