/**
 * Form field types and schemas
 */

import { z } from "zod/v4";
import { FormFieldTypeSchema, LocalizedTextSchema } from "./common.js";

/**
 * Filter condition for form fields
 */
export const FilterConditionSchema = z.object({
	type: z.enum(["ticket", "field", "time"]),
	ticketId: z.string().optional(),
	fieldId: z.string().optional(),
	operator: z.enum(["equals", "filled", "notFilled"]).optional(),
	value: z.string().optional(),
	startTime: z.coerce.date().optional(),
	endTime: z.coerce.date().optional()
});
export type FilterCondition = z.infer<typeof FilterConditionSchema>;

/**
 * Field filter configuration
 */
export const FieldFilterSchema = z.object({
	enabled: z.boolean(),
	action: z.enum(["display", "hide"]),
	operator: z.enum(["and", "or"]),
	conditions: z.array(FilterConditionSchema)
});
export type FieldFilter = z.infer<typeof FieldFilterSchema>;

/**
 * Event form field entity
 */
export const EventFormFieldSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	order: z.number().int().min(0),
	type: FormFieldTypeSchema,
	validater: z.string().nullable().optional(),
	name: LocalizedTextSchema,
	description: LocalizedTextSchema.nullable().optional(),
	placeholder: z.string().nullable().optional(),
	required: z.boolean(),
	values: z.array(LocalizedTextSchema).nullable().optional(),
	options: z.array(LocalizedTextSchema).nullable().optional(), // Parsed options for frontend use
	filters: FieldFilterSchema.nullable().optional(),
	prompts: z.record(z.string(), z.array(z.string())).nullable().optional(),
	enableOther: z.boolean().nullable().optional()
});
export type EventFormField = z.infer<typeof EventFormFieldSchema>;

/**
 * Event form field create request
 */
export const EventFormFieldCreateRequestSchema = z.object({
	eventId: z.string(),
	order: z.number().int().min(0),
	type: FormFieldTypeSchema,
	validater: z.string().optional(),
	name: LocalizedTextSchema,
	description: LocalizedTextSchema.optional(),
	placeholder: z.string().optional(),
	required: z.boolean().optional().default(false),
	values: z.array(LocalizedTextSchema).optional(),
	filters: FieldFilterSchema.optional(),
	prompts: z.record(z.string(), z.array(z.string())).optional(),
	enableOther: z.boolean().optional()
});
export type EventFormFieldCreateRequest = z.infer<typeof EventFormFieldCreateRequestSchema>;

/**
 * Event form field update request
 */
export const EventFormFieldUpdateRequestSchema = z.object({
	order: z.number().int().min(0).optional(),
	type: FormFieldTypeSchema.optional(),
	validater: z.string().optional(),
	name: LocalizedTextSchema.optional(),
	description: LocalizedTextSchema.optional(),
	placeholder: z.string().optional(),
	required: z.boolean().optional(),
	values: z.array(LocalizedTextSchema).optional(),
	filters: FieldFilterSchema.optional(),
	prompts: z.record(z.string(), z.array(z.string())).optional(),
	enableOther: z.boolean().optional()
});
export type EventFormFieldUpdateRequest = z.infer<typeof EventFormFieldUpdateRequestSchema>;

/**
 * Event form field reorder request
 */
export const EventFormFieldReorderRequestSchema = z.object({
	fieldOrders: z.array(
		z.object({
			id: z.string(),
			order: z.number().int().min(0)
		})
	)
});
export type EventFormFieldReorderRequest = z.infer<typeof EventFormFieldReorderRequestSchema>;

// Backward compatibility aliases
export type TicketFormField = EventFormField;
export type TicketFormFieldReorder = EventFormFieldReorderRequest;

/**
 * Form validation rules
 */
export const FormValidationRulesSchema = z.object({
	required: z.boolean().optional(),
	minLength: z.number().int().min(0).optional(),
	maxLength: z.number().int().min(0).optional(),
	pattern: z.union([z.instanceof(RegExp), z.string()]).optional(),
	email: z.string().optional(),
	phone: z.string().optional(),
	min: z.number().optional(),
	max: z.number().optional(),
	options: z.array(z.string()).optional(),
	customMessage: z.string().optional()
});
export type FormValidationRules = z.infer<typeof FormValidationRulesSchema>;

/**
 * Field validation error
 */
export const FieldValidationErrorSchema = z.object({
	field: z.string(),
	messages: z.array(z.string())
});
export type FieldValidationError = z.infer<typeof FieldValidationErrorSchema>;

/**
 * Validation result
 */
export const ValidationResultSchema = z.object({
	isValid: z.boolean(),
	errors: z.record(z.string(), z.array(z.string()))
});
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
