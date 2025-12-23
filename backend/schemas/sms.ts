import { z } from "zod";

/**
 * SMS service Zod schemas
 * Backend-only types for SMS operations (Twilio integration)
 */

// Locale enum
export const localeSchema = z.enum(["zh-Hant", "zh-Hans", "en"]);

// TwSMSResponse schema (Taiwan SMS service response)
export const twSMSResponseSchema = z.object({
	code: z.string(),
	text: z.string(),
	msgid: z.string().optional(),
});

// TwSMSStatusResponse schema (Taiwan SMS status response)
export const twSMSStatusResponseSchema = z.object({
	code: z.string(),
	text: z.string(),
	statuscode: z.string(),
	statustext: z.string(),
	donetime: z.string().optional(),
});

// SMSSendResult schema
export const smsSendResultSchema = z.object({
	success: z.boolean(),
	messageId: z.string().optional(),
	status: z.string().optional(),
	error: z.string().optional(),
	msgid: z.string().optional(),
	code: z.string().optional(),
	text: z.string().optional(),
});

// SMSSendOptions schema (TwSMS options)
export const smsSendOptionsSchema = z.object({
	expirytime: z.number().optional(),
});

// SendVerificationRequest schema
export const sendVerificationRequestSchema = z.object({
	phoneNumber: z.string(),
	locale: localeSchema.optional(),
	channel: z.enum(["sms", "call"]).optional(),
});

// VerifyCodeRequest schema
export const verifyCodeRequestSchema = z.object({
	phoneNumber: z.string(),
	code: z.string(),
});

/**
 * Type exports
 */
export type Locale = z.infer<typeof localeSchema>;
export type TwSMSResponse = z.infer<typeof twSMSResponseSchema>;
export type TwSMSStatusResponse = z.infer<typeof twSMSStatusResponseSchema>;
export type SMSSendResult = z.infer<typeof smsSendResultSchema>;
export type SMSSendOptions = z.infer<typeof smsSendOptionsSchema>;
export type SendVerificationRequest = z.infer<typeof sendVerificationRequestSchema>;
export type VerifyCodeRequest = z.infer<typeof verifyCodeRequestSchema>;
