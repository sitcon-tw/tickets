import dashboardRoutes from "./analytics/dashboard.js";
import referralsRoutes from "./analytics/referrals.js";
import trendsRoutes from "./analytics/trends.js";

export default async function analyticsRoutes(fastify, options) {
	await fastify.register(dashboardRoutes);
	await fastify.register(referralsRoutes);
	await fastify.register(trendsRoutes);
}