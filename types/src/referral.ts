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
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime()
});
export type Referral = z.infer<typeof ReferralSchema>;

/**
 * Referral link response
 */
export const ReferralLinkSchema = z.object({
	id: z.string(),
	referralLink: z.string().url(),
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
	code: z.string(),
	referralId: z.string()
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
	usedAt: z.string().datetime()
});
export type ReferralUsage = z.infer<typeof ReferralUsageSchema>;

/**
 * Referral overview
 */
export const ReferralOverviewSchema = z.object({
	totalReferrals: z.number().int().min(0),
	successfulReferrals: z.number().int().min(0),
	conversionRate: z.number().min(0).max(100),
	topReferrers: z.array(
		z.object({
			id: z.string(),
			email: z.string().email(),
			referralCount: z.number().int().min(0)
		})
	)
});
export type ReferralOverview = z.infer<typeof ReferralOverviewSchema>;

/**
 * Referral leaderboard
 */
export const ReferralLeaderboardSchema = z.object({
	ranking: z.array(
		z.object({
			rank: z.number().int().min(1),
			registrationId: z.string(),
			email: z.string().email(),
			referralCount: z.number().int().min(0),
			successfulReferrals: z.number().int().min(0)
		})
	)
});
export type ReferralLeaderboard = z.infer<typeof ReferralLeaderboardSchema>;

/**
 * Referral tree
 */
export const ReferralTreeSchema = z.object({
	root: z.object({
		id: z.string(),
		email: z.string().email(),
		status: z.string()
	}),
	children: z.array(
		z.object({
			id: z.string(),
			email: z.string().email(),
			status: z.string(),
			registeredAt: z.string().datetime(),
			children: z.array(z.unknown()).optional()
		})
	)
});
export type ReferralTree = z.infer<typeof ReferralTreeSchema>;

/**
 * Qualified referrer
 */
export const QualifiedReferrerSchema = z.object({
	id: z.string(),
	email: z.string().email(),
	referralCount: z.number().int().min(0),
	isQualified: z.boolean(),
	qualificationThreshold: z.number().int().min(0)
});
export type QualifiedReferrer = z.infer<typeof QualifiedReferrerSchema>;

/**
 * Draw result
 */
export const DrawResultSchema = z.object({
	winners: z.array(
		z.object({
			id: z.string(),
			email: z.string().email(),
			referralCount: z.number().int().min(0)
		})
	),
	drawDate: z.string().datetime(),
	totalParticipants: z.number().int().min(0)
});
export type DrawResult = z.infer<typeof DrawResultSchema>;
