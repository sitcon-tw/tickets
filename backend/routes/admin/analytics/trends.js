import { errorResponse, successResponse } from "#utils/response.js";

export default async function trendsRoutes(fastify, options) {
	// 報名趨勢分析
	fastify.get(
		"/registration-trends",
		{
			schema: {
				description: "報名趨勢分析",
				tags: ["admin/analytics"]
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