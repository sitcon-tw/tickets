import { errorResponse, successResponse } from "../../../utils/response.js";

export default async function referralsRoutes(fastify, options) {
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
}