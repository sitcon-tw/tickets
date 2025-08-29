import adminRoutes from "./admin.js";
import checkinRoutes from "./checkin.js";
import publicRoutes from "./public.js";
import systemRoutes from "./system.js";

export default async function routes(fastify) {
	await fastify.register(publicRoutes, { prefix: "/api" });
	await fastify.register(adminRoutes, { prefix: "/api/admin" });
	await fastify.register(checkinRoutes, { prefix: "/api/checkin" });
	await fastify.register(systemRoutes, { prefix: "/api/system" });
}
