import { requireAdmin } from "../middleware/auth.js";
import filesRoutes from "./system/files.js";
import healthRoutes from "./system/health.js";
import settingsRoutes from "./system/settings.js";

export default async function systemRoutes(fastify, options) {
	// Register public health routes
	await fastify.register(healthRoutes);

	// Protected admin-only routes
	await fastify.register(async function (fastify) {
		fastify.addHook("preHandler", requireAdmin);

		// Register modular admin system route handlers
		await fastify.register(settingsRoutes);
		await fastify.register(filesRoutes);
	});
}
