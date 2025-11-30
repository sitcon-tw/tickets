/**
 * @fileoverview Admin analytics trends routes with efficient response functions
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import prisma from "#config/database";
import { serverErrorResponse, successResponse } from "#utils/response";

interface RegistrationTrendsQuerystring {
	period?: "daily" | "weekly" | "monthly";
	eventId?: string;
}

/**
 * Admin analytics trends routes
 */
const trendsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	// Registration trends analysis
	fastify.get<{
		Querystring: RegistrationTrendsQuerystring;
	}>(
		"/registration-trends",
		{
			schema: {
				description: "報名趨勢分析",
				tags: ["admin/analytics"],
				querystring: {
					type: "object",
					properties: {
						period: {
							type: "string",
							enum: ["daily", "weekly", "monthly"],
							default: "daily",
							description: "統計週期"
						},
						eventId: {
							type: "string",
							description: "活動 ID 篩選"
						}
					}
				}
			}
		},
		async (request: FastifyRequest<{ Querystring: RegistrationTrendsQuerystring }>, reply: FastifyReply) => {
			try {
				const { period = "daily", eventId } = request.query;

				const whereClause = eventId ? { eventId } : {};
				const daysBack = period === "daily" ? 30 : period === "weekly" ? 84 : 365;

				// Note: groupByClause would be used in raw SQL queries for better performance
				// Currently using Prisma's findMany with manual grouping for compatibility

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

				const trendsMap: Record<string, { total: number; confirmed: number; pending: number; cancelled: number }> = {};
				registrations.forEach(reg => {
					let key: string;
					switch (period) {
						case "daily":
							key = reg.createdAt.toISOString().split("T")[0];
							break;
						case "weekly":
							const weekStart = new Date(reg.createdAt);
							weekStart.setDate(weekStart.getDate() - weekStart.getDay());
							key = weekStart.toISOString().split("T")[0];
							break;
						case "monthly":
							key = reg.createdAt.toISOString().substring(0, 7);
							break;
						default:
							key = reg.createdAt.toISOString().split("T")[0];
					}

					if (!trendsMap[key]) {
						trendsMap[key] = { total: 0, confirmed: 0, pending: 0, cancelled: 0 };
					}
					trendsMap[key].total++;
					if (reg.status in trendsMap[key]) {
						(trendsMap[key] as any)[reg.status]++;
					}
				});

				const trends = Object.entries(trendsMap)
					.map(([date, counts]) => ({ date, ...counts }))
					.sort((a, b) => a.date.localeCompare(b.date));

				const totalRegistrations = registrations.length;
				const totalDays = Object.keys(trendsMap).length;
				const averagePerDay = totalDays > 0 ? totalRegistrations / totalDays : 0;
				const peakDay = trends.reduce<{ date: string; total: number; confirmed: number; pending: number; cancelled: number } | null>(
					(max, day) => (day.total > (max?.total || 0) ? day : max),
					null
				);

				return reply.send(
					successResponse({
						trends,
						period,
						eventId,
						summary: {
							peakDay,
							averagePerDay: Math.round(averagePerDay * 100) / 100,
							totalDays,
							totalRegistrations
						}
					})
				);
			} catch (error) {
				console.error("Get registration trends error:", error);
				const { response, statusCode } = serverErrorResponse("取得報名趨勢失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default trendsRoutes;
