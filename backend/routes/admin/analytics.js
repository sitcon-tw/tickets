import { requireAdmin } from "#middleware/auth.js";
import dashboardRoutes from "./analytics/dashboard.js";
import referralsRoutes from "./analytics/referrals.js";
import trendsRoutes from "./analytics/trends.js";

export default async function analyticsRoutes(fastify, options) {
	// Analytics routes are admin-only
	fastify.addHook("preHandler", requireAdmin);

	await fastify.register(dashboardRoutes);
	await fastify.register(referralsRoutes);
	await fastify.register(trendsRoutes);
}
