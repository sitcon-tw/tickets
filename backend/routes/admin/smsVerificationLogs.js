/**
 * @fileoverview Admin routes for SMS verification logs
 */

import prisma from "#config/database.js";
import { requireAdmin } from "#middleware/auth.js";
import { serverErrorResponse, successResponse } from "#utils/response.js";

/**
 * Admin SMS verification logs routes
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function adminSmsVerificationLogsRoutes(fastify) {
	// Apply admin auth middleware
	fastify.addHook("preHandler", requireAdmin);

	/**
	 * GET /api/admin/sms-verification-logs
	 * Get SMS verification logs with filters
	 */
	fastify.get(
		"/sms-verification-logs",
		{
			schema: {
				description: "取得簡訊驗證記錄",
				tags: ["admin/sms-verification"],
				querystring: {
					type: "object",
					properties: {
						userId: { type: "string" },
						phoneNumber: { type: "string" },
						purpose: { type: "string", enum: ["ticket_access", "phone_verification"] },
						ticketId: { type: "string" },
						verified: { type: "boolean" },
						page: { type: "integer", minimum: 1, default: 1 },
						limit: { type: "integer", minimum: 1, maximum: 100, default: 20 }
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { userId, phoneNumber, purpose, ticketId, verified, page = 1, limit = 20 } = request.query;

				// Build where clause
				const where = {};
				if (userId) where.userId = userId;
				if (phoneNumber) where.phoneNumber = { contains: phoneNumber };
				if (purpose) where.purpose = purpose;
				if (ticketId) where.ticketId = ticketId;
				if (typeof verified === "boolean") where.verified = verified;

				// Get total count
				const total = await prisma.smsVerification.count({ where });

				// Get logs with pagination
				const logs = await prisma.smsVerification.findMany({
					where,
					include: {
						user: {
							select: {
								id: true,
								email: true,
								name: true
							}
						}
					},
					orderBy: {
						createdAt: "desc"
					},
					skip: (page - 1) * limit,
					take: limit
				});

				// Remove sensitive code from response
				const sanitizedLogs = logs.map(log => ({
					...log,
					code: log.verified ? "******" : log.expiresAt < new Date() ? "EXPIRED" : "PENDING"
				}));

				return reply.send(
					successResponse({
						logs: sanitizedLogs,
						pagination: {
							page,
							limit,
							total,
							totalPages: Math.ceil(total / limit)
						}
					})
				);
			} catch (error) {
				request.log.error("Get SMS verification logs error:", error);
				const { response, statusCode } = serverErrorResponse("取得簡訊驗證記錄失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	/**
	 * GET /api/admin/sms-verification-stats
	 * Get SMS verification statistics
	 */
	fastify.get(
		"/sms-verification-stats",
		{
			schema: {
				description: "取得簡訊驗證統計",
				tags: ["admin/sms-verification"]
			}
		},
		async (request, reply) => {
			try {
				const [totalSent, totalVerified, totalExpired, totalByPurpose] = await Promise.all([
					// Total SMS sent
					prisma.smsVerification.count(),
					// Total verified
					prisma.smsVerification.count({
						where: { verified: true }
					}),
					// Total expired (not verified and past expiry)
					prisma.smsVerification.count({
						where: {
							verified: false,
							expiresAt: {
								lt: new Date()
							}
						}
					}),
					// Count by purpose
					prisma.smsVerification.groupBy({
						by: ["purpose"],
						_count: {
							id: true
						}
					})
				]);

				// Get verification success rate
				const successRate = totalSent > 0 ? ((totalVerified / totalSent) * 100).toFixed(2) : 0;

				// Get recent activity (last 7 days)
				const sevenDaysAgo = new Date();
				sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

				const recentActivity = await prisma.smsVerification.groupBy({
					by: ["purpose"],
					where: {
						createdAt: {
							gte: sevenDaysAgo
						}
					},
					_count: {
						id: true
					}
				});

				return reply.send(
					successResponse({
						totalSent,
						totalVerified,
						totalExpired,
						successRate: parseFloat(successRate),
						byPurpose: totalByPurpose.reduce((acc, item) => {
							acc[item.purpose] = item._count.id;
							return acc;
						}, {}),
						recentActivity: recentActivity.reduce((acc, item) => {
							acc[item.purpose] = item._count.id;
							return acc;
						}, {})
					})
				);
			} catch (error) {
				request.log.error("Get SMS verification stats error:", error);
				const { response, statusCode } = serverErrorResponse("取得簡訊驗證統計失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}
