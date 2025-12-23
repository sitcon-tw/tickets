import { z } from "zod";

/**
 * Cloudflare Turnstile Zod schemas
 * Backend-only types for Turnstile CAPTCHA validation
 */

// TurnstileResponse schema
export const turnstileResponseSchema = z.object({
	success: z.boolean(),
	"error-codes": z.array(z.string()).optional(),
	challenge_ts: z.string().optional(),
	hostname: z.string().optional(),
	action: z.string().optional(),
	cdata: z.string().optional(),
});

// TurnstileValidationOptions schema
export const turnstileValidationOptionsSchema = z.object({
	token: z.string(),
	remoteip: z.string().optional(),
	idempotencyKey: z.string().optional(),
});

// TurnstileValidationResult schema
export const turnstileValidationResultSchema = z.object({
	success: z.boolean(),
	errorCodes: z.array(z.string()).optional(),
	message: z.string().optional(),
});

/**
 * Type exports
 */
export type TurnstileResponse = z.infer<typeof turnstileResponseSchema>;
export type TurnstileValidationOptions = z.infer<typeof turnstileValidationOptionsSchema>;
export type TurnstileValidationResult = z.infer<typeof turnstileValidationResultSchema>;
