/**
 * Safe JSON parsing utilities to prevent application crashes
 */

import { z } from "zod/v4";

/**
 * Safely parse a JSON string and validate it against a schema
 * @param jsonString - The JSON string to parse
 * @param schema - Schema the parsed value must match
 * @param fallback - Value returned when the string is missing, is not JSON, or does not match the schema
 * @param context - Context for error logging
 * @returns Validated value or fallback value
 */
export const safeJsonParse = <S extends z.ZodType>(jsonString: string | null | undefined, schema: S, fallback: z.output<S>, _context: string = "unknown"): z.output<S> => {
	if (!jsonString || typeof jsonString !== "string") {
		return fallback;
	}

	let raw: unknown;
	try {
		raw = JSON.parse(jsonString);
	} catch {
		// Silently return fallback - parsing errors are expected in some cases
		return fallback;
	}

	const parsed = schema.safeParse(raw);
	return parsed.success ? parsed.data : fallback;
};

const JsonObjectSchema = z.record(z.string(), z.unknown());
const JsonArraySchema = z.array(z.unknown());

/** Parse a stored JSON object (e.g. registration formData); anything that is not an object becomes `{}` */
export const parseJsonObject = (jsonString: string | null | undefined, context: string = "unknown"): Record<string, unknown> => safeJsonParse(jsonString, JsonObjectSchema, {}, context);

/** Parse a stored JSON array of strings (e.g. permission lists); non-string entries are dropped */
export const parseStringList = (jsonString: string | null | undefined, context: string = "unknown"): string[] =>
	safeJsonParse(jsonString, JsonArraySchema, [], context).filter((value): value is string => typeof value === "string");

/**
 * Safely stringify object with error handling
 * @param object - Object to stringify
 * @param fallback - Fallback string if stringify fails
 * @param context - Context for error logging
 * @returns JSON string or fallback
 */
export const safeJsonStringify = (object: unknown, fallback: string = "{}", _context: string = "unknown"): string => {
	try {
		return JSON.stringify(object);
	} catch {
		// Silently return fallback - stringify errors are expected in some cases
		return fallback;
	}
};
