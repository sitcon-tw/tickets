import { requireCheckIn } from "../middleware/auth.js";
import checkinActionsRoutes from "./checkin/checkin.js";
import qrRoutes from "./checkin/qr.js";
import searchRoutes from "./checkin/search.js";
import statsRoutes from "./checkin/stats.js";

export default async function checkinRoutes(fastify, options) {
	// Add checkin auth middleware
	fastify.addHook("preHandler", requireCheckIn);

	// Register modular checkin route handlers
	await fastify.register(searchRoutes);
	await fastify.register(checkinActionsRoutes);
	await fastify.register(statsRoutes);
	await fastify.register(qrRoutes);
}
