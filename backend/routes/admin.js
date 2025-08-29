// Admin route imports organized alphabetically by domain
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
	// Core entity management routes
	await fastify.register(usersRoutes);
	await fastify.register(eventsRoutes);
	await fastify.register(ticketsRoutes);
	await fastify.register(formFieldsRoutes);
	
	// Registration and participation management
	await fastify.register(registrationsRoutes);
	await fastify.register(invitationCodesRoutes);
	await fastify.register(referralsRoutes);
	
	// Communication and data export
	await fastify.register(emailCampaignsRoutes);
	await fastify.register(exportsRoutes);
}
