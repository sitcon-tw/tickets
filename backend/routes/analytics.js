import { requireAdmin } from "../middleware/auth.js";

import dashboardRoutes from "./admin/analytics/dashboard.js";
import referralsRoutes from "./admin/analytics/referrals.js";
import trendsRoutes from "./admin/analytics/trends.js";

export default async function analyticsRoutes(fastify, options) {
	fastify.addHook("preHandler", requireAdmin);

	await fastify.register(dashboardRoutes);
	await fastify.register(referralsRoutes);
	await fastify.register(trendsRoutes);
}
