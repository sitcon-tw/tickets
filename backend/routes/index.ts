import type { FastifyPluginAsync } from "fastify";
import adminRoutes from "./admin.js";
import publicRoutes from "./public.js";
import systemRoutes from "./system.js";

const routes: FastifyPluginAsync = async (fastify) => {
	await fastify.register(publicRoutes, { prefix: "/api" });
	await fastify.register(adminRoutes, { prefix: "/api/admin" });
	await fastify.register(systemRoutes, { prefix: "/api/system" });
};

export default routes;
