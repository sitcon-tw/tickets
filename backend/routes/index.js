import adminRoutes from "./admin.js";
import analyticsRoutes from "./analytics.js";
import checkinRoutes from "./checkin.js";
import publicRoutes from "./public.js";
import systemRoutes from "./system.js";

export default async function routes(fastify, options) {
	// Public API routes
	await fastify.register(publicRoutes, { prefix: "/api" });

	// Admin API routes
	await fastify.register(adminRoutes, { prefix: "/api/admin" });

	// Check-in API routes
	await fastify.register(checkinRoutes, { prefix: "/api/checkin" });

	// System API routes
	await fastify.register(systemRoutes, { prefix: "/api/system" });

	// Analytics API routes
	await fastify.register(analyticsRoutes, { prefix: "/api/admin/analytics" });
}
