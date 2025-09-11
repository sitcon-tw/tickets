/**
 * @fileoverview Check-in stats routes with modular types and schemas
 */

import prisma from "#config/database.js";
import { 
	successResponse, 
	serverErrorResponse
} from "#utils/response.js";

/**
 * Check-in stats routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {Object} options 
 */
export default async function statsRoutes(fastify, options) {
	// Quick stats for check-in dashboard
	fastify.get(
		"/stats",
		{
			schema: {
				description: "報到統計資訊",
				tags: ["checkin"],
				querystring: {
					type: 'object',
					properties: {
						eventId: {
							type: 'string',
							description: '活動 ID 篩選'
						}
					}
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							message: { type: 'string' },
							data: {
								type: 'object',
								properties: {
									totalRegistrations: { type: 'integer' },
									confirmedRegistrations: { type: 'integer' },
									checkedInCount: { type: 'integer' },
									pendingCheckinCount: { type: 'integer' },
									checkinRate: { type: 'number' },
									recentCheckins: { type: 'array' }
								}
							}
						}
					}
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Querystring: {eventId?: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { eventId } = request.query;

				// Build where clause for stats
				const where = eventId ? { eventId } : {};

				// Get registration statistics
				const [totalStats, checkedInCount, recentCheckins] = await Promise.all([
					// Total registrations by status
					prisma.registration.groupBy({
						by: ['status'],
						where,
						_count: { id: true }
					}),
					// Checked-in count
					prisma.registration.count({
						where: {
							...where,
							checkinAt: { not: null }
						}
					}),
					// Recent check-ins
					prisma.registration.findMany({
						where: {
							...where,
							checkinAt: { not: null }
						},
						include: {
							user: {
								select: {
									name: true,
									email: true
								}
							},
							event: {
								select: {
									name: true
								}
							}
						},
						orderBy: { checkinAt: 'desc' },
						take: 10
					})
				]);

				// Calculate totals
				const statusCounts = totalStats.reduce((acc, stat) => {
					acc[stat.status] = stat._count.id;
					return acc;
				}, { confirmed: 0, pending: 0, cancelled: 0 });

				const totalRegistrations = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
				const confirmedRegistrations = statusCounts.confirmed;
				const pendingCheckinCount = confirmedRegistrations - checkedInCount;
				const checkinRate = confirmedRegistrations > 0 ? checkedInCount / confirmedRegistrations : 0;

				const stats = {
					totalRegistrations,
					confirmedRegistrations,
					checkedInCount,
					pendingCheckinCount,
					checkinRate: Math.round(checkinRate * 100) / 100,
					recentCheckins
				};

				return reply.send(successResponse(stats));
			} catch (error) {
				console.error("Get check-in stats error:", error);
				const { response, statusCode } = serverErrorResponse("取得報到統計失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}