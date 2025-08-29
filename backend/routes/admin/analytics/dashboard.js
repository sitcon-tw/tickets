import { errorResponse, successResponse } from "#utils/response.js";

export default async function dashboardRoutes(fastify, options) {
	// 管理後台儀表板數據
	fastify.get(
		"/dashboard",
		{
			schema: {
				description: "管理後台儀表板數據",
				tags: ["analytics"]
			}
		},
		async (request, reply) => {
			try {
				// TODO: Implement dashboard analytics
				return successResponse({
					totalRegistrations: 0,
					totalRevenue: 0,
					checkedInCount: 0,
					recentRegistrations: [],
					ticketSales: [],
					registrationTrends: []
				});
			} catch (error) {
				console.error("Get dashboard analytics error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得儀表板數據失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}