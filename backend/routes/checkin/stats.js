import prisma from "../../config/database.js";
import { errorResponse, successResponse } from "../../utils/response.js";

export default async function statsRoutes(fastify, options) {
	// 簽到統計資訊
	fastify.get(
		"/stats",
		{
			schema: {
				description: "簽到統計資訊",
				tags: ["checkin"]
			}
		},
		async (request, reply) => {
			try {
				// Get check-in statistics
				const totalRegistrations = await prisma.registration.count({
					where: {
						status: 'confirmed'
					}
				});

				const checkedInCount = await prisma.registration.count({
					where: {
						status: 'confirmed',
						checkInStatus: 'checked_in'
					}
				});

				const checkedInPercentage = totalRegistrations > 0 ? Math.round((checkedInCount / totalRegistrations) * 100) : 0;

				return successResponse({
					totalRegistrations,
					checkedIn: checkedInCount,
					checkedInPercentage
				});
			} catch (error) {
				console.error("Get checkin stats error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取簽到統計失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}