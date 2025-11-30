import type { FastifyPluginAsync } from "fastify";
import { requireAdminOrEventAdmin } from "#middleware/auth.js";

import analyticsRoutes from "./admin/analytics.js";
import emailCampaignsRoutes from "./admin/emailCampaigns.js";
import eventFormFieldsRoutes from "./admin/eventFormFields.js";
import eventsRoutes from "./admin/events.js";
import invitationCodesRoutes from "./admin/invitationCodes.js";
import referralsRoutes from "./admin/referrals.js";
import registrationsRoutes from "./admin/registrations.js";
import smsVerificationLogsRoutes from "./admin/smsVerificationLogs.js";
import ticketsRoutes from "./admin/tickets.js";
import usersRoutes from "./admin/users.js";

const adminRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.addHook("preHandler", requireAdminOrEventAdmin);

	await fastify.register(analyticsRoutes);
	await fastify.register(usersRoutes);
	await fastify.register(eventsRoutes);
	await fastify.register(ticketsRoutes);
	await fastify.register(eventFormFieldsRoutes);
	await fastify.register(registrationsRoutes);
	await fastify.register(invitationCodesRoutes);
	await fastify.register(referralsRoutes);
	await fastify.register(emailCampaignsRoutes);
	await fastify.register(smsVerificationLogsRoutes);
};

export default adminRoutes;
