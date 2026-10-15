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
	startTime: z.coerce.date().nullable().optional(),
	endTime: z.coerce.date().nullable().optional()
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
 * Form field option: a plain string, a localized record, or a legacy `{ label, value }` object
 */
export const FormFieldOptionSchema = z.union([
	z.string(),
	LocalizedTextSchema,
	z.object({
		label: z.union([z.string(), LocalizedTextSchema]),
		value: z.string().optional()
	})
]);
export type FormFieldOption = z.infer<typeof FormFieldOptionSchema>;

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
 * Public event form field (for public API - subset of fields)
 */
export const PublicEventFormFieldSchema = z.object({
	id: z.string(),
	name: LocalizedTextSchema,
	description: LocalizedTextSchema.nullable().optional(),
	type: FormFieldTypeSchema,
	required: z.boolean(),
	options: z.array(FormFieldOptionSchema),
	validater: z.string().nullable().optional(),
	placeholder: z.string().nullable().optional(),
	order: z.number().int().min(0),
	filters: FieldFilterSchema.nullable().optional(),
	prompts: z.record(z.string(), z.array(z.string())).nullable().optional(),
	enableOther: z.boolean()
});
export type PublicEventFormField = z.infer<typeof PublicEventFormFieldSchema>;

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
