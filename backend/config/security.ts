/**
 * @fileoverview Security configuration for the application
 */

import { logger } from "#utils/logger";
import type { RateLimitPluginOptions, errorResponseBuilderContext } from "@fastify/rate-limit";
import type { FastifyRequest } from "fastify";

const securityLogger = logger.child({ component: "security" });

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
	global: {
		max: parseInt(process.env.RATE_LIMIT_MAX ?? "") || 30000,
		timeWindow: process.env.RATE_LIMIT_WINDOW || "10 minutes",
		cache: 10000,
		allowList: (req: FastifyRequest): boolean => {
			return process.env.NODE_ENV !== "production" && (req.ip.startsWith("127.0.") || req.ip === "::1");
		},
		skipOnError: false
	} satisfies Partial<RateLimitPluginOptions>,

	auth: {
		max: parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? "") || 20000,
		timeWindow: "10 minutes",
		skipOnError: false,
		ban: 20000,
		errorResponseBuilder: (_req: FastifyRequest, context: errorResponseBuilderContext) => {
			return {
				success: false,
				error: "請求過於頻繁，請稍後再試",
				retryAfter: context.after
			};
		}
	} satisfies Partial<RateLimitPluginOptions>
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
		action: "deny" as const
	},
	noSniff: true,
	xssFilter: true,
	hidePoweredBy: true
};

/**
 * CORS configuration
 */
export const getCorsConfig = () => {
	const allowedOrigins: (string | RegExp)[] = [process.env.FRONTEND_URI, process.env.BACKEND_URI].filter((origin): origin is string => Boolean(origin));

	if (process.env.NODE_ENV !== "production") {
		allowedOrigins.push(/^http:\/\/localhost:\d+$/);
		allowedOrigins.push(/^http:\/\/127\.0\.0\.1:\d+$/);
		allowedOrigins.push(/^http:\/\/127\.0\.2\.2:\d+$/);
	}

	return {
		origin: allowedOrigins,
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "Cookie", "CF-Connecting-IP", "CF-Ray", "CF-IPCountry", "CF-Visitor", "X-Forwarded-For", "X-Forwarded-Proto", "X-Real-IP"],
		exposedHeaders: ["set-cookie"],
		maxAge: 86400
	};
};

/**
 * Request body size limits
 */
export const bodySizeConfig = {
	bodyLimit: parseInt(process.env.MAX_BODY_SIZE ?? "") || 1048576, // 1MB default
	jsonBodyLimit: parseInt(process.env.MAX_JSON_SIZE ?? "") || 524288 // 512KB default
};

/**
 * Allowed admin emails - should be loaded from environment variable
 * Never hardcode admin emails in source code
 */
export const getAdminEmails = (): string[] => {
	const adminEmailsEnv = process.env.ADMIN_EMAILS;
	if (!adminEmailsEnv) {
		securityLogger.warn("ADMIN_EMAILS environment variable not set. No automatic admin assignments will occur.");
		return [];
	}
	return adminEmailsEnv
		.split(",")
		.map(email => email.trim())
		.filter(Boolean);
};
