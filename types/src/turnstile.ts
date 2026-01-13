/**
 * Cloudflare Turnstile types and schemas
 */

import { z } from "zod/v4";

/**
 * Cloudflare Turnstile response
 */
export const TurnstileResponseSchema = z.object({
	success: z.boolean(),
	challenge_ts: z.string().optional(),
	hostname: z.string().optional(),
	"error-codes": z.array(z.string()).optional(),
	action: z.string().optional(),
	cdata: z.string().optional(),
	metadata: z
		.object({
			ephemeral_id: z.string().optional(),
		})
		.optional(),
});
export type TurnstileResponse = z.infer<typeof TurnstileResponseSchema>;

/**
 * Turnstile validation options
 */
export const TurnstileValidationOptionsSchema = z.object({
	remoteip: z.string().optional(),
	idempotencyKey: z.string().optional(),
	expectedAction: z.string().optional(),
	expectedHostname: z.string().optional(),
});
export type TurnstileValidationOptions = z.infer<typeof TurnstileValidationOptionsSchema>;

/**
 * Turnstile validation result
 */
export const TurnstileValidationResultSchema = z.object({
	valid: z.boolean(),
	reason: z.string().optional(),
	errors: z.array(z.string()).optional(),
	expected: z.string().optional(),
	received: z.string().optional(),
	data: TurnstileResponseSchema.optional(),
	tokenAge: z.number().optional(),
});
export type TurnstileValidationResult = z.infer<typeof TurnstileValidationResultSchema>;
