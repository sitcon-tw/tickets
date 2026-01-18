/**
 * SMS verification types and schemas
 */

import { z } from "zod/v4";
import { LocaleSchema } from "./common.js";

/**
 * Send verification request
 */
export const SendVerificationRequestSchema = z.object({
	phoneNumber: z.string().regex(/^09\d{8}$/, "Invalid Taiwan phone number"),
	locale: LocaleSchema.optional(),
	turnstileToken: z.string()
});
export type SendVerificationRequest = z.infer<typeof SendVerificationRequestSchema>;

/**
 * Verify code request
 */
export const VerifyCodeRequestSchema = z.object({
	phoneNumber: z.string().regex(/^09\d{8}$/, "Invalid Taiwan phone number"),
	code: z.string().regex(/^\d{6}$/, "Invalid verification code")
});
export type VerifyCodeRequest = z.infer<typeof VerifyCodeRequestSchema>;

/**
 * TwSMS API response
 */
export const TwSMSResponseSchema = z.object({
	code: z.string(),
	text: z.string(),
	msgid: z.string().optional()
});
export type TwSMSResponse = z.infer<typeof TwSMSResponseSchema>;

/**
 * TwSMS status response
 */
export const TwSMSStatusResponseSchema = z.object({
	code: z.string(),
	text: z.string(),
	statuscode: z.string().optional(),
	statustext: z.string().optional(),
	donetime: z.string().optional()
});
export type TwSMSStatusResponse = z.infer<typeof TwSMSStatusResponseSchema>;

/**
 * SMS send result
 */
export const SMSSendResultSchema = z.object({
	success: z.boolean(),
	msgid: z.string(),
	code: z.string(),
	text: z.string()
});
export type SMSSendResult = z.infer<typeof SMSSendResultSchema>;

/**
 * SMS send options
 */
export interface SMSSendOptions {
	expirytime?: number;
	[key: string]: string | number | undefined;
}
