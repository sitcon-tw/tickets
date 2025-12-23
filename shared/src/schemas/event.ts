import { z } from "zod";
import { localizedTextSchema } from "./common";

/**
 * Event schemas
 */

export const eventCreateSchema = z.object({
	slug: z.string().optional(),
	name: z.union([z.string(), localizedTextSchema]),
	description: z.union([z.string(), localizedTextSchema]).optional(),
	plainDescription: z.union([z.string(), localizedTextSchema]).optional(),
	startDate: z.string().datetime(),
	endDate: z.string().datetime(),
	location: z.string().optional(),
	ogImage: z.string().url().optional(),
});

export const eventUpdateSchema = z.object({
	slug: z.string().optional(),
	name: z.union([z.string(), localizedTextSchema]).optional(),
	description: z.union([z.string(), localizedTextSchema]).optional(),
	plainDescription: z.union([z.string(), localizedTextSchema]).optional(),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	location: z.string().optional(),
	ogImage: z.string().url().optional(),
	isActive: z.boolean().optional(),
	hideEvent: z.boolean().optional(),
	useOpass: z.boolean().optional(),
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
	eventId: z.cuid(),
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

export const eventFormFieldReorderSchema = z.object({
	fieldOrders: z.array(
		z.object({
			id: z.cuid(),
			order: z.number().int().nonnegative(),
		})
	),
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
export type EventFormFieldReorderRequest = z.infer<
	typeof eventFormFieldReorderSchema
>;
