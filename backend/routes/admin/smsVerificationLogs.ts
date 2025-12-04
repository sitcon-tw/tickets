import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import prisma from "#config/database";
import { requireAdmin } from "#middleware/auth";
import { serverErrorResponse, successResponse } from "#utils/response";

interface SmsLogsQuery {
	userId?: string;
	phoneNumber?: string;
	verified?: boolean;
	page?: number;
	limit?: number;
}

const adminSmsVerificationLogsRoutes: FastifyPluginAsync = async fastify => {
	fastify.addHook("preHandler", requireAdmin);

	/**
	 * GET /api/admin/sms-verification-logs
	 * Get SMS verification logs with filters
	 */
	fastify.get<{ Querystring: SmsLogsQuery }>(
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
						verified: { type: "boolean" },
						page: { type: "integer", minimum: 1, default: 1 },
						limit: { type: "integer", minimum: 1, maximum: 100, default: 20 }
					}
				}
			}
		},
		async (request: FastifyRequest<{ Querystring: SmsLogsQuery }>, reply: FastifyReply) => {
			try {
				const { userId, phoneNumber, verified, page = 1, limit = 20 } = request.query;

				const where: any = {};
				if (userId) where.userId = userId;
				if (phoneNumber) where.phoneNumber = { contains: phoneNumber };
				if (typeof verified === "boolean") where.verified = verified;

				const total = await prisma.smsVerification.count({ where });

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
				request.log.error({ err: error }, "Get SMS verification logs error");
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
		async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				const [totalSent, totalVerified, totalExpired] = await Promise.all([
					prisma.smsVerification.count(),
					prisma.smsVerification.count({
						where: { verified: true }
					}),
					prisma.smsVerification.count({
						where: {
							verified: false,
							expiresAt: {
								lt: new Date()
							}
						}
					})
				]);

				const successRate = totalSent > 0 ? ((totalVerified / totalSent) * 100).toFixed(2) : 0;

				const sevenDaysAgo = new Date();
				sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

				const recentCount = await prisma.smsVerification.count({
					where: {
						createdAt: {
							gte: sevenDaysAgo
						}
					}
				});

				return reply.send(
					successResponse({
						totalSent,
						totalVerified,
						totalExpired,
						successRate: parseFloat(successRate as string),
						recentActivity: recentCount
					})
				);
			} catch (error) {
				request.log.error({ err: error }, "Get SMS verification stats error");
				const { response, statusCode } = serverErrorResponse("取得簡訊驗證統計失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default adminSmsVerificationLogsRoutes;
