/**
 * @fileoverview Security configuration for the application
 */

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
	// Global rate limit
	global: {
		max: parseInt(process.env.RATE_LIMIT_MAX) || 30000,
		timeWindow: process.env.RATE_LIMIT_WINDOW || "10 minutes",
		cache: 10000,
		allowList: req => {
			// Allow localhost in development
			return process.env.NODE_ENV !== "production" && (req.ip === "127.0.0.1" || req.ip === "::1");
		},
		skipOnError: false
	},

	// Auth endpoints - stricter limits
	auth: {
		max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 20000,
		timeWindow: "10 minutes",
		skipOnError: false,
		ban: 20000,
		errorResponseBuilder: (req, context) => {
			return {
				success: false,
				error: "請求過於頻繁，請稍後再試",
				retryAfter: context.after
			};
		}
	},

	// Registration endpoints - moderate limits
	registration: {
		max: parseInt(process.env.REGISTRATION_RATE_LIMIT_MAX) || 10,
		timeWindow: "1 hour",
		skipOnError: false
	}
};

/**
 * Helmet security headers configuration
 */
export const helmetConfig = {
	contentSecurityPolicy: {
		useDefaults: true,
		directives: {
			defaultSrc: ["'self'"],
			styleSrc: ["'self'", "'unsafe-inline'", "https://font.emtech.cc"],
			scriptSrc: ["'self'", "'unsafe-inline'", "https://font.emtech.cc"],
			imgSrc: ["'self'", "data:", "https:"],
			connectSrc: ["'self'"],
			fontSrc: ["'self'", "https://font.emtech.cc"],
			objectSrc: ["'none'"],
			mediaSrc: ["'self'"],
			frameSrc: ["'none'"]
		}
	},
	hsts: {
		maxAge: 31536000, // 1 year
		includeSubDomains: true,
		preload: true
	},
	frameguard: {
		action: "deny"
	},
	noSniff: true,
	xssFilter: true,
	hidePoweredBy: true
};

/**
 * CORS configuration
 */
export const getCorsConfig = () => {
	const allowedOrigins = [process.env.FRONTEND_URI, process.env.BACKEND_URI].filter(Boolean);

	// In development, allow localhost with different ports
	if (process.env.NODE_ENV !== "production") {
		allowedOrigins.push(/^http:\/\/localhost:\d+$/);
		allowedOrigins.push(/^http:\/\/127\.0\.0\.1:\d+$/);
	}

	return {
		origin: allowedOrigins,
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
		exposedHeaders: ["set-cookie"],
		maxAge: 86400 // 24 hours
	};
};

/**
 * Request body size limits
 */
export const bodySizeConfig = {
	bodyLimit: parseInt(process.env.MAX_BODY_SIZE) || 1048576, // 1MB default
	jsonBodyLimit: parseInt(process.env.MAX_JSON_SIZE) || 524288 // 512KB default
};

/**
 * Allowed admin emails - should be loaded from environment variable
 * Never hardcode admin emails in source code
 */
export const getAdminEmails = () => {
	const adminEmailsEnv = process.env.ADMIN_EMAILS;
	if (!adminEmailsEnv) {
		console.warn("ADMIN_EMAILS environment variable not set. No automatic admin assignments will occur.");
		return [];
	}
	return adminEmailsEnv
		.split(",")
		.map(email => email.trim())
		.filter(Boolean);
};
