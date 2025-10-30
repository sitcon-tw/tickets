// IMPORTANT: Import tracing FIRST before any other modules
// This ensures OpenTelemetry SDK is initialized before Fastify
import "./lib/tracing.js";

import openTelemetryPlugin from "@autotelic/fastify-opentelemetry";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import dotenv from "dotenv";
import Fastify from "fastify";
import fastifyMetrics from "fastify-metrics";

import { closeRedis } from "./config/redis.js";
import { bodySizeConfig, getCorsConfig, helmetConfig, rateLimitConfig } from "./config/security.js";
import { auth } from "./lib/auth.js";
import routes from "./routes/index.js";
import { cleanup } from "./utils/database-init.js";

dotenv.config();

const fastify = Fastify({
	logger: true,
	bodyLimit: bodySizeConfig.bodyLimit,
	// Trust proxy for proper rate limiting and IP detection
	// Trust all proxies when listening on 0.0.0.0 (for Cloudflare)
	trustProxy: true
});

// Register OpenTelemetry plugin for automatic HTTP request tracing
await fastify.register(openTelemetryPlugin, {
	wrapRoutes: true, // Automatically trace each route with active context
	exposeApi: true // Expose request.openTelemetry() API
});

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
			title: "SITCON 報名系統 API",
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
	}
});

await fastify.register(fastifySwaggerUi, {
	routePrefix: "/docs",
	uiConfig: {
		deepLinking: false
	},
	uiHooks: {
		onRequest: function (request, reply, next) {
			next();
		},
		preHandler: function (request, reply, next) {
			next();
		}
	},
	transformStaticCSP: header => header,
	transformSpecification: (swaggerObject, request, reply) => {
		return swaggerObject;
	},
	transformSpecificationClone: true,
	theme: {
		title: "SITCON 報名系統 API",
		js: [
			{
				filename: "special.js",
				content: `
    window.addEventListener("DOMContentLoaded", () => {
        import("https://font.emtech.cc/emfont.js").then(() => {
			document.body.classList.add("emfont-LINESeedTW");
			const waiting =  setInterval(() => {
				if(document.querySelector(".title")?.innerHTML) {
					clearInterval(waiting);
					emfont.init();
				}
			}, 30);
        });
      });
    `
			}
		],
		css: [
			{
				filename: "theme.css",
				content: ".topbar{display:none}body,.swagger-ui .scheme-container{background:#F8F6F5}.swagger-ui{color:#F4F6F6}.swagger-ui .opblock-body pre.microlight{font-family: monospace;}*{font-family:'LINESeedTW'!important;.title span{display:none;}}"
			}
		]
	}
});

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
	async (request, reply) => {
		try {
			const protocol = request.headers["x-forwarded-proto"] || "http";
			const host = request.headers.host;
			const url = `${protocol}://${host}${request.url}`;

			let body = undefined;
			if (request.method !== "GET" && request.method !== "HEAD") {
				if (request.headers["content-type"]?.includes("application/json")) {
					body = JSON.stringify(request.body);
				} else {
					const chunks = [];
					for await (const chunk of request.raw) {
						chunks.push(chunk);
					}
					body = Buffer.concat(chunks).toString();
				}
			}

			const webRequest = new Request(url, {
				method: request.method,
				headers: request.headers,
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
			fastify.log.error("Auth handler error:", error);
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
fastify.get("/api/auth/magic-link/verify", async (request, reply) => {
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
			headers: request.headers
		});

		let response;
		try {
			response = await auth.handler(webRequest);
		} catch (authError) {
			fastify.log.error("Better Auth handler error:", authError);
			return reply.redirect(`${process.env.FRONTEND_URI}/${locale}/login?error=verification_failed`);
		}

		// Forward all Set-Cookie headers as-is
		response.headers.forEach((value, key) => {
			if (key.toLowerCase() === "set-cookie") {
				reply.header("set-cookie", value);
			}
		});

		if (response.ok) {
			// Redirect to frontend success page with returnUrl if available
			const successUrl = returnUrl ? `${process.env.FRONTEND_URI}/${locale}/login/magic-link?status=success&returnUrl=${encodeURIComponent(returnUrl)}` : `${process.env.FRONTEND_URI}/${locale}/login/magic-link?status=success`;

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
		fastify.log.error("Magic link verification error:", {
			error: error.message,
			stack: error.stack,
			query: request.query
		});
		return reply.redirect(`${process.env.FRONTEND_URI}/${locale}/login?error=server_error`);
	}
});

// Global error handler to format errors according to API response structure
fastify.setErrorHandler((error, request, reply) => {
	const { log } = fastify;

	// Handle Fastify validation errors (FST_ERR_VALIDATION)
	if (error.validation) {
		const validationDetails = error.validation.map(err => ({
			field: err.instancePath.replace(/^\//, ''), // Remove leading slash
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

const port = process.env.PORT || 3000;

// // Initialize database with default data
// try {
// 	await initializeDatabase();
// } catch (error) {
// 	fastify.log.error('Failed to initialize database:', error);
// 	process.exit(1);
// }

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
		fastify.log.error("Error during shutdown:", error);
		process.exit(1);
	}
});

process.on("SIGTERM", async () => {
	fastify.log.info("Received SIGTERM, shutting down gracefully...");
	try {
		await cleanup();
		await closeRedis();
		await fastify.close();
		process.exit(0);
	} catch (error) {
		fastify.log.error("Error during shutdown:", error);
		process.exit(1);
	}
});
