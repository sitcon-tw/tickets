import emailCampaignsRoutes from "./admin/emailCampaigns.js";
import eventsRoutes from "./admin/events.js";
import exportsRoutes from "./admin/exports.js";
import formFieldsRoutes from "./admin/formFields.js";
import invitationCodesRoutes from "./admin/invitationCodes.js";
import referralsRoutes from "./admin/referrals.js";
import registrationsRoutes from "./admin/registrations.js";
import ticketsRoutes from "./admin/tickets.js";
import usersRoutes from "./admin/users.js";

export default async function adminRoutes(fastify, options) {
	// Register modular admin route handlers
	await fastify.register(usersRoutes);
	await fastify.register(eventsRoutes);
	await fastify.register(ticketsRoutes);
	await fastify.register(formFieldsRoutes);
	await fastify.register(registrationsRoutes);
	await fastify.register(invitationCodesRoutes);
	await fastify.register(referralsRoutes);
	await fastify.register(emailCampaignsRoutes);
	await fastify.register(exportsRoutes);
}
