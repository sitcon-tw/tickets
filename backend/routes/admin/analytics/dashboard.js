/**
 * @typedef {import('#../types/api.js').AnalyticsData} AnalyticsData
 */

//TODO: This dashboard is not finished.

import prisma from "#config/database.js";
import { serverErrorResponse, successResponse } from "#utils/response.js";

export default async function dashboardRoutes(fastify, options) {
	// 管理後台儀表板數據
	fastify.get(
		"/dashboard",
		{
			schema: {
				description: "管理後台儀表板數據",
				tags: ["admin/analytics"],
				response: {
					200: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							message: { type: "string" },
							data: {
								type: "object",
								properties: {
									totalRegistrations: { type: "integer" },
									confirmedRegistrations: { type: "integer" },
									pendingRegistrations: { type: "integer" },
									cancelledRegistrations: { type: "integer" },
									checkedInCount: { type: "integer" },
									totalRevenue: { type: "number" },
									registrationsByDate: { type: "object" },
									ticketSales: { type: "object" },
									referralStats: { type: "object" }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const [totalStats, revenueData] = await Promise.all([
					prisma.registration.groupBy({
						by: ["status"],
						_count: { id: true }
					}),
					prisma.registration.findMany({
						where: { status: "confirmed" },
						include: {
							ticket: {
								select: { price: true }
							}
						}
					})
				]);

				const checkedInCount = 0;

				const registrationCounts = totalStats.reduce(
					(acc, stat) => {
						acc[stat.status] = stat._count.id;
						return acc;
					},
					{ confirmed: 0, pending: 0, cancelled: 0 }
				);

				const totalRegistrations = Object.values(registrationCounts).reduce((sum, count) => sum + count, 0);
				const totalRevenue = revenueData.reduce((sum, reg) => sum + reg.ticket.price, 0);

				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

				const registrationsLast30Days = await prisma.registration.findMany({
					where: {
						createdAt: {
							gte: thirtyDaysAgo
						}
					},
					select: {
						createdAt: true,
						status: true
					}
				});

				// Group by date
				const dailyRegistrations = registrationsLast30Days.reduce((acc, reg) => {
					const date = reg.createdAt.toISOString().split("T")[0];
					if (!acc[date]) {
						acc[date] = { date, count: 0, confirmed: 0 };
					}
					acc[date].count++;
					if (reg.status === "confirmed") {
						acc[date].confirmed++;
					}
					return acc;
				}, {});

				const dailyRegistrationsArray = Object.values(dailyRegistrations).sort((a, b) => new Date(b.date) - new Date(a.date));

				// Get ticket sales summary
				const ticketSales = await prisma.ticket.findMany({
					select: {
						id: true,
						name: true,
						price: true,
						quantity: true,
						soldCount: true,
						event: {
							select: { name: true }
						}
					}
				});

				/** @type {AnalyticsData} */
				const analytics = {
					totalRegistrations,
					confirmedRegistrations: registrationCounts.confirmed,
					pendingRegistrations: registrationCounts.pending,
					cancelledRegistrations: registrationCounts.cancelled,
					checkedInCount,
					registrationsByDate: dailyRegistrationsArray.reduce((acc, day) => {
						acc[day.date] = { total: day.count, confirmed: day.confirmed };
						return acc;
					}, {}),
					ticketSales: ticketSales.reduce((acc, ticket) => {
						acc[ticket.id] = {
							name: ticket.name,
							event: ticket.event.name,
							price: ticket.price,
							quantity: ticket.quantity,
							soldCount: ticket.soldCount,
							revenue: ticket.soldCount * ticket.price
						};
						return acc;
					}, {}),
					referralStats: await getReferralStats()
				};

				return successResponse(analytics, "取得儀表板數據成功");
			} catch (error) {
				console.error("Get dashboard analytics error:", error);
				const { response, statusCode } = serverErrorResponse("取得儀表板數據失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	async function getReferralStats() {
		try {
			const totalReferrals = await prisma.referralUsage.count();
			const activeReferrers = await prisma.referral.count({
				where: { isActive: true }
			});
			const topReferrers = await prisma.referral.findMany({
				where: { isActive: true },
				include: {
					registration: {
						select: { email: true, formData: true }
					},
					_count: {
						select: { referredUsers: true }
					}
				},
				orderBy: {
					referredUsers: {
						_count: "desc"
					}
				},
				take: 5
			});

			return {
				totalReferrals,
				activeReferrers,
				conversionRate: activeReferrers > 0 ? totalReferrals / activeReferrers : 0,
				topReferrers: topReferrers.map(r => ({
					code: r.code,
					email: r.registration.email,
					name: JSON.parse(r.registration.formData || "{}").name || "Unknown",
					referralCount: r._count.referredUsers
				}))
			};
		} catch (error) {
			console.error("Error getting referral stats:", error);
			return {
				totalReferrals: 0,
				activeReferrers: 0,
				conversionRate: 0,
				topReferrers: []
			};
		}
	}
}
