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
	userId: z.string(),
	eventId: z.string(),
	ticketId: z.string(),
	email: z.email(),
	status: RegistrationStatusSchema,
	referredBy: z.string().nullable().optional(),
	formData: z.record(z.string(), z.unknown()),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	event: z
		.object({
			id: z.string(),
			name: LocalizedTextSchema,
			description: LocalizedTextSchema.nullable().optional(),
			plainDescription: LocalizedTextSchema.nullable().optional(),
			locationText: LocalizedTextSchema.nullable().optional(),
			mapLink: z.string().nullable().optional(),
			startDate: z.coerce.date(),
			endDate: z.coerce.date(),
			slug: z.string().nullable().optional()
		})
		.optional(),
	ticket: z
		.object({
			id: z.string(),
			name: LocalizedTextSchema,
			description: LocalizedTextSchema.nullable().optional(),
			plainDescription: LocalizedTextSchema.nullable().optional(),
			price: z.number().min(0)
		})
		.optional(),
	isUpcoming: z.boolean().optional(),
	isPast: z.boolean().optional(),
	canEdit: z.boolean().optional(),
	canCancel: z.boolean().optional()
});
export type Registration = z.infer<typeof RegistrationSchema>;

/**
 * User registration list item (for user's own registrations - includes event and ticket details)
 */
export const UserRegistrationListItemSchema = z.object({
	id: z.string(),
	userId: z.string(),
	eventId: z.string(),
	ticketId: z.string(),
	email: z.string(),
	status: RegistrationStatusSchema,
	referredBy: z.string().nullable().optional(),
	formData: z.record(z.string(), z.unknown()),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	event: z.object({
		id: z.string(),
		name: LocalizedTextSchema,
		description: LocalizedTextSchema.nullable().optional(),
		locationText: LocalizedTextSchema.nullable().optional(),
		mapLink: z.string().nullable().optional(),
		startDate: z.coerce.date(),
		endDate: z.coerce.date(),
		ogImage: z.string().nullable().optional()
	}),
	ticket: z.object({
		id: z.string(),
		name: LocalizedTextSchema,
		description: LocalizedTextSchema.nullable().optional(),
		price: z.number().min(0),
		saleEnd: z.coerce.date().nullable().optional()
	}),
	isUpcoming: z.boolean(),
	isPast: z.boolean(),
	canEdit: z.boolean(),
	canCancel: z.boolean()
});
export type UserRegistrationListItem = z.infer<typeof UserRegistrationListItemSchema>;

/**
 * Registration create request
 */
export const RegistrationCreateRequestSchema = z.object({
	eventId: z.string(),
	ticketId: z.string(),
	invitationCode: z.string().optional(),
	referralCode: z.string().optional(),
	formData: z.record(z.string(), z.unknown())
});
export type RegistrationCreateRequest = z.infer<typeof RegistrationCreateRequestSchema>;

/**
 * Registration update request
 */
export const RegistrationUpdateRequestSchema = z.object({
	formData: z.record(z.string(), z.unknown()).optional(),
	status: RegistrationStatusSchema.optional(),
	tags: z.array(z.string()).optional()
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
			registeredAt: z.coerce.date(),
			email: z.string() // Masked email (e.g., "ab***@domain.com"), not a valid email format
		})
	),
	referrerInfo: z.object({
		id: z.string(),
		email: z.string() // Masked email (e.g., "ab***@domain.com"), not a valid email format
	})
});
export type RegistrationStats = z.infer<typeof RegistrationStatsSchema>;
