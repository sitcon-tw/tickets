import { requireAdmin, requireAdminOrEventAdmin } from "#middleware/auth.js";

import analyticsRoutes from "./admin/analytics.js";
import emailCampaignsRoutes from "./admin/emailCampaigns.js";
import eventsRoutes from "./admin/events.js";
import invitationCodesRoutes from "./admin/invitationCodes.js";
import referralsRoutes from "./admin/referrals.js";
import registrationsRoutes from "./admin/registrations.js";
import smsVerificationLogsRoutes from "./admin/smsVerificationLogs.js";
import ticketFormFieldsRoutes from "./admin/ticketFormFields.js";
import ticketsRoutes from "./admin/tickets.js";
import usersRoutes from "./admin/users.js";

export default async function adminRoutes(fastify) {
	// Apply requireAdminOrEventAdmin globally (allows both admin and eventAdmin)
	fastify.addHook("preHandler", requireAdminOrEventAdmin);

	// Routes that need admin-only access will add requireAdmin in their route definitions
	await fastify.register(analyticsRoutes);
	await fastify.register(usersRoutes);
	await fastify.register(eventsRoutes);
	await fastify.register(ticketsRoutes);
	await fastify.register(ticketFormFieldsRoutes);
	await fastify.register(registrationsRoutes);
	await fastify.register(invitationCodesRoutes);
	await fastify.register(referralsRoutes);
	await fastify.register(emailCampaignsRoutes);
	await fastify.register(smsVerificationLogsRoutes);
}
