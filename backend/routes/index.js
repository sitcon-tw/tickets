// Route imports organized alphabetically
import adminRoutes from "./admin.js";
import analyticsRoutes from "./analytics.js";
import checkinRoutes from "./checkin.js";
import publicRoutes from "./public.js";
import systemRoutes from "./system.js";

export default async function routes(fastify, options) {
	// Public API routes - available to all users
	await fastify.register(publicRoutes, { prefix: "/api" });

	// Admin API routes - requires admin authentication
	await fastify.register(adminRoutes, { prefix: "/api/admin" });

	// Analytics API routes - requires viewer authentication  
	await fastify.register(analyticsRoutes, { prefix: "/api/analytics" });

	// Check-in API routes - requires checkin authentication
	await fastify.register(checkinRoutes, { prefix: "/api/checkin" });

	// System API routes - health checks and admin system management
	await fastify.register(systemRoutes, { prefix: "/api/system" });
}
