import eventsRoutes from "./public/events.js";
import fileUploadRoutes from "./public/fileUpload.js";
import invitationCodesRoutes from "./public/invitationCodes.js";
import registrationsRoutes from "./public/registrations.js";

export default async function publicRoutes(fastify, options) {
	// Register modular route handlers
	await fastify.register(eventsRoutes);
	await fastify.register(registrationsRoutes);
	await fastify.register(invitationCodesRoutes);
	await fastify.register(fileUploadRoutes);
}
