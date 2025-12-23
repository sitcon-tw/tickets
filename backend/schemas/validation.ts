import { z } from "zod";
import { eventFormFieldTypeSchema } from "@tickets/shared";

/**
 * Validation utility Zod schemas
 * Backend-only types for form and data validation
 */

// ValidationRule type - function that returns true or error string
// Note: z.function is not used for validation, this is just a type placeholder
export type ValidationRule = (value: unknown) => true | string;
export const validationRuleSchema: z.ZodType<ValidationRule> = z.any();

// ValidationSchema - record of field names to arrays of validation rules
export const validationSchemaSchema = z.record(z.string(), z.array(validationRuleSchema));

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

// FilterCondition - from backend/utils/validation.ts (defined before FormField)
export const filterConditionSchema = z.object({
	type: z.enum(["ticket", "field", "time"]),
	ticketId: z.string().optional(),
	fieldId: z.string().optional(),
	operator: z.enum(["equals", "filled", "notFilled"]).optional(),
	value: z.unknown().optional(),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
});

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
	filters: z.object({
		enabled: z.boolean(),
		operator: z.enum(["and", "or"]),
		action: z.enum(["display", "hide"]),
		conditions: z.array(filterConditionSchema),
	}).optional(),
});

/**
 * Type exports
 */
// ValidationRule is already exported above
export type ValidationSchema = z.infer<typeof validationSchemaSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;
export type FormValidationRules = z.infer<typeof formValidationRulesSchema>;
export type FieldValidationError = z.infer<typeof fieldValidationErrorSchema>;
export type ValidationErrors = z.infer<typeof validationErrorsSchema>;
export type FormField = z.infer<typeof formFieldSchema>;
export type FilterCondition = z.infer<typeof filterConditionSchema>;
