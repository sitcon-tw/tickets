// IMPORTANT: Import tracing FIRST before any other modules (if enabled)
// This ensures OpenTelemetry SDK is initialized before Fastify
import "./lib/tracing";

import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import type { FastifyReply, FastifyRequest } from "fastify";
import Fastify from "fastify";
import fastifyMetrics from "fastify-metrics";
import { serializerCompiler, validatorCompiler, jsonSchemaTransform } from "fastify-type-provider-zod";
import { z } from "zod/v4";

import prisma from "./config/database";
import { closeRedis } from "./config/redis";
import { bodySizeConfig, getCorsConfig, helmetConfig, rateLimitConfig } from "./config/security";
import { auth } from "./lib/auth";
import { getClientIP, validateTurnstile } from "./lib/turnstile";
import routes from "./routes/index";
import { cleanup } from "./utils/database-init";

const fastify = Fastify({
	logger: true,
	bodyLimit: bodySizeConfig.bodyLimit,
	// Trust proxy for proper rate limiting and IP detection
	// Trust all proxies when listening on 0.0.0.0 (for Cloudflare)
	trustProxy: true
});

// Set Zod validator and serializer compilers for automatic Zod to JSON Schema conversion
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Override logger config (the second one takes precedence)
fastify.log.level = "error";

// Register OpenTelemetry plugin only if enabled
if (process.env.OTEL_ENABLED === "true") {
	const openTelemetryPlugin = await import("@autotelic/fastify-opentelemetry");
	await fastify.register(openTelemetryPlugin.default, {
		wrapRoutes: true, // Automatically trace each route with active context
		exposeApi: true // Expose request.openTelemetry() API
	});
}

// Register Prometheus metrics exporter
await fastify.register(fastifyMetrics, {
	endpoint: "/metrics", // Prometheus scrapes this endpoint
	defaultMetrics: { enabled: true }, // Enable default Node.js metrics
	routeMetrics: {
		enabled: true, // Enable route-specific metrics
		registeredRoutesOnly: false, // Only track registered routes
		groupStatusCodes: false // Keep exact status codes
	}
});

/*
	註冊基本的安全中間件、Routes、CORS
	其他的 route 在下面
*/

// Register security headers (helmet)
await fastify.register(helmet, helmetConfig);

// Register rate limiting
await fastify.register(rateLimit, rateLimitConfig.global);

// Register CORS with secure configuration
await fastify.register(cors, getCorsConfig());

// Swagger UI
await fastify.register(fastifySwagger, {
	openapi: {
		info: {
			title: "SITCONTIX API",
			version: "1.0.0"
		},
		tags: [
			{ name: "system", description: "系統測試" },
			{ name: "auth", description: "驗證 handled by BetterAuth" },
			{ name: "events", description: "活動資訊" },
			{ name: "registrations", description: "報名相關操作 requires: 登入 session" },
			{ name: "referrals", description: "推薦相關操作 requires: 登入 session" },
			{ name: "invitation-codes", description: "邀請碼相關操作" },
			{ name: "admin/analytics", description: "管理後台分析相關操作 requires: Admin Role" },
			{ name: "admin/users", description: "管理後台用戶相關操作 requires: Admin Role" },
			{ name: "admin/events", description: "管理後台活動相關操作 requires: Admin Role" },
			{ name: "admin/tickets", description: "管理後台票券相關操作 requires: Admin Role" },
			{ name: "admin/registrations", description: "管理後台報名相關操作 requires: Admin Role" },
			{ name: "admin/invitation-codes", description: "管理後台邀請碼相關操作 requires: Admin Role" },
			{ name: "admin/referrals", description: "管理後台標籤相關操作 requires: Admin Role" },
			{ name: "admin/email-campaigns", description: "管理後台郵件活動相關操作 requires: Admin Role" }
		]
	},
	transform: jsonSchemaTransform
});

