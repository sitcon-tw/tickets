/**
 * Email campaign types and schemas
 */

import { z } from "zod/v4";
import { EmailCampaignStatusSchema, RegistrationStatusSchema, UserRoleSchema } from "./common.js";

/**
 * Target audience filters.
 * Strict, because a stored filter whose keys were all stripped would become `{}`, i.e. "everyone".
 */
export const TargetAudienceSchema = z.strictObject({
	roles: z.array(UserRoleSchema).optional(),
	eventIds: z.array(z.string()).optional(),
	ticketIds: z.array(z.string()).optional(),
	registrationStatuses: z.array(RegistrationStatusSchema).optional(),
	hasReferrals: z.boolean().optional(),
	isReferrer: z.boolean().optional(),
	// null = no bound (z.coerce.date() alone would turn null into 1970-01-01)
	registeredAfter: z.coerce.date().nullable().optional(),
	registeredBefore: z.coerce.date().nullable().optional(),
	emailDomains: z.array(z.string()).optional()
});
export type TargetAudience = z.infer<typeof TargetAudienceSchema>;

/**
 * Email campaign entity
 */
export const EmailCampaignSchema = z.object({
	id: z.string(),
	userId: z.string(),
	name: z.string(),
	subject: z.string(),
	content: z.string(),
	recipientFilter: z.string().nullable().optional(),
	status: EmailCampaignStatusSchema,
	sentCount: z.number().int().min(0),
	totalCount: z.number().int().min(0),
	scheduledAt: z.coerce.date().nullable().optional(),
	sentAt: z.coerce.date().nullable().optional(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	user: z
		.object({
			name: z.string(),
			email: z.email()
		})
		.optional()
});
export type EmailCampaign = z.infer<typeof EmailCampaignSchema>;

/**
 * Email campaign as returned by the admin API (adds the event and audience it targets)
 */
export const AdminEmailCampaignSchema = EmailCampaignSchema.extend({
	eventId: z.string().optional(),
	targetAudience: TargetAudienceSchema.optional(),
	createdBy: z.string().optional()
});
export type AdminEmailCampaign = z.infer<typeof AdminEmailCampaignSchema>;

/**
 * Email campaign create request
 */
export const EmailCampaignCreateRequestSchema = z.object({
	name: z.string().min(1),
	subject: z.string().min(1),
	content: z.string().min(1),
	recipientFilter: z.string().optional(),
	targetAudience: TargetAudienceSchema.optional(),
	scheduledAt: z.coerce.date().nullable().optional()
});
export type EmailCampaignCreateRequest = z.infer<typeof EmailCampaignCreateRequestSchema>;

/**
 * Email campaign update request
 */
export const EmailCampaignUpdateRequestSchema = z.object({
	name: z.string().min(1).optional(),
	subject: z.string().min(1).optional(),
	content: z.string().min(1).optional(),
	recipientFilter: z.string().optional(),
	targetAudience: TargetAudienceSchema.optional(),
	scheduledAt: z.coerce.date().nullable().optional()
});
export type EmailCampaignUpdateRequest = z.infer<typeof EmailCampaignUpdateRequestSchema>;

/**
 * Email campaign send request
 */
export const EmailCampaignSendRequestSchema = z.object({
	sendNow: z.boolean().optional().default(false),
	scheduledAt: z.coerce.date().nullable().optional()
});
export type EmailCampaignSendRequest = z.infer<typeof EmailCampaignSendRequestSchema>;

/**
 * Email campaign status response
 */
export const EmailCampaignStatusResponseSchema = z.object({
	id: z.string(),
	status: EmailCampaignStatusSchema,
	totalRecipients: z.number().int().min(0),
	sentCount: z.number().int().min(0),
	failedCount: z.number().int().min(0),
	openCount: z.number().int().min(0).optional(),
	clickCount: z.number().int().min(0).optional()
});
export type EmailCampaignStatusResponse = z.infer<typeof EmailCampaignStatusResponseSchema>;

/**
 * Campaign result
 */
export const CampaignResultSchema = z.object({
	success: z.boolean(),
	sentCount: z.number().int().min(0),
	failedCount: z.number().int().min(0),
	totalRecipients: z.number().int().min(0)
});
export type CampaignResult = z.infer<typeof CampaignResultSchema>;

/**
 * Email sender
 */
export const EmailSenderSchema = z.object({
	email: z.email(),
	name: z.string()
});
export type EmailSender = z.infer<typeof EmailSenderSchema>;

/**
 * Email recipient
 */
export const EmailRecipientSchema = z.object({
	email: z.email()
});
export type EmailRecipient = z.infer<typeof EmailRecipientSchema>;

/**
 * Email campaign content
 */
export interface EmailCampaignContent {
	subject: string;
	content: string;
	html?: string;
}
