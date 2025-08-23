import prisma from "../../../config/database.js";
import { errorResponse, successResponse } from "../../../utils/response.js";

export default async function referralRoutes(fastify, options) {
	// 獲取專屬推薦連結
	fastify.get(
		"/registrations/:regId/referral-link",
		{
			schema: {
				description: "獲取專屬推薦連結",
				tags: ["referrals"],
				params: {
					type: 'object',
					properties: {
						regId: {
							type: 'string',
							description: '報名 ID'
						}
					},
					required: ['regId']
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							message: { type: 'string' },
							data: {
								type: 'object',
								properties: {
									referralLink: { type: 'string' },
									referralCode: { type: 'string' },
									eventId: { type: 'string' }
								}
							}
						}
					},
					404: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							error: {
								type: 'object',
								properties: {
									code: { type: 'string' },
									message: { type: 'string' }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { regId } = request.params;

				// Find registration
				const registration = await prisma.registration.findFirst({
					where: {
						id: regId,
						status: 'confirmed'
					},
					include: {
						event: true
					}
				});

				if (!registration) {
					const { response, statusCode } = errorResponse("NOT_FOUND", "找不到符合的報名記錄");
					return reply.code(statusCode).send(response);
				}

				// Use the registration's referral code (check-in code) as the referral identifier
				const referralCode = registration.referralCode;
				const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
				const referralLink = `${baseUrl}/register?ref=${referralCode}`;

				return successResponse({
					referralLink: referralLink,
					referralCode: referralCode,
					eventId: registration.eventId
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
				params: {
					type: 'object',
					properties: {
						regId: {
							type: 'string',
							description: '報名 ID'
						}
					},
					required: ['regId']
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							message: { type: 'string' },
							data: {
								type: 'object',
								properties: {
									totalReferrals: { type: 'integer' },
									successfulReferrals: { type: 'integer' },
									referralList: {
										type: 'array',
										items: {
											type: 'object',
											properties: {
												id: { type: 'string' },
												status: { type: 'string' },
												ticketName: { type: 'string' },
												registeredAt: { type: 'string', format: 'date-time' },
												email: { type: 'string' }
											}
										}
									},
									referrerInfo: {
										type: 'object',
										properties: {
											id: { type: 'string' },
											checkInCode: { type: 'string' },
											email: { type: 'string' }
										}
									}
								}
							}
						}
					},
					404: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							error: {
								type: 'object',
								properties: {
									code: { type: 'string' },
									message: { type: 'string' }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { regId } = request.params;

				// Find registration
				const registration = await prisma.registration.findFirst({
					where: {
						id: regId,
						status: 'confirmed'
					}
				});

				if (!registration) {
					const { response, statusCode } = errorResponse("NOT_FOUND", "找不到符合的報名記錄");
					return reply.code(statusCode).send(response);
				}

				// Get all referrals made by this registration
				const referrals = await prisma.registration.findMany({
					where: {
						referredBy: registration.id
					},
					include: {
						ticket: true
					},
					orderBy: {
						createdAt: 'desc'
					}
				});

				// Count successful referrals (confirmed registrations)
				const successfulReferrals = referrals.filter(r => r.status === 'confirmed');

				// Build referral list with anonymized data for privacy
				const referralList = referrals.map(referral => ({
					id: referral.id,
					status: referral.status,
					ticketName: referral.ticket.name,
					registeredAt: referral.createdAt,
					// Don't expose email or other personal info
					email: referral.email.replace(/(.{2}).*(@.*)/, '$1***$2') // Partially hide email
				}));

				return successResponse({
					totalReferrals: referrals.length,
					successfulReferrals: successfulReferrals.length,
					referralList: referralList,
					referrerInfo: {
						id: registration.id,
						checkInCode: registration.referralCode,
						email: registration.email.replace(/(.{2}).*(@.*)/, '$1***$2')
					}
				});
			} catch (error) {
				console.error("Get referral stats error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取推薦統計失敗", error.message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}