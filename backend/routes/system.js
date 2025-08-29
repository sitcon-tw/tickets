import { requireAdmin } from "../middleware/auth.js";

// System route imports organized alphabetically
import filesRoutes from "./system/files.js";
import healthRoutes from "./system/health.js";
import settingsRoutes from "./system/settings.js";

export default async function systemRoutes(fastify, options) {
	// Public system routes (no authentication required)
	await fastify.register(healthRoutes);

	// Protected admin-only system routes
	await fastify.register(async function (fastify) {
		fastify.addHook("preHandler", requireAdmin);

		// Configuration management
		await fastify.register(settingsRoutes);
		
		// File system operations
		await fastify.register(filesRoutes);
	});
}
