import { z } from "zod";

/**
 * SMS Verification schemas
 */

export const localeSchema = z.enum(["zh-Hant", "zh-Hans", "en"]);

export const smsVerificationSendSchema = z.object({
	phoneNumber: z
		.string()
		.regex(/^09\d{8}$/, "Invalid Taiwan phone number format"),
	locale: localeSchema.optional(),
	turnstileToken: z.string().min(1),
});

export const smsVerificationVerifySchema = z.object({
	phoneNumber: z
		.string()
		.regex(/^09\d{8}$/, "Invalid Taiwan phone number format"),
	code: z.string().regex(/^\d{6}$/, "Invalid verification code format"),
});

/**
 * Type exports
 */
export type Locale = z.infer<typeof localeSchema>;
export type SmsVerificationSendRequest = z.infer<
	typeof smsVerificationSendSchema
>;
export type SmsVerificationVerifyRequest = z.infer<
	typeof smsVerificationVerifySchema
>;
