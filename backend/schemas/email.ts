import { z } from "zod";

/**
 * Email service Zod schemas
 * Backend-only types for email operations
 */

// EmailSender schema
export const emailSenderSchema = z.object({
	name: z.string(),
	email: z.email(),
});

// EmailRecipient schema
export const emailRecipientSchema = z.object({
	email: z.email(),
	name: z.string().optional(),
});

// TargetAudienceFilters schema
export const targetAudienceFiltersSchema = z.object({
	eventId: z.string().optional(),
	ticketId: z.string().optional(),
	registrationStatus: z.enum(["pending", "confirmed", "cancelled", "waitlisted"]).optional(),
	tags: z.array(z.string()).optional(),
	dateRange: z.object({
		start: z.date(),
		end: z.date(),
	}).optional(),
	hasRegistered: z.boolean().optional(),
	eventIds: z.array(z.string()).optional(),
	ticketIds: z.array(z.string()).optional(),
	registrationStatuses: z.array(z.enum(["pending", "confirmed", "cancelled", "waitlisted"])).optional(),
	hasReferrals: z.boolean().optional(),
	registeredAfter: z.string().optional(),
	registeredBefore: z.string().optional(),
	emailDomains: z.array(z.string()).optional(),
	roles: z.array(z.string()).optional(),
	isReferrer: z.boolean().optional(),
});

// RecipientData schema
export const recipientDataSchema = z.object({
	email: z.email(),
	name: z.string().optional(),
	id: z.string().optional(),
	formData: z.string().nullable().optional(),
	variables: z.record(z.string(), z.string()).optional(),
	metadata: z.record(z.string(), z.any()).optional(),
	event: z.any().optional(),
	ticket: z.any().optional(),
});

// EmailCampaignContent schema
export const emailCampaignContentSchema = z.object({
	subject: z.string(),
	content: z.string(),
	html: z.string().optional(),
	text: z.string().optional(),
});

// CampaignResult schema
export const campaignResultSchema = z.object({
	success: z.boolean(),
	sent: z.number().int(),
	failed: z.number().int(),
	sentCount: z.number().int().optional(),
	failedCount: z.number().int().optional(),
	totalRecipients: z.number().int().optional(),
	errors: z.array(z.object({
		recipient: z.string(),
		error: z.string(),
	})).optional(),
});

/**
 * Type exports
 */
export type EmailSender = z.infer<typeof emailSenderSchema>;
export type EmailRecipient = z.infer<typeof emailRecipientSchema>;
export type TargetAudienceFilters = z.infer<typeof targetAudienceFiltersSchema>;
export type RecipientData = z.infer<typeof recipientDataSchema>;
export type EmailCampaignContent = z.infer<typeof emailCampaignContentSchema>;
export type CampaignResult = z.infer<typeof campaignResultSchema>;
