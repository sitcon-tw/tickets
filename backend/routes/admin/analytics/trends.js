/**
 * @fileoverview Admin analytics trends routes with efficient response functions
 */

import { 
	successResponse, 
	serverErrorResponse 
} from "#utils/response.js";
import prisma from "#config/database.js";

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

				const whereClause = eventId ? { eventId } : {};
				const daysBack = period === 'daily' ? 30 : period === 'weekly' ? 84 : 365;
				
				let groupByClause;
				switch (period) {
					case 'daily':
						groupByClause = "DATE(createdAt)";
						break;
					case 'weekly':
						groupByClause = "strftime('%Y-%W', createdAt)";
						break;
					case 'monthly':
						groupByClause = "strftime('%Y-%m', createdAt)";
						break;
					default:
						groupByClause = "DATE(createdAt)";
				}

				const registrations = await prisma.registration.findMany({
					where: {
						...whereClause,
						createdAt: {
							gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
						}
					},
					select: {
						createdAt: true,
						status: true
					}
				});

				const trendsMap = {};
				registrations.forEach(reg => {
					let key;
					switch (period) {
						case 'daily':
							key = reg.createdAt.toISOString().split('T')[0];
							break;
						case 'weekly':
							const weekStart = new Date(reg.createdAt);
							weekStart.setDate(weekStart.getDate() - weekStart.getDay());
							key = weekStart.toISOString().split('T')[0];
							break;
						case 'monthly':
							key = reg.createdAt.toISOString().substring(0, 7);
							break;
					}

					if (!trendsMap[key]) {
						trendsMap[key] = { total: 0, confirmed: 0, pending: 0, cancelled: 0 };
					}
					trendsMap[key].total++;
					trendsMap[key][reg.status]++;
				});

				const trends = Object.entries(trendsMap)
					.map(([date, counts]) => ({ date, ...counts }))
					.sort((a, b) => a.date.localeCompare(b.date));

				const totalRegistrations = registrations.length;
				const totalDays = Object.keys(trendsMap).length;
				const averagePerDay = totalDays > 0 ? totalRegistrations / totalDays : 0;
				const peakDay = trends.reduce((max, day) => 
					day.total > (max?.total || 0) ? day : max, null
				);

				return reply.send(successResponse({
					trends,
					period,
					eventId,
					summary: {
						peakDay,
						averagePerDay: Math.round(averagePerDay * 100) / 100,
						totalDays,
						totalRegistrations
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