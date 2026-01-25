import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { requireAdmin } from "#middleware/auth";
import { smsVerificationLogsSchemas } from "#schemas";
import { serverErrorResponse, successResponse } from "#utils/response";
import { nowInUTC8 } from "#utils/timezone";
import { SpanStatusCode } from "@opentelemetry/api";

const adminSmsVerificationLogsRoutes: FastifyPluginAsync = async fastify => {
	fastify.addHook("preHandler", requireAdmin);

	/**
	 * GET /api/admin/sms-verification-logs
	 * Get SMS verification logs with filters
	 */
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/sms-verification-logs",
		{
			schema: smsVerificationLogsSchemas.getSmsVerificationLogs
		},
		async (request, reply) => {
			const { userId, phoneNumber, verified, page = 1, limit = 20 } = request.query;

			// Mask phone number for security (show only last 4 digits)
			const maskedPhone = phoneNumber && phoneNumber.length > 4 ? `****${phoneNumber.slice(-4)}` : phoneNumber || "";

			const span = tracer.startSpan("route.admin.sms_verification_logs.list", {
				attributes: {
					"sms_logs.page": page,
					"sms_logs.limit": limit,
					"sms_logs.filter.userId": userId || "",
					"sms_logs.filter.phoneNumber.masked": maskedPhone,
					"sms_logs.filter.verified": verified !== undefined ? verified : ""
				}
			});

			try {
				const where: any = {};
				if (userId) where.userId = userId;
				if (phoneNumber) where.phoneNumber = { contains: phoneNumber };
				if (typeof verified === "boolean") where.verified = verified;

				span.addEvent("database.query.count");
				const total = await prisma.smsVerification.count({ where });

				span.setAttribute("sms_logs.total", total);
				span.addEvent("database.query.findMany");

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

				span.setAttribute("sms_logs.found", logs.length);
				span.addEvent("sms_logs.sanitize");

				const sanitizedLogs = logs.map(log => ({
					...log,
					code: log.verified ? "******" : log.expiresAt < new Date() ? "EXPIRED" : "PENDING"
				}));

				span.setStatus({ code: SpanStatusCode.OK });

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
				request.log.error({ error }, "Get SMS verification logs error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get SMS verification logs"
				});

				const { response, statusCode } = serverErrorResponse("取得簡訊驗證記錄失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	/**
	 * GET /api/admin/sms-verification-stats
	 * Get SMS verification statistics
	 */
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/sms-verification-stats",
		{
			schema: smsVerificationLogsSchemas.getSmsVerificationStats
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.sms_verification_logs.stats", {
				attributes: {
					"sms_stats.type": "aggregate"
				}
			});

			try {
				span.addEvent("database.query.aggregate");

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

				span.setAttribute("sms_stats.total_sent", totalSent);
				span.setAttribute("sms_stats.total_verified", totalVerified);
				span.setAttribute("sms_stats.total_expired", totalExpired);

				const successRate = totalSent > 0 ? ((totalVerified / totalSent) * 100).toFixed(2) : 0;
				span.setAttribute("sms_stats.success_rate", parseFloat(successRate as string));

				const sevenDaysAgo = nowInUTC8();
				sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

				span.addEvent("database.query.recent_activity");
				const recentCount = await prisma.smsVerification.count({
					where: {
						createdAt: {
							gte: sevenDaysAgo
						}
					}
				});

				span.setAttribute("sms_stats.recent_count", recentCount);
				span.setStatus({ code: SpanStatusCode.OK });

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
				request.log.error({ error }, "Get SMS verification stats error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get SMS verification stats"
				});

				const { response, statusCode } = serverErrorResponse("取得簡訊驗證統計失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);
};

export default adminSmsVerificationLogsRoutes;
