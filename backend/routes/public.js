import { requireAuth } from "#middleware/auth.js";
import authRoutes from "./public/auth.js";
import eventsRoutes from "./public/events.js";
import invitationCodesRoutes from "./public/invitationCodes.js";
import referralRoutes from "./public/referrals.js";
import registrationsRoutes from "./public/registrations.js";
import smsVerificationRoutes from "./public/smsVerification.js";
import ticketsRoutes from "./public/tickets.js";

export default async function publicRoutes(fastify) {
	await fastify.register(authRoutes);
	await fastify.register(eventsRoutes);
	await fastify.register(ticketsRoutes);
	await fastify.register(registrationsRoutes, { preHandler: requireAuth });
	await fastify.register(referralRoutes);
	await fastify.register(invitationCodesRoutes);
	await fastify.register(smsVerificationRoutes, { preHandler: requireAuth });
}
