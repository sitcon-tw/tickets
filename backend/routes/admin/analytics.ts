import { requireAdmin } from "#middleware/auth";
import type { FastifyPluginAsync } from "fastify";
import dashboardRoutes from "./analytics/dashboard";
import referralsRoutes from "./analytics/referrals";
import trendsRoutes from "./analytics/trends";

const analyticsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	fastify.addHook("preHandler", requireAdmin);

	await fastify.register(dashboardRoutes);
	await fastify.register(referralsRoutes);
	await fastify.register(trendsRoutes);
};

export default analyticsRoutes;
