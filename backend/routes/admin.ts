import { requireAdminOrEventAdmin } from "#middleware/auth";
import type { FastifyPluginAsync } from "fastify";

import emailCampaignsRoutes from "./admin/emailCampaigns";
import eventDashboardRoutes from "./admin/eventDashboard";
import eventFormFieldsRoutes from "./admin/eventFormFields";
import eventsRoutes from "./admin/events";
import invitationCodesRoutes from "./admin/invitationCodes";
import referralsRoutes from "./admin/referrals";
import registrationsRoutes from "./admin/registrations";
import settingsRoutes from "./admin/settings";
import smsVerificationLogsRoutes from "./admin/smsVerificationLogs";
import sponsorsRoutes from "./admin/sponsors";
import ticketsRoutes from "./admin/tickets";
import usersRoutes from "./admin/users";
import webhooksRoutes from "./admin/webhooks";

const adminRoutes: FastifyPluginAsync = async fastify => {
	fastify.addHook("preHandler", requireAdminOrEventAdmin);

	await fastify.register(eventDashboardRoutes);
	await fastify.register(usersRoutes);
	await fastify.register(eventsRoutes);
	await fastify.register(ticketsRoutes);
	await fastify.register(eventFormFieldsRoutes);
	await fastify.register(registrationsRoutes);
	await fastify.register(invitationCodesRoutes);
	await fastify.register(referralsRoutes);
	await fastify.register(emailCampaignsRoutes);
	await fastify.register(smsVerificationLogsRoutes);
	await fastify.register(sponsorsRoutes);
	await fastify.register(webhooksRoutes);
	await fastify.register(settingsRoutes);
};

export default adminRoutes;
