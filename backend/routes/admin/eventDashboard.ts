import prisma from "#config/database";
import { requireEventDashboardAccess } from "#middleware/auth";
import { eventDashboardSchemas } from "#schemas";
import { logger } from "#utils/logger";
import { notFoundResponse, serverErrorResponse, successResponse } from "#utils/response";
import { formatDateOnly, nowInUTC8 } from "#utils/timezone";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

const componentLogger = logger.child({ component: "admin/eventDashboard" });

const eventDashboardRoutes: FastifyPluginAsync = async (fastify, _options) => {
	fastify.addHook("preHandler", requireEventDashboardAccess);

	// Get per-event dashboard data
	fastify.get(
		"/events/:eventId/dashboard",
		{
			schema: eventDashboardSchemas.getEventDashboard
		},
		async (request: FastifyRequest<{ Params: { eventId: string } }>, reply: FastifyReply) => {
			try {
				const { eventId } = request.params;

				// Get event info
				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				// Get registration statistics
				const registrationStats = await prisma.registration.groupBy({
					by: ["status"],
					where: { eventId },
					_count: { id: true }
				});

				const registrationCounts = registrationStats.reduce(
					(acc, stat) => {
						acc[stat.status] = stat._count.id;
						return acc;
					},
					{ confirmed: 0, pending: 0, cancelled: 0 } as Record<string, number>
				);

				const totalRegistrations = Object.values(registrationCounts).reduce((sum, count) => sum + count, 0);

				// Get ticket data with sales info
				const tickets = await prisma.ticket.findMany({
					where: { eventId },
					orderBy: { order: "asc" }
				});

				const ticketsWithStats = tickets.map(ticket => {
					const revenue = ticket.soldCount * ticket.price;
					const available = ticket.quantity - ticket.soldCount;
					const salesRate = ticket.quantity > 0 ? (ticket.soldCount / ticket.quantity) * 100 : 0;

					return {
						...ticket,
						revenue,
						available,
						salesRate: Number(salesRate.toFixed(2))
					};
				});

				// Calculate total revenue
				const totalRevenue = ticketsWithStats.reduce((sum, ticket) => sum + ticket.revenue, 0);

				// Get registration trends (last 30 days)
				const thirtyDaysAgo = nowInUTC8();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

				const registrationsLast30Days = await prisma.registration.findMany({
					where: {
						eventId,
						createdAt: {
							gte: thirtyDaysAgo
						}
					},
					select: {
						createdAt: true,
						status: true
					}
				});

				// Group by date in UTC+8
				const dailyRegistrations = registrationsLast30Days.reduce(
					(acc, reg) => {
						const date = formatDateOnly(reg.createdAt);
						if (!acc[date]) {
							acc[date] = { date, count: 0, confirmed: 0 };
						}
						acc[date].count++;
						if (reg.status === "confirmed") {
							acc[date].confirmed++;
						}
						return acc;
					},
					{} as Record<string, { date: string; count: number; confirmed: number }>
				);

				const registrationTrends = Object.values(dailyRegistrations).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

				// Get referral statistics for this event
				const [totalReferrals, activeReferrers] = await Promise.all([
					prisma.referralUsage.count({
						where: { eventId }
					}),
					prisma.referral.count({
						where: {
							eventId,
							isActive: true
						}
					})
				]);

				const conversionRate = activeReferrers > 0 ? Number((totalReferrals / activeReferrers).toFixed(2)) : 0;

				const dashboardData = {
					event: {
						id: event.id,
						name: event.name,
						startDate: event.startDate,
						endDate: event.endDate,
						locationText: event.locationText,
						mapLink: event.mapLink
					},
					stats: {
						totalRegistrations,
						confirmedRegistrations: registrationCounts.confirmed,
						pendingRegistrations: registrationCounts.pending,
						cancelledRegistrations: registrationCounts.cancelled,
						totalRevenue
					},
					tickets: ticketsWithStats,
					registrationTrends,
					referralStats: {
						totalReferrals,
						activeReferrers,
						conversionRate
					}
				};

				return successResponse(dashboardData, "取得活動儀表板數據成功");
			} catch (error) {
				componentLogger.error({ error }, "Get event dashboard analytics error");
				const { response, statusCode } = serverErrorResponse("取得活動儀表板數據失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default eventDashboardRoutes;
