import { errorResponse, successResponse } from "#utils/response.js";
import prisma from "#config/database.js";

export default async function referralsRoutes(fastify, options) {
	// 來源統計分析
	fastify.get(
		"/referral-sources",
		{
			schema: {
				description: "來源統計分析",
				tags: ["admin/analytics"]
			}
		},
		async (request, reply) => {
			try {
				const { startDate, endDate } = request.query;

				const dateFilter = {};
				if (startDate) dateFilter.gte = new Date(startDate);
				if (endDate) dateFilter.lte = new Date(endDate);

				const referralUsages = await prisma.referralUsage.findMany({
					where: {
						usedAt: dateFilter
					},
					include: {
						referral: {
							include: {
								registration: {
									select: { formData: true, email: true }
								}
							}
						}
					}
				});

				const totalRegistrations = await prisma.registration.count({
					where: {
						createdAt: dateFilter
					}
				});

				const sourceCounts = {};
				referralUsages.forEach(usage => {
					const referrerData = JSON.parse(usage.referral.registration.formData || '{}');
					const source = `${referrerData.name || 'Unknown'} (${usage.referral.code})`;
					sourceCounts[source] = (sourceCounts[source] || 0) + 1;
				});

				const sources = Object.entries(sourceCounts)
					.map(([source, count]) => ({ source, count, percentage: (count / referralUsages.length) * 100 }))
					.sort((a, b) => b.count - a.count);

				const conversionRate = totalRegistrations > 0 ? (referralUsages.length / totalRegistrations) * 100 : 0;

				return successResponse({
					sources,
					totalClicks: referralUsages.length,
					conversionRate: Math.round(conversionRate * 100) / 100
				});
			} catch (error) {
				console.error("Get referral sources error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得來源統計失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}