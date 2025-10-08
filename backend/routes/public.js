import eventsRoutes from "./public/events.js";
import ticketsRoutes from "./public/tickets.js";
import invitationCodesRoutes from "./public/invitationCodes.js";
import referralRoutes from "./public/referrals.js";
import registrationsRoutes from "./public/registrations.js";
import promoteRoutes from "./public/promote.js";

export default async function publicRoutes(fastify) {
	await fastify.register(eventsRoutes);
	await fastify.register(ticketsRoutes);
	await fastify.register(registrationsRoutes);
	await fastify.register(referralRoutes);
	await fastify.register(invitationCodesRoutes);
	await fastify.register(promoteRoutes);
}
