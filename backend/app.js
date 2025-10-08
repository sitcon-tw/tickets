import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import dotenv from "dotenv";
import Fastify from "fastify";

import { bodySizeConfig, getCorsConfig, helmetConfig, rateLimitConfig } from "./config/security.js";
import { auth } from "./lib/auth.js";
import routes from "./routes/index.js";
import { cleanup } from "./utils/database-init.js";

dotenv.config();

const fastify = Fastify({
	logger: true,
	bodyLimit: bodySizeConfig.bodyLimit,
	// Trust proxy for proper rate limiting and IP detection
	trustProxy: process.env.TRUST_PROXY === "true" || process.env.NODE_ENV === "production"
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
	swagger: {
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
			return { error: "Internal server error" };
		}
	}
);

// Handle magic link verification with redirect
fastify.get("/api/auth/magic-link/verify", async (request, reply) => {
	try {
		const { token, locale = "zh-Hant" } = request.query;

		if (!token) {
			return reply.redirect(`${process.env.FRONTEND_URI}/${locale}/login?error=invalid_token`);
		}

		// Call the Better Auth verification endpoint internally
		const protocol = request.headers["x-forwarded-proto"] || "http";
		const host = request.headers.host;
		const authUrl = `${protocol}://${host}/api/auth/magic-link/verify?token=${token}`;

		const webRequest = new Request(authUrl, {
			method: "GET",
			headers: request.headers
		});

		const response = await auth.handler(webRequest);

		// Forward all Set-Cookie headers as-is
		response.headers.forEach((value, key) => {
			if (key.toLowerCase() === "set-cookie") {
				reply.header("set-cookie", value);
			}
		});

		if (response.ok) {
			// Redirect to frontend success page
			return reply.redirect(`${process.env.FRONTEND_URI}/${locale}/login/magic-link?status=success`);
		} else {
			// Redirect to frontend error page
			return reply.redirect(`${process.env.FRONTEND_URI}/${locale}/login?error=verification_failed`);
		}
	} catch (error) {
		fastify.log.error("Magic link verification error:", error);
		const locale = request.query.locale || "zh-Hant";
		return reply.redirect(`${process.env.FRONTEND_URI}/${locale}/login?error=server_error`);
	}
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
		await fastify.close();
		process.exit(0);
	} catch (error) {
		fastify.log.error("Error during shutdown:", error);
		process.exit(1);
	}
});
