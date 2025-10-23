import adminRoutes from "./admin.js";
import publicRoutes from "./public.js";
import systemRoutes from "./system.js";

export default async function routes(fastify) {
	await fastify.register(publicRoutes, { prefix: "/api" });
	await fastify.register(adminRoutes, { prefix: "/api/admin" });
	await fastify.register(systemRoutes, { prefix: "/api/system" });
}
