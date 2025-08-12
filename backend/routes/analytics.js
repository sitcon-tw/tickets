import { requireViewer } from "../middleware/auth.js";
import { errorResponse, successResponse } from "../utils/response.js";

export default async function analyticsRoutes(fastify, options) {
	// Add auth middleware to all analytics routes
	fastify.addHook("preHandler", requireViewer);

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

	// 來源統計分析
	fastify.get(
		"/referral-sources",
		{
			schema: {
				description: "來源統計分析",
				tags: ["analytics"]
			}
		},
		async (request, reply) => {
			try {
				const { startDate, endDate } = request.query;

				// TODO: Implement referral source analytics
				return successResponse({
					sources: [],
					totalClicks: 0,
					conversionRate: 0
				});
			} catch (error) {
				console.error("Get referral sources error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得來源統計失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 報名趨勢分析
	fastify.get(
		"/registration-trends",
		{
			schema: {
				description: "報名趨勢分析",
				tags: ["analytics"]
			}
		},
		async (request, reply) => {
			try {
				const { period = "daily", eventId } = request.query;

				// TODO: Implement registration trends analytics
				return successResponse({
					trends: [],
					period,
					summary: {
						peakDay: null,
						averagePerDay: 0,
						totalDays: 0
					}
				});
			} catch (error) {
				console.error("Get registration trends error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得報名趨勢失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}
