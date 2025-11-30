import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "#middleware/auth";
import authRoutes from "./public/auth";
import eventsRoutes from "./public/events";
import invitationCodesRoutes from "./public/invitationCodes";
import referralRoutes from "./public/referrals";
import registrationsRoutes from "./public/registrations";
import smsVerificationRoutes from "./public/smsVerification";
import ticketsRoutes from "./public/tickets";

const publicRoutes: FastifyPluginAsync = async (fastify) => {
	await fastify.register(authRoutes);
	await fastify.register(eventsRoutes);
	await fastify.register(ticketsRoutes);
	await fastify.register(registrationsRoutes, { preHandler: requireAuth } as any);
	await fastify.register(referralRoutes);
	await fastify.register(invitationCodesRoutes);
	await fastify.register(smsVerificationRoutes, { preHandler: requireAuth } as any);
};

export default publicRoutes;
