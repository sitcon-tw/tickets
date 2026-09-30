import type { FastifyPluginAsync } from "fastify";
import authRoutes from "./public/auth";
import calendarRoutes from "./public/calendar";
import eventsRoutes from "./public/events";
import invitationCodesRoutes from "./public/invitationCodes";
import referralRoutes from "./public/referrals";
import registrationsRoutes from "./public/registrations";
import settingsRoutes from "./public/settings";
import smsVerificationRoutes from "./public/smsVerification";
import sponsorsRoutes from "./public/sponsors";
import ticketsRoutes from "./public/tickets";

const publicRoutes: FastifyPluginAsync = async fastify => {
	await fastify.register(authRoutes);
	await fastify.register(eventsRoutes);
	await fastify.register(ticketsRoutes);
	await fastify.register(registrationsRoutes);
	await fastify.register(referralRoutes);
	await fastify.register(invitationCodesRoutes);
	await fastify.register(smsVerificationRoutes);
	await fastify.register(calendarRoutes);
	await fastify.register(settingsRoutes);
	await fastify.register(sponsorsRoutes);
};

export default publicRoutes;
