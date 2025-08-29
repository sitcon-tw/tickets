import { requireCheckIn } from "../middleware/auth.js";

// Check-in route imports organized alphabetically
import checkinActionsRoutes from "./checkin/checkin.js";
import qrRoutes from "./checkin/qr.js";
import searchRoutes from "./checkin/search.js";
import statsRoutes from "./checkin/stats.js";

export default async function checkinRoutes(fastify, options) {
	// Add checkin auth middleware to all routes
	fastify.addHook("preHandler", requireCheckIn);

	// Search and lookup functionality
	await fastify.register(searchRoutes);
	
	// Core check-in operations
	await fastify.register(checkinActionsRoutes);
	
	// QR code generation and scanning
	await fastify.register(qrRoutes);
	
	// Statistics and reporting
	await fastify.register(statsRoutes);
}
