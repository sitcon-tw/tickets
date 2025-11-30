import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "#middleware/auth.js";
import dashboardRoutes from "./analytics/dashboard.js";
import referralsRoutes from "./analytics/referrals.js";
import trendsRoutes from "./analytics/trends.js";

const analyticsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	fastify.addHook("preHandler", requireAdmin);

	await fastify.register(dashboardRoutes);
	await fastify.register(referralsRoutes);
	await fastify.register(trendsRoutes);
};

export default analyticsRoutes;
