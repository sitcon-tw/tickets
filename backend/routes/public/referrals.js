import prisma from "#config/database.js";
import { errorResponse, successResponse } from "#utils/response.js";
import { referralSchemas, referralStatsResponse } from "#schemas/referral.js";

// Custom param schema for regId parameter
const regIdParam = {
	type: 'object',
	properties: {
		regId: {
			type: 'string',
			description: '報名 ID'
		}
	},
	required: ['regId']
};


export default async function referralRoutes(fastify, options) {	
	// 獲取專屬推薦連結
	fastify.get(
		"/registrations/:regId/referral-link",
		{
			schema: {
				description: "獲取專屬推薦連結",
				tags: ["referrals"],
				params: regIdParam,
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							message: { type: 'string' },
							data: {
								type: 'object',
								properties: {
									id: { type: 'string' },
									referralLink: { type: 'string' },
									referralCode: { type: 'string' },
									eventId: { type: 'string' }
								},
								required: ['id', 'referralLink', 'referralCode', 'eventId']
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { regId } = request.params;

				// First, verify the registration exists and is confirmed
				const registration = await prisma.registration.findUnique({
					where: { id: regId },
					include: { event: true }
				});

				if (!registration || registration.status !== 'confirmed') {
					const { response, statusCode } = errorResponse("NOT_FOUND", "找不到符合的報名記錄");
					return reply.code(statusCode).send(response);
				}

				// Find existing referral by registration ID
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

				// If no referral exists, create one
				if (!referral) {
					let referralCode;
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

					// Create the referral
					referral = await prisma.referral.create({
						data: {
							code: referralCode,
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

				const baseUrl = process.env.FRONTEND_URI || 'http://localhost:4321';
				const referralLink = `${baseUrl}/register?ref=${referral.code}`;

				return successResponse({
					id: referral.id,
					referralLink: referralLink,
					referralCode: referral.code,
					eventId: referral.eventId
				});
			} catch (error) {
				console.error("Get referral link error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取推薦連結失敗", error.message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 獲取個人推薦統計
	fastify.get(
		"/registrations/referral-stats/:regId",
		{
			schema: {
				description: "獲取個人推薦統計",
				tags: ["referrals"],
				params: regIdParam,
				response: referralStatsResponse
			}
		},
		async (request, reply) => {
			try {
				const { regId } = request.params;

				// Find referral by registration ID
				const referral = await prisma.referral.findFirst({
					where: {
						registrationId: regId,
						isActive: true
					},
					include: {
						registration: true
					}
				});

				if (!referral || referral.registration.status !== 'confirmed') {
					const { response, statusCode } = errorResponse("NOT_FOUND", "找不到符合的報名記錄");
					return reply.code(statusCode).send(response);
				}

				// Get all referral usages for this referral
				const referralUsages = await prisma.referralUsage.findMany({
					where: {
						referralId: referral.id
					},
					include: {
						registration: {
							include: {
								ticket: true
							}
						}
					},
					orderBy: {
						usedAt: 'desc'
					}
				});

				// Count successful referrals (confirmed registrations)
				const successfulReferrals = referralUsages.filter(usage => usage.registration.status === 'confirmed');

				// Build referral list with anonymized data for privacy
				const referralList = referralUsages.map(usage => ({
					id: usage.registration.id,
					status: usage.registration.status,
					ticketName: usage.registration.ticket.name,
					registeredAt: usage.usedAt,
					// Don't expose email or other personal info - improved masking
					email: usage.registration.email.replace(/^(.{1,2}).*?(@.+)$/, (match, start, domain) => {
						const maskedLength = Math.max(3, match.length - start.length - domain.length);
						return start + '*'.repeat(maskedLength) + domain;
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
							return start + '*'.repeat(maskedLength) + domain;
						})
					}
				});
			} catch (error) {
				console.error("Get referral stats error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取推薦統計失敗", error.message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 驗證推薦碼
	fastify.post(
		"/referrals/validate",
		{
			schema: { ...referralSchemas.validateReferral, tags: ["referrals"] }
		},
		async (request, reply) => {
			try {
				const { code: referralCode, eventId } = request.body;

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
					isValid: !!(referral && referral.registration.status === 'confirmed'),
					referrerId: referral?.registrationId || null
				});
			} catch (error) {
				console.error("Validate referral code error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "驗證推薦碼失敗", error.message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}