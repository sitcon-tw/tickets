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
	remoteip: z.string().optional(),
	idempotencyKey: z.string().optional(),
	expectedAction: z.string().optional(),
	expectedHostname: z.string().optional(),
});

// TurnstileValidationResult schema - successful validation
const turnstileValidationSuccessSchema = z.object({
	valid: z.literal(true),
	data: turnstileResponseSchema,
	tokenAge: z.number().optional(),
});

// TurnstileValidationResult schema - failed validation
const turnstileValidationFailureSchema = z.object({
	valid: z.literal(false),
	reason: z.string(),
	errors: z.array(z.string()).optional(),
	expected: z.string().optional(),
	received: z.string().optional(),
});

// TurnstileValidationResult schema - union of success and failure
export const turnstileValidationResultSchema = z.union([
	turnstileValidationSuccessSchema,
	turnstileValidationFailureSchema,
]);

/**
 * Type exports
 */
export type TurnstileResponse = z.infer<typeof turnstileResponseSchema>;
export type TurnstileValidationOptions = z.infer<typeof turnstileValidationOptionsSchema>;
export type TurnstileValidationResult = z.infer<typeof turnstileValidationResultSchema>;
