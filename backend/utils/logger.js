/**
 * @fileoverview Secure logging utilities
 * Prevents sensitive data exposure in logs
 */

/**
 * Sensitive fields that should be redacted from logs
 */
const SENSITIVE_FIELDS = [
	"password",
	"token",
	"secret",
	"apiKey",
	"api_key",
	"authorization",
	"cookie",
	"session",
	"accessToken",
	"refreshToken",
	"idToken",
	"BETTER_AUTH_SECRET",
	"MAILTRAP_TOKEN",
	"DATABASE_URL",
	"POSTGRES_URI"
];

/**
 * Redact sensitive information from an object
 * @param {any} data - Data to redact
 * @returns {any} - Redacted data
 */
const redactSensitiveData = data => {
	if (typeof data !== "object" || data === null) {
		return data;
	}

	if (Array.isArray(data)) {
		return data.map(item => redactSensitiveData(item));
	}

	const redacted = {};
	for (const [key, value] of Object.entries(data)) {
		const lowerKey = key.toLowerCase();
		const isSensitive = SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()));

		if (isSensitive) {
			redacted[key] = "[REDACTED]";
		} else if (typeof value === "object" && value !== null) {
			redacted[key] = redactSensitiveData(value);
		} else {
			redacted[key] = value;
		}
	}

	return redacted;
};

/**
 * Redact sensitive parts of error messages
 * @param {Error} error - Error object
 * @returns {Object} - Safe error object for logging
 */
const sanitizeError = error => {
	if (!(error instanceof Error)) {
		return redactSensitiveData(error);
	}

	// Create a safe error object
	const safeError = {
		message: error.message,
		name: error.name,
		stack: process.env.NODE_ENV === "production" ? "[REDACTED]" : error.stack
	};

	// Include additional error properties if they exist
	if (error.code) safeError.code = error.code;
	if (error.statusCode) safeError.statusCode = error.statusCode;

	// Redact any potentially sensitive data in the error
	return redactSensitiveData(safeError);
};

/**
 * Secure logger that prevents sensitive data exposure
 */
export const logger = {
	/**
	 * Log error securely
	 * @param {string} context - Context/location of the error
	 * @param {Error|any} error - Error object or data
	 * @param {Object} additionalData - Additional context data (optional)
	 */
	error: (context, error, additionalData = {}) => {
		const sanitizedError = sanitizeError(error);
		const sanitizedData = redactSensitiveData(additionalData);

		if (process.env.NODE_ENV === "production") {
			// In production, log in a structured way without sensitive data
			console.error(
				JSON.stringify({
					timestamp: new Date().toISOString(),
					level: "error",
					context,
					error: sanitizedError,
					data: sanitizedData
				})
			);
		} else {
			// In development, more verbose logging
			console.error(`[ERROR] ${context}:`, sanitizedError);
			if (Object.keys(sanitizedData).length > 0) {
				console.error("[Additional Data]:", sanitizedData);
			}
		}
	},

	/**
	 * Log warning securely
	 * @param {string} context - Context/location of the warning
	 * @param {string} message - Warning message
	 * @param {Object} data - Additional data (optional)
	 */
	warn: (context, message, data = {}) => {
		const sanitizedData = redactSensitiveData(data);

		if (process.env.NODE_ENV === "production") {
			console.warn(
				JSON.stringify({
					timestamp: new Date().toISOString(),
					level: "warn",
					context,
					message,
					data: sanitizedData
				})
			);
		} else {
			console.warn(`[WARN] ${context}: ${message}`, sanitizedData);
		}
	},

	/**
	 * Log info securely
	 * @param {string} context - Context/location
	 * @param {string} message - Info message
	 * @param {Object} data - Additional data (optional)
	 */
	info: (context, message, data = {}) => {
		const sanitizedData = redactSensitiveData(data);

		if (process.env.NODE_ENV === "production") {
			console.log(
				JSON.stringify({
					timestamp: new Date().toISOString(),
					level: "info",
					context,
					message,
					data: sanitizedData
				})
			);
		} else {
			console.log(`[INFO] ${context}: ${message}`, sanitizedData);
		}
	},

	/**
	 * Log debug information (only in development)
	 * @param {string} context - Context/location
	 * @param {string} message - Debug message
	 * @param {Object} data - Additional data (optional)
	 */
	debug: (context, message, data = {}) => {
		if (process.env.NODE_ENV !== "production") {
			const sanitizedData = redactSensitiveData(data);
			console.log(`[DEBUG] ${context}: ${message}`, sanitizedData);
		}
	}
};

export default logger;
