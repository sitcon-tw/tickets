/**
 * Registration types and schemas
 */

import { z } from "zod/v4";
import { LocalizedTextSchema, RegistrationStatusSchema } from "./common.js";

/**
 * Registration entity
 */
export const RegistrationSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	ticketId: z.string(),
	email: z.string().email(),
	status: RegistrationStatusSchema,
	referredBy: z.string().nullable().optional(),
	formData: z.record(z.string(), z.unknown()),
	tags: z.array(z.string()).nullable().optional(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	event: z
		.object({
			id: z.string(),
			name: LocalizedTextSchema,
			description: LocalizedTextSchema.nullable().optional(),
			plainDescription: LocalizedTextSchema.nullable().optional(),
			location: z.string().nullable().optional(),
			startDate: z.string().datetime(),
			endDate: z.string().datetime(),
			slug: z.string().nullable().optional(),
		})
		.optional(),
	ticket: z
		.object({
			id: z.string(),
			name: LocalizedTextSchema,
			description: LocalizedTextSchema.nullable().optional(),
			plainDescription: LocalizedTextSchema.nullable().optional(),
			price: z.number().min(0),
		})
		.optional(),
	isUpcoming: z.boolean().optional(),
	isPast: z.boolean().optional(),
	canEdit: z.boolean().optional(),
	canCancel: z.boolean().optional(),
});
export type Registration = z.infer<typeof RegistrationSchema>;

/**
 * Registration create request
 */
export const RegistrationCreateRequestSchema = z.object({
	eventId: z.string(),
	ticketId: z.string(),
	invitationCode: z.string().optional(),
	referralCode: z.string().optional(),
	formData: z.record(z.string(), z.unknown()),
});
export type RegistrationCreateRequest = z.infer<typeof RegistrationCreateRequestSchema>;

/**
 * Registration update request
 */
export const RegistrationUpdateRequestSchema = z.object({
	formData: z.record(z.string(), z.unknown()).optional(),
	status: RegistrationStatusSchema.optional(),
	tags: z.array(z.string()).optional(),
});
export type RegistrationUpdateRequest = z.infer<typeof RegistrationUpdateRequestSchema>;

/**
 * Registration statistics
 */
export const RegistrationStatsSchema = z.object({
	totalReferrals: z.number().int().min(0),
	successfulReferrals: z.number().int().min(0),
	referralList: z.array(
		z.object({
			id: z.string(),
			status: z.string(),
			ticketName: LocalizedTextSchema,
			registeredAt: z.string().datetime(),
			email: z.string().email(),
		})
	),
	referrerInfo: z.object({
		id: z.string(),
		email: z.string().email(),
	}),
});
export type RegistrationStats = z.infer<typeof RegistrationStatsSchema>;
