/**
 * Safe JSON parsing utilities to prevent application crashes
 */

/**
 * Safely parse JSON string with fallback value
 * @param {string} jsonString - The JSON string to parse
 * @param {any} fallback - Fallback value if parsing fails
 * @param {string} context - Context for error logging
 * @returns {any} Parsed object or fallback value
 */
export const safeJsonParse = (jsonString, fallback = {}, context = 'unknown') => {
	if (!jsonString || typeof jsonString !== 'string') {
		return fallback;
	}

	try {
		return JSON.parse(jsonString);
	} catch (parseError) {
		// Silently return fallback - parsing errors are expected in some cases
		return fallback;
	}
};

/**
 * Safely stringify object with error handling
 * @param {any} object - Object to stringify
 * @param {string} fallback - Fallback string if stringify fails
 * @param {string} context - Context for error logging
 * @returns {string} JSON string or fallback
 */
export const safeJsonStringify = (object, fallback = '{}', context = 'unknown') => {
	try {
		return JSON.stringify(object);
	} catch (stringifyError) {
		// Silently return fallback - stringify errors are expected in some cases
		return fallback;
	}
};