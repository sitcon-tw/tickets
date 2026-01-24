import pino from "pino";

export const logger = pino({
	level: process.env.LOG_LEVEL || "info",
	redact: {
		paths: [
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
		],
		remove: true
	}
});
