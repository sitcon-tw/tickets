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

const sanitizeError = (error: any): SafeError => {
	if (!(error instanceof Error)) {
		return redactSensitiveData(error);
	}

	const safeError: SafeError = {
		message: error.message,
		name: error.name,
		stack: process.env.NODE_ENV === "production" ? "[REDACTED]" : error.stack
	};

	if ("code" in error) safeError.code = (error as any).code;
	if ("statusCode" in error) safeError.statusCode = (error as any).statusCode;

	return redactSensitiveData(safeError);
};

interface LogData {
	timestamp: string;
	level: string;
	context: string;
	[key: string]: any;
}

export const logger = {
	error: (context: string, error: any, additionalData: Record<string, any> = {}): void => {
		const sanitizedError = sanitizeError(error);
		const sanitizedData = redactSensitiveData(additionalData);

		if (process.env.NODE_ENV === "production") {
			const logData: LogData = {
				timestamp: new Date().toISOString(),
				level: "error",
				context,
				error: sanitizedError,
				data: sanitizedData
			};
			console.error(JSON.stringify(logData));
		} else {
			console.error(`[ERROR] ${context}:`, sanitizedError);
			if (Object.keys(sanitizedData).length > 0) {
				console.error("[Additional Data]:", sanitizedData);
			}
		}
	},

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

	debug: (context: string, message: string, data: Record<string, any> = {}): void => {
		if (process.env.NODE_ENV !== "production") {
			const sanitizedData = redactSensitiveData(data);
			console.log(`[DEBUG] ${context}: ${message}`, sanitizedData);
		}
	}
};

export default logger;
