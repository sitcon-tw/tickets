import { z } from "zod";

/**
 * SMS service Zod schemas
 * Backend-only types for SMS operations (Twilio integration)
 */

// Locale enum
export const localeSchema = z.enum(["zh-Hant", "zh-Hans", "en"]);

// TwSMSResponse schema (Twilio SMS response)
export const twSMSResponseSchema = z.object({
	sid: z.string(),
	status: z.string(),
	to: z.string(),
	from: z.string(),
	body: z.string(),
	errorCode: z.number().nullable().optional(),
	errorMessage: z.string().nullable().optional(),
});

// TwSMSStatusResponse schema (Twilio SMS status response)
export const twSMSStatusResponseSchema = z.object({
	sid: z.string(),
	status: z.string(),
	to: z.string(),
	from: z.string(),
	dateCreated: z.string().optional(),
	dateSent: z.string().optional(),
	dateUpdated: z.string().optional(),
	errorCode: z.number().nullable().optional(),
	errorMessage: z.string().nullable().optional(),
});

// SMSSendResult schema
export const smsSendResultSchema = z.object({
	success: z.boolean(),
	messageId: z.string().optional(),
	status: z.string().optional(),
	error: z.string().optional(),
});

// SMSSendOptions schema
export const smsSendOptionsSchema = z.object({
	to: z.string(),
	body: z.string(),
	from: z.string().optional(),
	statusCallback: z.string().url().optional(),
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
