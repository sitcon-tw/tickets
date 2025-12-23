import { z } from "zod";
import { eventFormFieldTypeSchema } from "@tickets/shared";

/**
 * Validation utility Zod schemas
 * Backend-only types for form and data validation
 */

// ValidationRule type - function that returns boolean or error string
export const validationRuleSchema = z.function()
	.args(z.unknown())
	.returns(z.union([z.boolean(), z.string()]));

// ValidationSchema
export const validationSchemaSchema = z.object({
	fields: z.record(z.string(), z.array(validationRuleSchema)),
});

// ValidationResult
export const validationResultSchema = z.object({
	valid: z.boolean(),
	errors: z.record(z.string(), z.array(z.string())),
});

// FormValidationRules - mirrors backend/types/validation.ts
export const formValidationRulesSchema = z.object({
	required: z.boolean().optional(),
	minLength: z.number().optional(),
	maxLength: z.number().optional(),
	pattern: z.string().optional(),
	min: z.number().optional(),
	max: z.number().optional(),
	email: z.boolean().optional(),
	url: z.boolean().optional(),
	custom: validationRuleSchema.optional(),
});

// FieldValidationError
export const fieldValidationErrorSchema = z.object({
	field: z.string(),
	message: z.string(),
});

// ValidationErrors - from backend/utils/validation.ts
export const validationErrorsSchema = z.record(z.string(), z.array(z.string()));

// FormField - from backend/utils/validation.ts
export const formFieldSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	order: z.number().int(),
	type: eventFormFieldTypeSchema,
	validater: z.string().nullable(),
	name: z.string(),
	description: z.string().nullable(),
	placeholder: z.string().nullable(),
	required: z.boolean(),
	values: z.string().nullable(),
	prompts: z.string().nullable(),
});

// FilterCondition - from backend/utils/validation.ts
export const filterConditionSchema = z.object({
	field: z.string(),
	operator: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "contains", "startsWith", "endsWith"]),
	value: z.unknown(),
});

/**
 * Type exports
 */
export type ValidationRule = z.infer<typeof validationRuleSchema>;
export type ValidationSchema = z.infer<typeof validationSchemaSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;
export type FormValidationRules = z.infer<typeof formValidationRulesSchema>;
export type FieldValidationError = z.infer<typeof fieldValidationErrorSchema>;
export type ValidationErrors = z.infer<typeof validationErrorsSchema>;
export type FormField = z.infer<typeof formFieldSchema>;
export type FilterCondition = z.infer<typeof filterConditionSchema>;
