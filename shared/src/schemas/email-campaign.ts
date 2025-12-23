import { z } from "zod";

/**
 * Email Campaign schemas
 */

export const targetAudienceSchema = z.object({
	roles: z.array(z.string()).optional(),
	eventIds: z.array(z.cuid()).optional(),
	registrationStatuses: z.array(z.string()).optional(),
	tags: z.array(z.string()).optional(),
});

export const emailCampaignCreateSchema = z.object({
	name: z.string().min(1),
	subject: z.string().min(1),
	content: z.string().min(1),
	eventId: z.cuid().optional(),
	targetAudience: targetAudienceSchema.optional(),
	scheduledAt: z.string().datetime().optional(),
});

/**
 * Type exports
 */
export type TargetAudience = z.infer<typeof targetAudienceSchema>;
export type EmailCampaignCreateRequest = z.infer<
	typeof emailCampaignCreateSchema
>;
