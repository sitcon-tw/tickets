/**
 * @typedef {import('../../../types/api.js').AnalyticsData} AnalyticsData
 */

import { successResponse, serverErrorResponse } from "#utils/response.js";
import prisma from "#config/database.js";

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
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							message: { type: 'string' },
							data: {
								type: 'object',
								properties: {
									totalRegistrations: { type: 'integer' },
									confirmedRegistrations: { type: 'integer' },
									pendingRegistrations: { type: 'integer' },
									cancelledRegistrations: { type: 'integer' },
									checkedInCount: { type: 'integer' },
									totalRevenue: { type: 'number' },
									registrationsByDate: { type: 'object' },
									ticketSales: { type: 'object' },
									referralStats: { type: 'object' }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				// Get registration statistics
				const [totalStats, checkedInCount, revenueData, recentRegistrations] = await Promise.all([
					// Total registrations by status
					prisma.registration.groupBy({
						by: ['status'],
						_count: { id: true }
					}),
					// Checked-in count
					prisma.registration.count({
						where: { checkinAt: { not: null } }
					}),
					// Revenue calculation
					prisma.registration.findMany({
						where: { status: 'confirmed' },
						include: {
							ticket: {
								select: { price: true }
							}
						}
					}),
					// Recent registrations
					prisma.registration.findMany({
						include: {
							user: {
								select: { name: true, email: true }
							},
							event: {
								select: { name: true }
							},
							ticket: {
								select: { name: true, price: true }
							}
						},
						orderBy: { createdAt: 'desc' },
						take: 10
					})
				]);

				// Calculate totals
				const registrationCounts = totalStats.reduce((acc, stat) => {
					acc[stat.status] = stat._count.id;
					return acc;
				}, { confirmed: 0, pending: 0, cancelled: 0 });

				const totalRegistrations = Object.values(registrationCounts).reduce((sum, count) => sum + count, 0);
				const totalRevenue = revenueData.reduce((sum, reg) => sum + reg.ticket.price, 0);

				// Get daily registrations for the last 30 days
				const dailyRegistrations = await prisma.$queryRaw`
					SELECT 
						DATE(createdAt) as date,
						COUNT(*) as count,
						SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed
					FROM Registration 
					WHERE createdAt >= DATE('now', '-30 days')
					GROUP BY DATE(createdAt)
					ORDER BY date DESC
				`;

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
					registrationsByDate: dailyRegistrations.reduce((acc, day) => {
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
					referralStats: {} // TODO: Implement referral stats
				};

				return successResponse(analytics, "取得儀表板數據成功");
			} catch (error) {
				console.error("Get dashboard analytics error:", error);
				const { response, statusCode } = serverErrorResponse("取得儀表板數據失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}