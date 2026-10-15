/**
 * Referral types and schemas
 */

import { z } from "zod/v4";

/**
 * Referral entity
 */
export const ReferralSchema = z.object({
	id: z.string(),
	code: z.string(),
	registrationId: z.string(),
	eventId: z.string(),
	isActive: z.boolean(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date()
});
export type Referral = z.infer<typeof ReferralSchema>;

/**
 * Referral link response
 */
export const ReferralLinkSchema = z.object({
	id: z.string(),
	referralLink: z.url(),
	referralCode: z.string(),
	eventId: z.string()
});
export type ReferralLink = z.infer<typeof ReferralLinkSchema>;

/**
 * Referral validation request
 */
export const ReferralValidateRequestSchema = z.object({
	code: z.string().min(1),
	eventId: z.string()
});
export type ReferralValidateRequest = z.infer<typeof ReferralValidateRequestSchema>;

/**
 * Referral validation response
 */
export const ReferralValidationSchema = z.object({
	isValid: z.boolean(),
	referrerId: z.string().nullable(),
	referrerName: z.string().nullable().optional()
});
export type ReferralValidation = z.infer<typeof ReferralValidationSchema>;

/**
 * Referral usage entity
 */
export const ReferralUsageSchema = z.object({
	id: z.string(),
	referralId: z.string(),
	registrationId: z.string(),
	eventId: z.string(),
	usedAt: z.coerce.date()
});
export type ReferralUsage = z.infer<typeof ReferralUsageSchema>;

/**
 * Referral tree node (recursive structure)
 */
export interface ReferralTreeNode {
	id: string;
	email: string;
	name: string;
	referralCode?: string;
	createdAt: Date;
	children: ReferralTreeNode[];
}
export const ReferralTreeNodeSchema: z.ZodType<ReferralTreeNode> = z.lazy(() =>
	z.object({
		id: z.string(),
		email: z.string(),
		name: z.string(),
		referralCode: z.string().optional(),
		createdAt: z.coerce.date(),
		children: z.array(ReferralTreeNodeSchema)
	})
);

/**
 * Public referral ranking item
 */
export const PublicReferralRankingItemSchema = z.object({
	rank: z.number().int(),
	censoredName: z.string(),
	referralCount: z.number().int(),
	isCurrentUser: z.boolean()
});
export type PublicReferralRankingItem = z.infer<typeof PublicReferralRankingItemSchema>;

/**
 * Public referral ranking response data
 */
export const PublicReferralRankingDataSchema = z.object({
	rankings: z.array(PublicReferralRankingItemSchema),
	currentUserRank: z.number().int().nullable(),
	currentUserReferralCount: z.number().int().nullable(),
	totalParticipants: z.number().int()
});
export type PublicReferralRankingData = z.infer<typeof PublicReferralRankingDataSchema>;
