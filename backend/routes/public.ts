import type { FastifyPluginAsync } from "fastify";
import authRoutes from "./public/auth";
import calendarRoutes from "./public/calendar";
import eventsRoutes from "./public/events";
import invitationCodesRoutes from "./public/invitationCodes";
import opengraphRoutes from "./public/opengraph";
import referralRoutes from "./public/referrals";
import registrationsRoutes from "./public/registrations";
import smsVerificationRoutes from "./public/smsVerification";
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
	await fastify.register(opengraphRoutes);
};

export default publicRoutes;
