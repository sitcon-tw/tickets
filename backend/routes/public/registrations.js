import { requireAuth } from "#middleware/auth.js";

import coreRoutes from "./registrations/core.js";
import editingRoutes from "./registrations/editing.js";
import managementRoutes from "./registrations/management.js";

export default async function registrationsRoutes(fastify, options) {
	fastify.addHook("preHandler", requireAuth);

	await fastify.register(coreRoutes);
	await fastify.register(editingRoutes);
	await fastify.register(managementRoutes);
}