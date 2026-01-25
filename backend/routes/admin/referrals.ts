import { SpanStatusCode } from "@opentelemetry/api";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { requireAdmin } from "#middleware/auth";
import { adminReferralSchemas } from "#schemas";
import { logger } from "#utils/logger";
import { notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";

const componentLogger = logger.child({ component: "admin/referrals" });

const adminReferralsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	fastify.addHook("preHandler", requireAdmin);

	// 推薦機制總覽統計
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/referrals/overview",
		{
			schema: adminReferralSchemas.getReferralOverview
		},
		async (_request, reply) => {
			const span = tracer.startSpan("route.admin.referrals.overview");

			try {
				span.addEvent("referrals.fetching_stats");

				const totalReferrals = await prisma.referralUsage.count();
				const uniqueReferrers = await prisma.referral.count({
					where: { isActive: true }
				});
				const totalRegistrations = await prisma.registration.count();
				const conversionRate = totalRegistrations > 0 ? (totalReferrals / totalRegistrations) * 100 : 0;

				span.setAttribute("referrals.total_count", totalReferrals);
				span.setAttribute("referrals.conversion_rate", Math.round(conversionRate * 100) / 100);

				span.addEvent("referrals.fetching_top_referrers");

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

				span.setAttribute("referrals.top_referrers_count", topReferrers.length);
				span.setStatus({ code: SpanStatusCode.OK });

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
				componentLogger.error({ error }, "Get referral overview error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get referral overview"
				});
				const { response, statusCode } = serverErrorResponse("取得推薦統計失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// 推薦排行榜
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/referrals/leaderboard",
		{
			schema: adminReferralSchemas.getReferralLeaderboard
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.referrals.leaderboard", {
				attributes: {
					"referrals.leaderboard.limit": request.query.limit || 10
				}
			});

			try {
				const { limit = 10 } = request.query;

				span.addEvent("referrals.fetching_leaderboard");

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
					take: typeof limit === "number" ? limit : parseInt(String(limit), 10)
				});

				span.setAttribute("referrals.leaderboard.count", leaderboard.length);
				span.addEvent("referrals.leaderboard_fetched");

				const formattedLeaderboard = leaderboard.map((r, index) => ({
					rank: index + 1,
					id: r.id,
					code: r.code,
					email: r.registration.email,
					name: JSON.parse(r.registration.formData || "{}").name || "Unknown",
					referralCount: r._count.referredUsers,
					createdAt: r.createdAt
				}));

				span.setStatus({ code: SpanStatusCode.OK });
				return successResponse(formattedLeaderboard);
			} catch (error) {
				componentLogger.error({ error }, "Get referral leaderboard error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get referral leaderboard"
				});
				const { response, statusCode } = serverErrorResponse("取得推薦排行榜失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// 獲取推薦擴譜圖數據
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/referrals/tree/:regId",
		{
			schema: adminReferralSchemas.getReferralTree
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.referrals.tree", {
				attributes: {
					"referrals.tree.registration_id": request.params.regId
				}
			});

			try {
				const { regId } = request.params;

				span.addEvent("referrals.fetching_tree");

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
					span.addEvent("referrals.registration_not_found");
					const { response, statusCode } = notFoundResponse("找不到指定的報名記錄");
					return reply.code(statusCode).send(response);
				}

				if (registration.referral?.id) span.setAttribute("referral.id", registration.referral.id);
				span.addEvent("referrals.building_tree");

				const buildTree = (reg: any): any => ({
					id: reg.id,
					email: reg.email,
					name: JSON.parse(reg.formData || "{}").name || "Unknown",
					referralCode: reg.referral?.code,
					createdAt: reg.createdAt,
					children: reg.referrals?.map(buildTree) || []
				});

				const tree = buildTree(registration);

				span.addEvent("referrals.tree_built");
				span.setStatus({ code: SpanStatusCode.OK });

				return successResponse(tree);
			} catch (error) {
				componentLogger.error({ error }, "Get referral tree error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get referral tree"
				});
				const { response, statusCode } = serverErrorResponse("取得推薦擴譜圖失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// 獲取達標推薦者名單
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/referrals/qualified",
		{
			schema: adminReferralSchemas.getQualifiedReferrers
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.referrals.qualified", {
				attributes: {
					"referrals.qualified.min_referrals": request.query.minReferrals || 1
				}
			});

			try {
				const { minReferrals = 1 } = request.query;

				span.addEvent("referrals.fetching_qualified");

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

				const minReferralsNum = typeof minReferrals === "number" ? minReferrals : parseInt(String(minReferrals), 10);
				const filtered = qualifiedReferrers.filter(r => r._count.referredUsers >= minReferralsNum);

				span.setAttribute("referrals.qualified.total_count", qualifiedReferrers.length);
				span.setAttribute("referrals.qualified.filtered_count", filtered.length);
				span.addEvent("referrals.qualified_filtered");

				const formattedList = filtered.map(r => ({
					id: r.id,
					code: r.code,
					email: r.registration.email,
					name: JSON.parse(r.registration.formData || "{}").name || "Unknown",
					referralCount: r._count.referredUsers,
					createdAt: r.createdAt
				}));

				span.setStatus({ code: SpanStatusCode.OK });
				return successResponse(formattedList);
			} catch (error) {
				componentLogger.error({ error }, "Get qualified referrers error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get qualified referrers"
				});
				const { response, statusCode } = serverErrorResponse("取得達標推薦者名單失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// 從達標者中隨機抽選
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/referrals/draw",
		{
			schema: adminReferralSchemas.drawReferrers
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.referrals.draw", {
				attributes: {
					"referrals.draw.min_referrals": request.body.minReferrals || 0,
					"referrals.draw.count": request.body.drawCount || 0
				}
			});

			try {
				const { minReferrals, drawCount, seed } = request.body;

				if (!minReferrals || !drawCount) {
					const { response, statusCode } = validationErrorResponse("最小推薦人數和抽選人數為必填");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("referrals.fetching_candidates");

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

				const minReferralsNum = typeof minReferrals === "number" ? minReferrals : parseInt(String(minReferrals), 10);
				const drawCountNum = typeof drawCount === "number" ? drawCount : parseInt(String(drawCount), 10);

				const eligible = qualifiedReferrers.filter(r => r._count.referredUsers >= minReferralsNum);

				span.setAttribute("referrals.draw.eligible_count", eligible.length);

				if (eligible.length === 0) {
					span.addEvent("referrals.no_eligible_candidates");
					const { response, statusCode } = validationErrorResponse("沒有符合條件的推薦者");
					return reply.code(statusCode).send(response);
				}

				const actualDrawCount = Math.min(drawCountNum, eligible.length);
				const usedSeed = seed || Date.now().toString();

				span.setAttribute("referrals.draw.actual_count", actualDrawCount);
				span.addEvent("referrals.performing_draw");

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

				span.addEvent("referrals.draw_completed");
				span.setStatus({ code: SpanStatusCode.OK });

				return successResponse({
					drawResults,
					drawCount: actualDrawCount,
					eligibleCount: eligible.length,
					seed: usedSeed
				});
			} catch (error) {
				componentLogger.error({ error }, "Draw referrers error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to draw referrers"
				});
				const { response, statusCode } = serverErrorResponse("抽選推薦者失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// 推薦統計報表
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/referrals/stats",
		{
			schema: adminReferralSchemas.getReferralStats
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.referrals.stats");

			try {
				const { startDate, endDate } = request.query;

				const dateFilter: any = {};
				if (startDate) dateFilter.gte = new Date(startDate);
				if (endDate) dateFilter.lte = new Date(endDate);

				span.addEvent("referrals.fetching_usage_data");

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

				span.setAttribute("referrals.stats.usage_count", referralUsages.length);
				span.addEvent("referrals.calculating_daily_stats");

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

				span.addEvent("referrals.fetching_registration_count");

				const totalRegistrations = await prisma.registration.count({
					where: {
						createdAt: dateFilter
					}
				});

				const totalReferralUsages = referralUsages.length;
				const conversionRate = totalRegistrations > 0 ? (totalReferralUsages / totalRegistrations) * 100 : 0;

				span.setAttribute("referrals.stats.total_registrations", totalRegistrations);
				span.setAttribute("referrals.stats.conversion_rate", Math.round(conversionRate * 100) / 100);
				referralUsages.forEach(usage => {});

				const conversionFunnel = [
					{ stage: "總報名數", count: totalRegistrations },
					{ stage: "使用推薦碼", count: totalReferralUsages },
					{ stage: "轉換率", count: `${Math.round(conversionRate * 100) / 100}%` }
				];

				span.addEvent("referrals.calculating_top_sources");

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

				span.setAttribute("referrals.stats.top_sources_count", topSources.length);
				span.addEvent("referrals.stats_calculated");
				span.setStatus({ code: SpanStatusCode.OK });

				return successResponse({
					dailyStats: dailyStatsArray,
					conversionFunnel,
					topSources
				});
			} catch (error) {
				componentLogger.error({ error }, "Get referral stats error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get referral stats"
				});
				const { response, statusCode } = serverErrorResponse("取得推薦統計報表失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);
};

export default adminReferralsRoutes;
