/**
 * Email campaign types and schemas
 */

import { z } from "zod/v4";
import { EmailCampaignStatusSchema } from "./common.js";
import { EventSchema } from "./event.js";
import { TicketSchema } from "./ticket.js";

/**
 * Target audience filters
 */
export const TargetAudienceSchema = z.object({
	roles: z.array(z.string()).optional(),
	eventIds: z.array(z.string()).optional(),
	ticketIds: z.array(z.string()).optional(),
	registrationStatuses: z.array(z.string()).optional(),
	hasReferrals: z.boolean().optional(),
	isReferrer: z.boolean().optional(),
	registeredAfter: z.iso.datetime().optional(),
	registeredBefore: z.iso.datetime().optional(),
	tags: z.array(z.string()).optional(),
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
	scheduledAt: z.iso.datetime().nullable().optional(),
	sentAt: z.iso.datetime().nullable().optional(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	user: z
		.object({
			name: z.string(),
			email: z.email()
		})
		.optional()
});
export type EmailCampaign = z.infer<typeof EmailCampaignSchema>;

/**
 * Email campaign create request
 */
export const EmailCampaignCreateRequestSchema = z.object({
	name: z.string().min(1),
	subject: z.string().min(1),
	content: z.string().min(1),
	recipientFilter: z.string().optional(),
	scheduledAt: z.iso.datetime().optional()
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
	scheduledAt: z.iso.datetime().optional()
});
export type EmailCampaignUpdateRequest = z.infer<typeof EmailCampaignUpdateRequestSchema>;

/**
 * Email campaign send request
 */
export const EmailCampaignSendRequestSchema = z.object({
	sendNow: z.boolean().optional().default(false),
	scheduledAt: z.iso.datetime().optional()
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
 * Recipient data
 */
export const RecipientDataSchema = z.object({
	email: z.email(),
	id: z.string(),
	formData: z.string().nullable().optional(),
	event: EventSchema.partial().optional(),
	ticket: TicketSchema.partial().optional()
});
export type RecipientData = z.infer<typeof RecipientDataSchema>;

/**
 * Target audience filters (alias for backwards compatibility)
 */
export type TargetAudienceFilters = TargetAudience;

/**
 * Email campaign content
 */
export interface EmailCampaignContent {
	subject: string;
	content: string;
	html?: string;
}
