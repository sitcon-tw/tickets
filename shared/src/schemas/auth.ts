import { z } from "zod";

/**
 * Authentication schemas
 */

export const magicLinkRequestSchema = z.object({
	email: z.string().email("Invalid email address"),
	locale: z.enum(["zh-Hant", "zh-Hans", "en"]).optional(),
	returnUrl: z.string().optional(),
	turnstileToken: z.string().min(1, "Turnstile token is required"),
});

/**
 * Type exports
 */
export type MagicLinkRequestInput = z.infer<typeof magicLinkRequestSchema>;
