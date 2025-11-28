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
 * @param data - Data to redact
 * @returns Redacted data
 */
const redactSensitiveData = (data: any): any => {
	if (typeof data !== "object" || data === null) {
		return data;
	}

	if (Array.isArray(data)) {
		return data.map(item => redactSensitiveData(item));
	}

	const redacted: Record<string, any> = {};
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

interface SafeError {
	message: string;
	name: string;
	stack?: string;
	code?: string | number;
	statusCode?: number;
	[key: string]: any;
}

/**
 * Redact sensitive parts of error messages
 * @param error - Error object
 * @returns Safe error object for logging
 */
const sanitizeError = (error: any): SafeError => {
	if (!(error instanceof Error)) {
		return redactSensitiveData(error);
	}

	// Create a safe error object
	const safeError: SafeError = {
		message: error.message,
		name: error.name,
		stack: process.env.NODE_ENV === "production" ? "[REDACTED]" : error.stack
	};

	// Include additional error properties if they exist
	if ('code' in error) safeError.code = (error as any).code;
	if ('statusCode' in error) safeError.statusCode = (error as any).statusCode;

	// Redact any potentially sensitive data in the error
	return redactSensitiveData(safeError);
};

interface LogData {
	timestamp: string;
	level: string;
	context: string;
	[key: string]: any;
}

/**
 * Secure logger that prevents sensitive data exposure
 */
export const logger = {
	/**
	 * Log error securely
	 * @param context - Context/location of the error
	 * @param error - Error object or data
	 * @param additionalData - Additional context data (optional)
	 */
	error: (context: string, error: any, additionalData: Record<string, any> = {}): void => {
		const sanitizedError = sanitizeError(error);
		const sanitizedData = redactSensitiveData(additionalData);

		if (process.env.NODE_ENV === "production") {
			// In production, log in a structured way without sensitive data
			const logData: LogData = {
				timestamp: new Date().toISOString(),
				level: "error",
				context,
				error: sanitizedError,
				data: sanitizedData
			};
			console.error(JSON.stringify(logData));
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
	 * @param context - Context/location of the warning
	 * @param message - Warning message
	 * @param data - Additional data (optional)
	 */
	warn: (context: string, message: string, data: Record<string, any> = {}): void => {
		const sanitizedData = redactSensitiveData(data);

		if (process.env.NODE_ENV === "production") {
			const logData: LogData = {
				timestamp: new Date().toISOString(),
				level: "warn",
				context,
				message,
				data: sanitizedData
			};
			console.warn(JSON.stringify(logData));
		} else {
			console.warn(`[WARN] ${context}: ${message}`, sanitizedData);
		}
	},

	/**
	 * Log info securely
	 * @param context - Context/location
	 * @param message - Info message
	 * @param data - Additional data (optional)
	 */
	info: (context: string, message: string, data: Record<string, any> = {}): void => {
		const sanitizedData = redactSensitiveData(data);

		if (process.env.NODE_ENV === "production") {
			const logData: LogData = {
				timestamp: new Date().toISOString(),
				level: "info",
				context,
				message,
				data: sanitizedData
			};
			console.log(JSON.stringify(logData));
		} else {
			console.log(`[INFO] ${context}: ${message}`, sanitizedData);
		}
	},

	/**
	 * Log debug information (only in development)
	 * @param context - Context/location
	 * @param message - Debug message
	 * @param data - Additional data (optional)
	 */
	debug: (context: string, message: string, data: Record<string, any> = {}): void => {
		if (process.env.NODE_ENV !== "production") {
			const sanitizedData = redactSensitiveData(data);
			console.log(`[DEBUG] ${context}: ${message}`, sanitizedData);
		}
	}
};

export default logger;
