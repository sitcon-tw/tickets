/**
 * @fileoverview Admin analytics trends routes with efficient response functions
 */

import { 
	successResponse, 
	serverErrorResponse 
} from "#utils/response.js";

/**
 * Admin analytics trends routes
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {Object} options 
 */
export default async function trendsRoutes(fastify, options) {
	// Registration trends analysis
	fastify.get(
		"/registration-trends",
		{
			schema: {
				description: "報名趨勢分析",
				tags: ["admin/analytics"],
				querystring: {
					type: 'object',
					properties: {
						period: {
							type: 'string',
							enum: ['daily', 'weekly', 'monthly'],
							default: 'daily',
							description: '統計週期'
						},
						eventId: {
							type: 'string',
							description: '活動 ID 篩選'
						}
					}
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Querystring: {period?: string, eventId?: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { period = "daily", eventId } = request.query;

				// TODO: Implement registration trends analytics
				return reply.send(successResponse({
					trends: [],
					period,
					eventId,
					summary: {
						peakDay: null,
						averagePerDay: 0,
						totalDays: 0,
						totalRegistrations: 0
					}
				}));
			} catch (error) {
				console.error("Get registration trends error:", error);
				const { response, statusCode } = serverErrorResponse("取得報名趨勢失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}