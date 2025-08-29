// Public route imports organized alphabetically
import eventsRoutes from "./public/events.js";
import fileUploadRoutes from "./public/fileUpload.js";
import invitationCodesRoutes from "./public/invitationCodes.js";
import referralRoutes from "./public/referrals.js";
import registrationsRoutes from "./public/registrations.js";

export default async function publicRoutes(fastify, options) {
	// Core public information routes
	await fastify.register(eventsRoutes);
	
	// Registration and participation routes  
	await fastify.register(registrationsRoutes);
	await fastify.register(referralRoutes);
	await fastify.register(invitationCodesRoutes);
	
	// File handling routes
	await fastify.register(fileUploadRoutes);
}
