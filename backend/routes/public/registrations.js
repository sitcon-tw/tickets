import coreRoutes from "./registrations/core.js";
import editingRoutes from "./registrations/editing.js";
import managementRoutes from "./registrations/management.js";
import referralRoutes from "./registrations/referrals.js";

export default async function registrationsRoutes(fastify, options) {
	// Register modular registration routes
	await fastify.register(coreRoutes);
	await fastify.register(editingRoutes);
	await fastify.register(managementRoutes);
	await fastify.register(referralRoutes);
}