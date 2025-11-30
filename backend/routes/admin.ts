import type { FastifyPluginAsync } from "fastify";
import { requireAdminOrEventAdmin } from "#middleware/auth";

import analyticsRoutes from "./admin/analytics";
import emailCampaignsRoutes from "./admin/emailCampaigns";
import eventFormFieldsRoutes from "./admin/eventFormFields";
import eventsRoutes from "./admin/events";
import invitationCodesRoutes from "./admin/invitationCodes";
import referralsRoutes from "./admin/referrals";
import registrationsRoutes from "./admin/registrations";
import smsVerificationLogsRoutes from "./admin/smsVerificationLogs";
import ticketsRoutes from "./admin/tickets";
import usersRoutes from "./admin/users";

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
