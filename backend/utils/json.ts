/**
 * Safe JSON parsing utilities to prevent application crashes
 */

/**
 * Safely parse JSON string with fallback value
 * @param jsonString - The JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @param context - Context for error logging
 * @returns Parsed object or fallback value
 */
export const safeJsonParse = <T = any>(
	jsonString: string | null | undefined,
	fallback: T = {} as T,
	_context: string = "unknown"
): T => {
	if (!jsonString || typeof jsonString !== "string") {
		return fallback;
	}

	try {
		return JSON.parse(jsonString) as T;
	} catch (parseError) {
		// Silently return fallback - parsing errors are expected in some cases
		return fallback;
	}
};

/**
 * Safely stringify object with error handling
 * @param object - Object to stringify
 * @param fallback - Fallback string if stringify fails
 * @param context - Context for error logging
 * @returns JSON string or fallback
 */
export const safeJsonStringify = (
	object: any,
	fallback: string = "{}",
	_context: string = "unknown"
): string => {
	try {
		return JSON.stringify(object);
	} catch (stringifyError) {
		// Silently return fallback - stringify errors are expected in some cases
		return fallback;
	}
};
