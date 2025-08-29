import { requireStaff } from "#middleware/auth.js";

import checkinActionsRoutes from "./checkin/checkin.js";
import qrRoutes from "./checkin/qr.js";
import searchRoutes from "./checkin/search.js";
import statsRoutes from "./checkin/stats.js";

export default async function checkinRoutes(fastify, options) {
	fastify.addHook("preHandler", requireStaff);

	await fastify.register(searchRoutes);
	await fastify.register(checkinActionsRoutes);
	await fastify.register(qrRoutes);
	await fastify.register(statsRoutes);
}
