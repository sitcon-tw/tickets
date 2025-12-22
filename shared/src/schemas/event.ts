import { z } from "zod";
import { localizedTextSchema } from "./common.js";

/**
 * Event schemas
 */

export const eventCreateSchema = z.object({
	name: z.union([z.string(), localizedTextSchema]),
	description: z.union([z.string(), localizedTextSchema]).optional(),
	plainDescription: z.union([z.string(), localizedTextSchema]).optional(),
	startDate: z.string().datetime(),
	endDate: z.string().datetime(),
	location: z.union([z.string(), localizedTextSchema]).optional(),
	ogImage: z.string().url().optional(),
});

export const eventUpdateSchema = z.object({
	name: z.union([z.string(), localizedTextSchema]).optional(),
	description: z.union([z.string(), localizedTextSchema]).optional(),
	plainDescription: z.union([z.string(), localizedTextSchema]).optional(),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	location: z.union([z.string(), localizedTextSchema]).optional(),
	ogImage: z.string().url().optional(),
	isActive: z.boolean().optional(),
});

/**
 * Event form field schemas
 */

export const formFieldTypeSchema = z.enum([
	"text",
	"textarea",
	"select",
	"checkbox",
	"radio",
]);

export const eventFormFieldCreateSchema = z.object({
	eventId: z.string().uuid(),
	order: z.number().int().nonnegative(),
	type: formFieldTypeSchema,
	validater: z.string().optional(),
	name: z.union([z.string(), localizedTextSchema]),
	description: z.union([z.string(), localizedTextSchema]),
	placeholder: z.union([z.string(), localizedTextSchema]).optional(),
	required: z.boolean().default(false).optional(),
	values: z.string().optional(),
	filters: z.string().optional(),
	prompts: z.string().optional(),
});

export const eventFormFieldUpdateSchema = z.object({
	order: z.number().int().nonnegative().optional(),
	type: formFieldTypeSchema.optional(),
	validater: z.string().optional(),
	name: z.union([z.string(), localizedTextSchema]).optional(),
	description: z.union([z.string(), localizedTextSchema]).optional(),
	placeholder: z.union([z.string(), localizedTextSchema]).optional(),
	required: z.boolean().optional(),
	values: z.string().optional(),
	filters: z.string().optional(),
	prompts: z.string().optional(),
});

/**
 * Type exports
 */
export type EventCreateRequest = z.infer<typeof eventCreateSchema>;
export type EventUpdateRequest = z.infer<typeof eventUpdateSchema>;
export type FormFieldType = z.infer<typeof formFieldTypeSchema>;
export type EventFormFieldCreateRequest = z.infer<
	typeof eventFormFieldCreateSchema
>;
export type EventFormFieldUpdateRequest = z.infer<
	typeof eventFormFieldUpdateSchema
>;
