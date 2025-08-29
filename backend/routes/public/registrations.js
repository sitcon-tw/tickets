import coreRoutes from "./registrations/core.js";
import editingRoutes from "./registrations/editing.js";
import managementRoutes from "./registrations/management.js";

export default async function registrationsRoutes(fastify, options) {
	await fastify.register(coreRoutes);
	await fastify.register(editingRoutes);
	await fastify.register(managementRoutes);
}