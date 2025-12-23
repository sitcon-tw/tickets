import prisma from "#config/database";
import { auth } from "#lib/auth";
import { errorResponse, forbiddenResponse, successResponse, unauthorizedResponse } from "#utils/response";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { referralValidateSchema, type ReferralValidateRequest } from "@tickets/shared";

const referralRoutes: FastifyPluginAsync = async fastify => {
	// 獲取專屬推薦連結
	fastify.get(
		"/registrations/:regId/referral-link",
		{
			schema: {
				description: "Get referral link",
				tags: ["referrals"],
			}
		},
		async (request: FastifyRequest<{ Params: { regId: string } }>, reply: FastifyReply) => {
			try {
				const { regId } = request.params;

				const registration = await prisma.registration.findUnique({
					where: { id: regId },
					include: { event: true }
				});

				if (!registration || registration.status !== "confirmed") {
					const { response, statusCode } = errorResponse("NOT_FOUND", "找不到符合的報名記錄");
					return reply.code(statusCode).send(response);
				}

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
						console.error("Failed to generate unique referral code after", maxAttempts, "attempts");
						const { response, statusCode } = errorResponse("INTERNAL_ERROR", "無法生成唯一的推薦碼");
						return reply.code(statusCode).send(response);
					}

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

				const baseUrl = process.env.FRONTEND_URI || "http://localhost:4321";
				const referralLink = `${baseUrl}/register?ref=${referral.code}`;

				return successResponse({
					id: referral.id,
					referralLink: referralLink,
					referralCode: referral.code,
					eventId: referral.eventId
				});
			} catch (error) {
				console.error("Get referral link error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取推薦連結失敗", (error as Error).message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 獲取個人推薦統計
	fastify.get(
		"/registrations/referral-stats/:regId",
		{
			schema: {
				description: "Get referral stats",
				tags: ["referrals"],
			}
		},
		async (request: FastifyRequest<{ Params: { regId: string } }>, reply: FastifyReply) => {
			try {
				const { regId } = request.params;

				const session = await auth.api.getSession({
					headers: request.headers as any
				});

				if (!session) {
					const { response, statusCode } = unauthorizedResponse("請先登入");
					return reply.code(statusCode).send(response);
				}

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
					const { response, statusCode } = errorResponse("NOT_FOUND", "找不到符合的報名記錄");
					return reply.code(statusCode).send(response);
				}

				if (referral.registration.userId !== session.user.id) {
					const { response, statusCode } = forbiddenResponse("您無權訪問此推薦統計");
					return reply.code(statusCode).send(response);
				}

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

				const referralList = referralUsages.map(usage => ({
					id: usage.registration.id,
					status: usage.registration.status,
					ticketName: usage.registration.ticket.name,
					registeredAt: usage.usedAt,
					email: usage.registration.email.replace(/^(.{1,2}).*?(@.+)$/, (match, start, domain) => {
						const maskedLength = Math.max(3, match.length - start.length - domain.length);
						return start + "*".repeat(maskedLength) + domain;
					})
				}));

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
				console.error("Get referral stats error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取推薦統計失敗", (error as Error).message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 驗證推薦碼
	fastify.post(
		"/referrals/validate",
		{
			schema: {
				description: "Validate referral code",
				tags: ["referrals"],
				body: referralValidateSchema,
			}
		},
		async (request: FastifyRequest<{ Body: ReferralValidateRequest }>, reply: FastifyReply) => {
			try {
				const { code: referralCode, eventId } = request.body as ReferralValidateRequest;

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

				return successResponse({
					isValid: !!(referral && referral.registration.status === "confirmed"),
					referrerId: referral?.registrationId || null
				});
			} catch (error) {
				console.error("Validate referral code error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "驗證推薦碼失敗", (error as Error).message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default referralRoutes;
