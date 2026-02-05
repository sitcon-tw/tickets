import prisma from "#config/database";
import { auth } from "#lib/auth";
import { tracer } from "#lib/tracing";
import { publicReferralSchemas, referralSchemas } from "#schemas";
import { logger } from "#utils/logger";
import { errorResponse, forbiddenResponse, notFoundResponse, serverErrorResponse, successResponse, unauthorizedResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";
import { LocalizedTextSchema } from "@sitcontix/types";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const componentLogger = logger.child({ component: "public/referrals" });

const referralRoutes: FastifyPluginAsync = async fastify => {
	// 獲取專屬推薦連結
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/registrations/:regId/referral-link",
		{
			schema: publicReferralSchemas.getReferralLink
		},
		async (request, reply) => {
			const maskedRegId = request.params.regId.length > 6 ? `${request.params.regId.slice(0, 6)}...` : request.params.regId;

			const span = tracer.startSpan("route.referrals.get_referral_link", {
				attributes: {
					"registration.id.masked": maskedRegId
				}
			});

			try {
				const { regId } = request.params;

				span.addEvent("referral.fetch_registration");

				const registration = await prisma.registration.findUnique({
					where: { id: regId },
					include: { event: true }
				});

				if (!registration || registration.status !== "confirmed") {
					span.setStatus({
						code: SpanStatusCode.ERROR,
						message: "Registration not found or not confirmed"
					});
					const { response, statusCode } = notFoundResponse("找不到符合的報名記錄");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("registration.id", registration.id);
				span.setAttribute("registration.status", registration.status);
				span.setAttribute("event.id", registration.eventId);

				span.addEvent("referral.fetch_existing");

				let referral = await prisma.referral.findFirst({
					where: {
						registrationId: regId,
						isActive: true
					},
					include: {
						registration: {
							include: {
								event: true
							}
						}
					}
				});

				if (!referral) {
					span.addEvent("referral.generate_code");

					let referralCode: string;
					let isUnique = false;
					let attempts = 0;
					const maxAttempts = 20;

					while (!isUnique && attempts < maxAttempts) {
						const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
						referralCode = `${randomString}`;

						const existingReferral = await prisma.referral.findUnique({
							where: { code: referralCode }
						});

						if (!existingReferral) {
							isUnique = true;
						}
						attempts++;
					}

					if (!isUnique) {
						componentLogger.error({ maxAttempts }, "Failed to generate unique referral code after attempts");
						span.setStatus({
							code: SpanStatusCode.ERROR,
							message: "Failed to generate unique referral code"
						});
						const { response, statusCode } = serverErrorResponse("無法生成唯一的推薦碼");
						return reply.code(statusCode).send(response);
					}

					span.addEvent("referral.create");

					referral = await prisma.referral.create({
						data: {
							code: referralCode!,
							registrationId: regId,
							eventId: registration.eventId,
							isActive: true
						},
						include: {
							registration: {
								include: {
									event: true
								}
							}
						}
					});
				}

				span.setAttribute("referral.id", referral.id);
				span.setAttribute("referral.code", referral.code);

				const baseUrl = process.env.FRONTEND_URI || "http://localhost:4321";
				const referralLink = `${baseUrl}/register?ref=${referral.code}`;

				span.setStatus({ code: SpanStatusCode.OK });

				return successResponse({
					id: referral.id,
					referralLink: referralLink,
					referralCode: referral.code,
					eventId: referral.eventId
				});
			} catch (error) {
				componentLogger.error({ error }, "Get referral link error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get referral link"
				});
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取推薦連結失敗", (error as Error).message, 500);
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// 獲取個人推薦統計
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/registrations/referral-stats/:regId",
		{
			schema: publicReferralSchemas.getReferralStats
		},
		async (request, reply) => {
			const maskedRegId = request.params.regId.length > 6 ? `${request.params.regId.slice(0, 6)}...` : request.params.regId;

			const span = tracer.startSpan("route.referrals.get_referral_stats", {
				attributes: {
					"registration.id.masked": maskedRegId
				}
			});

			try {
				const { regId } = request.params;

				span.addEvent("auth.check_session");

				const session = await auth.api.getSession({
					headers: request.headers as any
				});

				if (!session) {
					span.setStatus({
						code: SpanStatusCode.ERROR,
						message: "Unauthorized"
					});
					const { response, statusCode } = unauthorizedResponse("請先登入");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("user.authenticated", true);
				span.setAttribute("user.id", session.user.id);

				span.addEvent("referral.fetch");

				const referral = await prisma.referral.findFirst({
					where: {
						registrationId: regId,
						isActive: true
					},
					include: {
						registration: true
					}
				});

				if (!referral || referral.registration.status !== "confirmed") {
					span.setStatus({
						code: SpanStatusCode.ERROR,
						message: "Referral not found"
					});
					const { response, statusCode } = notFoundResponse("找不到符合的報名記錄");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("referral.id", referral.id);

				if (referral.registration.userId !== session.user.id) {
					span.setStatus({
						code: SpanStatusCode.ERROR,
						message: "Forbidden"
					});
					const { response, statusCode } = forbiddenResponse("您無權訪問此推薦統計");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("referral.fetch_usages");

				const referralUsages = await prisma.referralUsage.findMany({
					where: {
						referralId: referral.id
					},
					select: {
						id: true,
						usedAt: true,
						registration: {
							select: {
								id: true,
								status: true,
								email: true,
								ticket: {
									select: {
										id: true,
										name: true,
										price: true
									}
								}
							}
						}
					},
					orderBy: {
						usedAt: "desc"
					}
				});

				const successfulReferrals = referralUsages.filter(usage => usage.registration.status === "confirmed");

				span.setAttribute("referral.total_count", referralUsages.length);
				span.setAttribute("referral.successful_count", successfulReferrals.length);

				const referralList = referralUsages.map(usage => ({
					id: usage.registration.id,
					status: usage.registration.status,
					ticketName: LocalizedTextSchema.parse(usage.registration.ticket.name),
					registeredAt: usage.usedAt,
					email: usage.registration.email.replace(/^(.{1,2}).*?(@.+)$/, (match, start, domain) => {
						const maskedLength = Math.max(3, match.length - start.length - domain.length);
						return start + "*".repeat(maskedLength) + domain;
					})
				}));

				span.setStatus({ code: SpanStatusCode.OK });

				return successResponse({
					totalReferrals: referralUsages.length,
					successfulReferrals: successfulReferrals.length,
					referralList: referralList,
					referrerInfo: {
						id: referral.registration.id,
						email: referral.registration.email.replace(/^(.{1,2}).*?(@.+)$/, (match, start, domain) => {
							const maskedLength = Math.max(3, match.length - start.length - domain.length);
							return start + "*".repeat(maskedLength) + domain;
						})
					}
				});
			} catch (error) {
				componentLogger.error({ error }, "Get referral stats error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get referral stats"
				});
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取推薦統計失敗", (error as Error).message, 500);
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// 驗證推薦碼
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/referrals/validate",
		{
			schema: { ...referralSchemas.validateReferral, tags: ["referrals"] }
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.referrals.validate_referral", {
				attributes: {
					"referral.code": request.body.code,
					"event.id": request.body.eventId
				}
			});

			try {
				const { code: referralCode, eventId } = request.body;

				span.addEvent("referral.validate");

				const referral = await prisma.referral.findFirst({
					where: {
						code: referralCode,
						eventId: eventId,
						isActive: true
					},
					include: {
						registration: true
					}
				});

				const isValid = !!(referral && referral.registration.status === "confirmed");

				if (referral) {
					span.setAttribute("referral.id", referral.id);
					span.setAttribute("referral.registration_status", referral.registration.status);
				}

				span.setStatus({ code: SpanStatusCode.OK });

				return successResponse({
					isValid: isValid,
					referrerId: referral?.registrationId || null
				});
			} catch (error) {
				componentLogger.error({ error }, "Validate referral code error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to validate referral code"
				});
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "驗證推薦碼失敗", (error as Error).message, 500);
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// 獲取推薦排行榜（公開）
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/referrals/ranking",
		{
			schema: publicReferralSchemas.getReferralRanking
		},
		async (request, reply) => {
			const { eventId, limit = 50 } = request.query;

			const span = tracer.startSpan("route.referrals.get_ranking", {
				attributes: {
					"event.id": eventId,
					"ranking.limit": limit
				}
			});

			try {
				// Get the current user's session (optional - may not be logged in)
				let currentUserId: string | null = null;
				try {
					const session = await auth.api.getSession({
						headers: request.headers as any
					});
					currentUserId = session?.user?.id || null;
				} catch {
					// User not logged in, that's fine for public endpoint
				}

				span.addEvent("referral.fetch_rankings");

				// Get all referrals for this event with their usage counts
				const referralsWithCounts = await prisma.referral.findMany({
					where: {
						eventId: eventId,
						isActive: true,
						registration: {
							status: "confirmed"
						}
					},
					include: {
						registration: {
							select: {
								id: true,
								userId: true,
								formData: true
							}
						},
						_count: {
							select: {
								referredUsers: {
									where: {
										registration: {
											status: "confirmed"
										}
									}
								}
							}
						}
					}
				});

				// Filter to only those with at least 1 successful referral and sort by count
				const rankedReferrals = referralsWithCounts.filter(r => r._count.referredUsers > 0).sort((a, b) => b._count.referredUsers - a._count.referredUsers);

				span.setAttribute("ranking.total_participants", rankedReferrals.length);

				// Helper function to censor name
				const censorName = (name: string, isCurrentUser: boolean): string => {
					if (isCurrentUser) return name;
					if (!name || name.length === 0) return "***";
					if (name.length === 1) return name[0] + "**";
					if (name.length === 2) return name[0] + "*";
					// For longer names, show first and last character
					return name[0] + "*".repeat(Math.min(name.length - 2, 3)) + name[name.length - 1];
				};

				// Helper to extract name from formData
				const extractName = (formData: string | null): string => {
					if (!formData) return "匿名";
					try {
						const parsed = JSON.parse(formData);
						// Try common field names for name
						return parsed.name || parsed.displayName || parsed.nickname || parsed.姓名 || parsed.暱稱 || "匿名";
					} catch {
						return "匿名";
					}
				};

				// Build rankings array
				const rankings = rankedReferrals.slice(0, limit).map((r, index) => {
					const isCurrentUser = currentUserId !== null && r.registration.userId === currentUserId;
					const name = extractName(r.registration.formData as string | null);
					return {
						rank: index + 1,
						censoredName: censorName(name, isCurrentUser),
						referralCount: r._count.referredUsers,
						isCurrentUser
					};
				});

				// Find current user's rank if logged in
				let currentUserRank: number | null = null;
				let currentUserReferralCount: number | null = null;

				if (currentUserId) {
					const currentUserIndex = rankedReferrals.findIndex(r => r.registration.userId === currentUserId);
					if (currentUserIndex !== -1) {
						currentUserRank = currentUserIndex + 1;
						currentUserReferralCount = rankedReferrals[currentUserIndex]._count.referredUsers;
					}
				}

				span.setStatus({ code: SpanStatusCode.OK });

				return successResponse({
					rankings,
					currentUserRank,
					currentUserReferralCount,
					totalParticipants: rankedReferrals.length
				});
			} catch (error) {
				componentLogger.error({ error }, "Get referral ranking error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get referral ranking"
				});
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取推薦排行榜失敗", (error as Error).message, 500);
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);
};

export default referralRoutes;
