import eventsRoutes from "./public/events.js";
import invitationCodesRoutes from "./public/invitationCodes.js";
import referralRoutes from "./public/referrals.js";
import registrationsRoutes from "./public/registrations.js";

export default async function publicRoutes(fastify, options) {
	await fastify.register(eventsRoutes);
	await fastify.register(registrationsRoutes);
	await fastify.register(referralRoutes);
	await fastify.register(invitationCodesRoutes);
}
