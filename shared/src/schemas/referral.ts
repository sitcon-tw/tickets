import { z } from "zod";

/**
 * Referral schemas
 */

export const referralValidateSchema = z.object({
	code: z.string().min(1),
	eventId: z.cuid(),
});

/**
 * Type exports
 */
export type ReferralValidateRequest = z.infer<typeof referralValidateSchema>;
