import type { EventFormFields } from "#prisma/generated/prisma/client";
import { FieldFilterSchema, FormFieldOptionSchema, FormFieldTypeSchema, LocalizedTextSchema, type EventFormField, type FormFieldOption, type FormFieldType } from "@sitcontix/types";
import { z } from "zod/v4";

export const PromptsSchema = z.record(z.string(), z.array(z.string()));

/** Parse with `schema`, or null when the stored value does not match */
export const parseOrNull = <S extends z.ZodType>(schema: S, value: unknown): z.output<S> | null => {
	const parsed = schema.safeParse(value);
	return parsed.success ? parsed.data : null;
};

/** Keep the entries of `items` that match `schema` */
const keepValid = <S extends z.ZodType>(schema: S, items: unknown[]): z.output<S>[] => {
	const valid: z.output<S>[] = [];
	for (const item of items) {
		const parsed = schema.safeParse(item);
		if (parsed.success) valid.push(parsed.data);
	}
	return valid;
};

/** Parses a JSON column that may have been stored as an array or as a JSON string. */
export const parseJsonArray = (value: unknown): unknown[] => {
	if (Array.isArray(value)) return value;
	if (typeof value === "string") {
		try {
			const parsed: unknown = JSON.parse(value);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
};

/** Stored field type; an unknown type is treated as a plain text field */
export const parseFormFieldType = (type: string): FormFieldType => FormFieldTypeSchema.catch("text").parse(type);

/** Stored options of a choice field; entries that are not a valid option are dropped */
export const parseFormFieldOptions = (values: unknown): FormFieldOption[] => keepValid(FormFieldOptionSchema, parseJsonArray(values));

/** Map a Prisma form field row (with untyped JSON columns) to the shared `EventFormField` shape; invalid JSON becomes null instead of failing the request. */
export const toEventFormField = (row: EventFormFields): EventFormField => {
	const values = keepValid(LocalizedTextSchema, parseJsonArray(row.values));
	return {
		id: row.id,
		eventId: row.eventId,
		order: row.order,
		type: parseFormFieldType(row.type),
		validater: row.validater,
		name: parseOrNull(LocalizedTextSchema, row.name) ?? {},
		description: parseOrNull(LocalizedTextSchema, row.description),
		placeholder: row.placeholder,
		required: row.required,
		values: values.length > 0 ? values : null,
		filters: parseOrNull(FieldFilterSchema, row.filters),
		prompts: parseOrNull(PromptsSchema, row.prompts),
		enableOther: row.enableOther
	};
};
