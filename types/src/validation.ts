/**
 * Validation error types and schemas
 */

import { z } from "zod/v4";

/**
 * Validation error
 */
export const ValidationErrorSchema = z.object({
	statusCode: z.number().int(),
	code: z.string(),
	error: z.string(),
	message: z.string(),
	validation: z
		.array(
			z.object({
				field: z.string(),
				message: z.string()
			})
		)
		.optional(),
	validationContext: z.string().optional()
});
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
