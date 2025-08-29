import { requireViewer } from "../middleware/auth.js";

// Analytics route imports organized alphabetically
import dashboardRoutes from "./analytics/dashboard.js";
import referralsRoutes from "./analytics/referrals.js";
import trendsRoutes from "./analytics/trends.js";

export default async function analyticsRoutes(fastify, options) {
	// Add viewer auth middleware to all analytics routes
	fastify.addHook("preHandler", requireViewer);

	// Overview and summary analytics
	await fastify.register(dashboardRoutes);
	
	// Specific analytics modules
	await fastify.register(referralsRoutes);
	await fastify.register(trendsRoutes);
}
