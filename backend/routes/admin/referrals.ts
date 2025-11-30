import type { FastifyPluginAsync } from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";

import prisma from "#config/database";
import { requireAdmin } from "#middleware/auth";
import { serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";

const adminReferralsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	fastify.addHook("preHandler", requireAdmin);

	// 推薦機制總覽統計
	fastify.get(
		"/referrals/overview",
		{
			schema: {
				description: "推薦機制總覽統計",
				tags: ["admin/referrals"]
			}
		},
		async (_request: FastifyRequest, reply: FastifyReply) => {
			try {
				const totalReferrals = await prisma.referralUsage.count();
				const uniqueReferrers = await prisma.referral.count({
					where: { isActive: true }
				});
				const totalRegistrations = await prisma.registration.count();
				const conversionRate = totalRegistrations > 0 ? (totalReferrals / totalRegistrations) * 100 : 0;

				const topReferrers = await prisma.referral.findMany({
					where: { isActive: true },
					include: {
						registration: {
							select: {
								email: true,
								formData: true
							}
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
					take: 10
				});

				return successResponse({
					totalReferrals,
					uniqueReferrers,
					conversionRate: Math.round(conversionRate * 100) / 100,
					topReferrers: topReferrers.map(r => ({
						id: r.id,
						code: r.code,
						email: r.registration.email,
						name: JSON.parse(r.registration.formData || "{}").name || "Unknown",
						referralCount: r._count.referredUsers
					}))
				});
			} catch (error) {
				console.error("Get referral overview error:", error);
				const { response, statusCode } = serverErrorResponse("取得推薦統計失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 推薦排行榜
	fastify.get<{
		Querystring: { limit?: number };
	}>(
		"/referrals/leaderboard",
		{
			schema: {
				description: "推薦排行榜",
				tags: ["admin/referrals"]
			}
		},
		async (request: FastifyRequest<{ Querystring: { limit?: number } }>, reply: FastifyReply) => {
			try {
				const { limit = 10 } = request.query;

				const leaderboard = await prisma.referral.findMany({
					where: { isActive: true },
					include: {
						registration: {
							select: {
								email: true,
								formData: true
							}
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
					take: parseInt(limit as any)
				});

				const formattedLeaderboard = leaderboard.map((r, index) => ({
					rank: index + 1,
					id: r.id,
					code: r.code,
					email: r.registration.email,
					name: JSON.parse(r.registration.formData || "{}").name || "Unknown",
					referralCount: r._count.referredUsers,
					createdAt: r.createdAt
				}));

				return successResponse(formattedLeaderboard);
			} catch (error) {
				console.error("Get referral leaderboard error:", error);
				const { response, statusCode } = serverErrorResponse("取得推薦排行榜失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 獲取推薦擴譜圖數據
	fastify.get<{
		Params: { regId: string };
	}>(
		"/referrals/tree/:regId",
		{
			schema: {
				description: "獲取推薦擴譜圖數據",
				tags: ["admin/referrals"]
			}
		},
		async (request: FastifyRequest<{ Params: { regId: string } }>, reply: FastifyReply) => {
			try {
				const { regId } = request.params;

				const registration = await prisma.registration.findUnique({
					where: { id: regId },
					include: {
						referral: true,
						referrals: {
							include: {
								referrals: {
									include: {
										referrals: true
									}
								}
							}
						}
					}
				});

				if (!registration) {
					const { response, statusCode } = validationErrorResponse("找不到指定的報名記錄");
					return reply.code(statusCode).send(response);
				}

				const buildTree = (reg: any): any => ({
					id: reg.id,
					email: reg.email,
					name: JSON.parse(reg.formData || "{}").name || "Unknown",
					referralCode: reg.referral?.code,
					createdAt: reg.createdAt,
					children: reg.referrals?.map(buildTree) || []
				});

				return successResponse(buildTree(registration));
			} catch (error) {
				console.error("Get referral tree error:", error);
				const { response, statusCode } = serverErrorResponse("取得推薦擴譜圖失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 獲取達標推薦者名單
	fastify.get<{
		Querystring: { minReferrals?: number };
	}>(
		"/referrals/qualified",
		{
			schema: {
				description: "獲取達標推薦者名單",
				tags: ["admin/referrals"]
			}
		},
		async (request: FastifyRequest<{ Querystring: { minReferrals?: number } }>, reply: FastifyReply) => {
			try {
				const { minReferrals = 1 } = request.query;

				const qualifiedReferrers = await prisma.referral.findMany({
					where: {
						isActive: true,
						referredUsers: {
							some: {}
						}
					},
					include: {
						registration: {
							select: {
								email: true,
								formData: true
							}
						},
						_count: {
							select: { referredUsers: true }
						}
					}
				});

				const filtered = qualifiedReferrers.filter(r => r._count.referredUsers >= parseInt(minReferrals as any));

				const formattedList = filtered.map(r => ({
					id: r.id,
					code: r.code,
					email: r.registration.email,
					name: JSON.parse(r.registration.formData || "{}").name || "Unknown",
					referralCount: r._count.referredUsers,
					createdAt: r.createdAt
				}));

				return successResponse(formattedList);
			} catch (error) {
				console.error("Get qualified referrers error:", error);
				const { response, statusCode } = serverErrorResponse("取得達標推薦者名單失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 從達標者中隨機抽選
	fastify.post<{
		Body: { minReferrals: number; drawCount: number; seed?: string };
	}>(
		"/referrals/draw",
		{
			schema: {
				description: "從達標者中隨機抽選",
				tags: ["admin/referrals"]
			}
		},
		async (request: FastifyRequest<{ Body: { minReferrals: number; drawCount: number; seed?: string } }>, reply: FastifyReply) => {
			try {
				const { minReferrals, drawCount, seed } = request.body;

				if (!minReferrals || !drawCount) {
					const { response, statusCode } = validationErrorResponse("最小推薦人數和抽選人數為必填");
					return reply.code(statusCode).send(response);
				}

				const qualifiedReferrers = await prisma.referral.findMany({
					where: {
						isActive: true,
						referredUsers: {
							some: {}
						}
					},
					include: {
						registration: {
							select: {
								email: true,
								formData: true
							}
						},
						_count: {
							select: { referredUsers: true }
						}
					}
				});

				const eligible = qualifiedReferrers.filter(r => r._count.referredUsers >= parseInt(minReferrals as any));

				if (eligible.length === 0) {
					const { response, statusCode } = validationErrorResponse("沒有符合條件的推薦者");
					return reply.code(statusCode).send(response);
				}

				const actualDrawCount = Math.min(parseInt(drawCount as any), eligible.length);
				const usedSeed = seed || Date.now().toString();

				const seededRandom = (seed: string) => {
					let x = Math.sin(parseInt(seed)) * 10000;
					return x - Math.floor(x);
				};

				const shuffled = [...eligible];
				for (let i = shuffled.length - 1; i > 0; i--) {
					const j = Math.floor(seededRandom(usedSeed + i) * (i + 1));
					[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
				}

				const drawResults = shuffled.slice(0, actualDrawCount).map((r, index) => ({
					rank: index + 1,
					id: r.id,
					code: r.code,
					email: r.registration.email,
					name: JSON.parse(r.registration.formData || "{}").name || "Unknown",
					referralCount: r._count.referredUsers
				}));

				return successResponse({
					drawResults,
					drawCount: actualDrawCount,
					eligibleCount: eligible.length,
					seed: usedSeed
				});
			} catch (error) {
				console.error("Draw referrers error:", error);
				const { response, statusCode } = serverErrorResponse("抽選推薦者失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 推薦統計報表
	fastify.get<{
		Querystring: { startDate?: string; endDate?: string };
	}>(
		"/referrals/stats",
		{
			schema: {
				description: "推薦統計報表",
				tags: ["admin/referrals"]
			}
		},
		async (request: FastifyRequest<{ Querystring: { startDate?: string; endDate?: string } }>, reply: FastifyReply) => {
			try {
				const { startDate, endDate } = request.query;

				const dateFilter: any = {};
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
									select: { formData: true }
								}
							}
						}
					}
				});

				const dailyStats: Record<string, number> = {};
				referralUsages.forEach(usage => {
					const date = usage.usedAt.toISOString().split("T")[0];
					dailyStats[date] = (dailyStats[date] || 0) + 1;
				});

				const dailyStatsArray = Object.entries(dailyStats)
					.map(([date, count]) => ({
						date,
						count
					}))
					.sort((a, b) => a.date.localeCompare(b.date));

				const totalRegistrations = await prisma.registration.count({
					where: {
						createdAt: dateFilter
					}
				});

				const totalReferralUsages = referralUsages.length;
				const conversionRate = totalRegistrations > 0 ? (totalReferralUsages / totalRegistrations) * 100 : 0;

				const conversionFunnel = [
					{ stage: "總報名數", count: totalRegistrations },
					{ stage: "使用推薦碼", count: totalReferralUsages },
					{ stage: "轉換率", count: `${Math.round(conversionRate * 100) / 100}%` }
				];

				const referralCounts: Record<string, number> = {};
				referralUsages.forEach(usage => {
					const code = usage.referral.code;
					const name = JSON.parse(usage.referral.registration.formData || "{}").name || "Unknown";
					const key = `${name} (${code})`;
					referralCounts[key] = (referralCounts[key] || 0) + 1;
				});

				const topSources = Object.entries(referralCounts)
					.map(([source, count]) => ({ source, count }))
					.sort((a, b) => b.count - a.count)
					.slice(0, 10);

				return successResponse({
					dailyStats: dailyStatsArray,
					conversionFunnel,
					topSources
				});
			} catch (error) {
				console.error("Get referral stats error:", error);
				const { response, statusCode } = serverErrorResponse("取得推薦統計報表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default adminReferralsRoutes;
