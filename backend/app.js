import cors from "@fastify/cors";
import staticPlugin from "@fastify/static";
import dotenv from "dotenv";
import Fastify from "fastify";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { auth } from "./lib/auth.js";
import routes from "./routes/index.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({
	logger: true
});

// Enable CORS with proper configuration for Better Auth
await fastify.register(cors, {
	origin: [process.env.FRONTEND_URI || "http://localhost:4321", process.env.BACKEND_URI || "http://localhost:3000"], // Allow frontend and backend
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
});

// Serve static files from "public"
await fastify.register(staticPlugin, {
	root: join(__dirname, "public"),
	prefix: "/" // Serve files directly from root
});

// Set up Swagger for API documentation
await fastify.register(import("@fastify/swagger"));

await fastify.register(import("@fastify/swagger-ui"), {
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
	staticCSP: true,
	transformStaticCSP: header => header,
	transformSpecification: (swaggerObject, request, reply) => {
		return swaggerObject;
	},
	transformSpecificationClone: true
});

// Register API routes
await fastify.register(routes);

// Better Auth routes
fastify.all(
	"/api/auth/*",
	{
		schema: {
			description: "Better Auth API - 請查看官網的客戶端套件說明，不要直接戳 API!!! https://www.better-auth.com/docs/plugins/magic-link",
			tags: ["auth"]
		}
	},
	async (request, reply) => {
		console.log(`Auth request: ${request.method} ${request.url}`);
		try {
			const protocol = request.headers["x-forwarded-proto"] || "http";
			const host = request.headers.host;
			const url = `${protocol}://${host}${request.url}`;

			let body = undefined;
			if (request.method !== "GET" && request.method !== "HEAD") {
				console.log("Content-Type:", request.headers["content-type"]);
				console.log("Request body:", request.body);

				if (request.headers["content-type"]?.includes("application/json")) {
					body = JSON.stringify(request.body);
				} else {
					const chunks = [];
					for await (const chunk of request.raw) {
						chunks.push(chunk);
					}
					body = Buffer.concat(chunks).toString();
				}
				console.log("Processed body:", body);
			}

			const webRequest = new Request(url, {
				method: request.method,
				headers: request.headers,
				body: body
			});

			const response = await auth.handler(webRequest);

			reply.code(response.status);

			for (const [key, value] of response.headers) {
				reply.header(key, value);
			}

			if (response.body) {
				const text = await response.text();
				return text;
			}

			return "";
		} catch (error) {
			console.error("Auth handler error:", error);
			reply.code(500);
			return { error: "Internal server error" };
		}
	}
);

const port = process.env.PORT || 3000;

fastify.listen({ port }, (err, address) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info(`Server running at ${address}`);
});