await fastify.register(fastifySwaggerUi, {
	routePrefix: "/docs",
	uiConfig: {
		deepLinking: false
	},
	uiHooks: {
		onRequest: function (_request, _reply, next) {
			next();
		},
		preHandler: function (_request, _reply, next) {
			next();
		}
	},
	transformStaticCSP: header => header,
	transformSpecification: (swaggerObject, _request, _reply) => {
		return swaggerObject;
	},
	transformSpecificationClone: true,
	theme: {
		title: "SITCONTIX API",
		css: [
			{
				filename: "theme.css",
				content:
					".topbar{display:none}body,.swagger-ui .scheme-container{background:#F8F6F5}.swagger-ui{color:#F4F6F6}.swagger-ui .opblock-body pre.microlight{font-family: monospace;}*{font-family:'LINESeedTW'!important;.title span{display:none;}}"
			}
		]
	}
});

interface AuthQuerystring {
	locale?: string;
	token?: string;
	returnUrl?: string;
}

interface MagicLinkBody {
	email: string;
	name?: string;
	callbackURL?: string;
	newUserCallbackURL?: string;
	errorCallbackURL?: string;
	turnstileToken?: string;
}

// Custom route for magic link sending with Turnstile validation
fastify.post<{ Body: MagicLinkBody }>(
	"/api/auth/sign-in/magic-link",
	{
		schema: {
			description: "Send magic link with Turnstile protection",
			tags: ["auth"],
			body: z.object({
				email: z.email(),
				name: z.string().optional(),
				callbackURL: z.string().optional(),
				newUserCallbackURL: z.string().optional(),
				errorCallbackURL: z.string().optional(),
				turnstileToken: z.string().optional()
			})
		},
		config: {
			rateLimit: rateLimitConfig.auth
		}
	},
	async (request: FastifyRequest<{ Body: MagicLinkBody }>, reply: FastifyReply) => {
		try {
			const { turnstileToken } = request.body;

			// Validate Turnstile token
			if (!turnstileToken) {
				fastify.log.warn("Magic link request missing Turnstile token");
				return reply.code(400).send({
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "驗證失敗，請重新整理頁面再試"
					}
				});
			}

			const clientIP = getClientIP(request.headers);
			const turnstileResult = await validateTurnstile(turnstileToken, {
				remoteip: clientIP,
				expectedAction: "magic-link"
			});

			if (!turnstileResult.valid) {
				fastify.log.warn(
					{
						reason: turnstileResult.reason,
						errors: turnstileResult.errors,
						ip: clientIP,
						email: request.body.email
					},
					"Turnstile validation failed for magic link"
				);
				return reply.code(400).send({
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "驗證失敗，請重新整理頁面再試"
					}
				});
			}

			// Turnstile validation passed, forward to BetterAuth
			const protocol = request.headers["x-forwarded-proto"] || "http";
			const host = request.headers.host;
			const url = `${protocol}://${host}/api/auth/sign-in/magic-link`;

			// Remove turnstileToken from body before forwarding to BetterAuth
			const { turnstileToken: _removed, ...bodyWithoutTurnstile } = request.body;

			const webRequest = new Request(url, {
				method: "POST",
				headers: {
					...(request.headers as Record<string, string>),
					"content-type": "application/json"
				},
				body: JSON.stringify(bodyWithoutTurnstile)
			});

			const response = await auth.handler(webRequest);

			reply.code(response.status);

			// Set headers as-is
			for (const [key, value] of response.headers) {
				reply.header(key, value);
			}

			if (response.body) {
				return await response.text();
			}

			return "";
		} catch (error) {
			fastify.log.error({ err: error }, "Magic link send error");
			return reply.code(500).send({
				success: false,
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "Internal server error"
				}
			});
		}
	}
);

// Better Auth routes with rate limiting
fastify.all(
	"/api/auth/*",
	{
		schema: {
			description: "send auth link: POST /api/auth/sign-in/magic-link; get session: GET /api/auth/get-session",
			tags: ["auth"]
		},
		config: {
			rateLimit: rateLimitConfig.auth
		}
	},
	async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			const protocol = request.headers["x-forwarded-proto"] || "http";
			const host = request.headers.host;
			const url = `${protocol}://${host}${request.url}`;

			let body: string | undefined = undefined;
			if (request.method !== "GET" && request.method !== "HEAD") {
				if (request.headers["content-type"]?.includes("application/json")) {
					body = JSON.stringify(request.body);
				} else {
					const chunks: Buffer[] = [];
					for await (const chunk of request.raw) {
						chunks.push(chunk);
					}
					body = Buffer.concat(chunks).toString();
				}
			}

			const webRequest = new Request(url, {
				method: request.method,
				headers: request.headers as Record<string, string>,
				body: body
			});

			const response = await auth.handler(webRequest);

			reply.code(response.status);

			// Set headers as-is (proxy makes requests same-origin)
			for (const [key, value] of response.headers) {
				reply.header(key, value);
			}

			if (response.body) {
				return await response.text();
			}

			return "";
		} catch (error) {
			fastify.log.error({ err: error }, "Auth handler error");
			reply.code(500);
			return {
				success: false,
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "Internal server error"
				}
			};
		}
	}
);

// Handle magic link verification with redirect
fastify.get<{ Querystring: AuthQuerystring }>("/api/auth/magic-link/verify", async (request, reply) => {
	const locale = request.query.locale || "zh-Hant";

	try {
		const { token, returnUrl } = request.query;

		// Validate token presence
		if (!token) {
			fastify.log.warn("Magic link verification attempted without token");
			return reply.redirect(`${process.env.FRONTEND_URI}/${locale}/login?error=invalid_token`);
		}

		// Validate token format (should be a non-empty string)
		if (typeof token !== "string" || token.trim().length === 0) {
			fastify.log.warn("Magic link verification attempted with invalid token format");
			return reply.redirect(`${process.env.FRONTEND_URI}/${locale}/login?error=invalid_token`);
		}

		// Call the Better Auth verification endpoint internally
		const protocol = request.headers["x-forwarded-proto"] || "http";
		const host = request.headers.host;
		const authUrl = `${protocol}://${host}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`;

		const webRequest = new Request(authUrl, {
			method: "GET",
			headers: request.headers as Record<string, string>
		});

		let response: Response;
		try {
			response = await auth.handler(webRequest);
		} catch (authError) {
			fastify.log.error({ err: authError }, "Better Auth handler error:");
			return reply.redirect(`${process.env.FRONTEND_URI}/${locale}/login?error=verification_failed`);
		}

		// Forward all Set-Cookie headers as-is
		response.headers.forEach((value, key) => {
			if (key.toLowerCase() === "set-cookie") {
				reply.header("set-cookie", value);
			}
		});

		if (response.ok) {
			// Mark the most recent magic link attempt as successful
			try {
				const responseData = await response
					.clone()
					.json()
					.catch(() => null);
				const userEmail = (responseData as { user?: { email?: string } })?.user?.email;

				if (userEmail) {
					await prisma.magicLinkAttempt.updateMany({
						where: {
							email: userEmail.toLowerCase(),
							success: false,
							createdAt: {
								gte: new Date(Date.now() - 600000) // Within last 10 minutes (magic link expiry)
							}
						},
						data: {
							success: true
						}
					});
				}
			} catch (updateError) {
				fastify.log.warn({ err: updateError }, "Failed to update magic link attempt status");
				// Don't fail the login if we can't update the attempt
			}

			// Redirect to frontend success page with returnUrl if available
			const successUrl = returnUrl
				? `${process.env.FRONTEND_URI}/${locale}/login/magic-link?status=success&returnUrl=${encodeURIComponent(returnUrl)}`
				: `${process.env.FRONTEND_URI}/${locale}/login/magic-link?status=success`;

			fastify.log.info(`Magic link verification successful for token: ${token.substring(0, 10)}...`);
			return reply.redirect(successUrl);
		} else {
			// Log the specific response status for debugging
			const responseText = await response.text().catch(() => "Unable to read response");
			fastify.log.warn(`Magic link verification failed with status ${response.status}: ${responseText}`);

			// Determine error type based on status code
			let errorType = "verification_failed";
			if (response.status === 400) {
				errorType = "invalid_token";
			} else if (response.status === 404) {
				errorType = "invalid_token";
			} else if (response.status === 410) {
				errorType = "token_expired";
			}

			return reply.redirect(`${process.env.FRONTEND_URI}/${locale}/login?error=${errorType}`);
		}
	} catch (error) {
		fastify.log.error(
			{
				error: (error as Error).message,
				stack: (error as Error).stack,
				query: request.query
			},
			"Magic link verification error"
		);
		return reply.redirect(`${process.env.FRONTEND_URI}/${locale}/login?error=server_error`);
	}
});

interface ValidationError {
	instancePath: string;
	message?: string;
	keyword?: string;
}

interface FastifyValidationError extends Error {
	validation?: ValidationError[];
	statusCode?: number;
	code?: string;
	cause?: unknown;
}

// Global error handler to format errors according to API response structure
fastify.setErrorHandler((error: FastifyValidationError, request: FastifyRequest, reply: FastifyReply) => {
	const { log } = fastify;

	// Handle Fastify validation errors (FST_ERR_VALIDATION)
	if (error.validation) {
		const validationDetails = error.validation.map(err => ({
			field: err.instancePath.replace(/^\//, ""), // Remove leading slash
			message: err.message,
			keyword: err.keyword
		}));

		const errorResponse = {
			success: false,
			error: {
				code: "VALIDATION_ERROR",
				message: error.message || "請求驗證失敗",
				details: validationDetails
			}
		};

		log.warn({ validationError: error.validation, url: request.url }, "Validation error");
		return reply.code(error.statusCode || 400).send(errorResponse);
	}

	// Handle response serialization errors (from fastify-type-provider-zod)
	if (error.message === "Response doesn't match the schema" && error.cause) {
		// Extract Zod validation issues from the cause
		const zodError = error.cause as { issues?: Array<{ path: (string | number)[]; message: string; code: string }> };
		if (zodError.issues) {
			log.error(
				{
					url: request.url,
					method: request.method,
					schemaValidationIssues: zodError.issues.map(issue => ({
						path: issue.path.join("."),
						message: issue.message,
						code: issue.code
					}))
				},
				"Response schema mismatch - data returned by handler doesn't match expected schema"
			);
		} else {
			log.error(
				{
					url: request.url,
					method: request.method,
					cause: error.cause
				},
				"Response schema mismatch - unknown cause format"
			);
		}

		const errorResponse = {
			success: false,
			error: {
				code: "SCHEMA_MISMATCH",
				message: "Response doesn't match the schema"
			}
		};

		return reply.code(500).send(errorResponse);
	}

	// Handle custom application errors (with statusCode)
	if (error.statusCode) {
		const errorResponse = {
			success: false,
			error: {
				code: error.code || "ERROR",
				message: error.message || "發生錯誤"
			}
		};

		log.error({ error: error.message, statusCode: error.statusCode, url: request.url }, "Application error");
		return reply.code(error.statusCode).send(errorResponse);
	}

	// Handle unexpected errors (500)
	log.error({ error: error.stack, url: request.url }, "Internal server error");
	const errorResponse = {
		success: false,
		error: {
			code: "INTERNAL_SERVER_ERROR",
			message: process.env.NODE_ENV === "production" ? "內部伺服器錯誤" : error.message
		}
	};

	return reply.code(500).send(errorResponse);
});

// 剩下的 routes
await fastify.register(routes);

const port = Number(process.env.PORT) || 3000;

fastify.listen({ host: "0.0.0.0", port }, (err, address) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info(`Server running at ${address}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
	fastify.log.info("Received SIGINT, shutting down gracefully...");
	try {
		await cleanup();
		await closeRedis();
		await fastify.close();
		process.exit(0);
	} catch (error) {
		fastify.log.error({ err: error }, "Error during shutdown");
		process.exit(1);
	}
});
