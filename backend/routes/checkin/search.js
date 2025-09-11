/**
 * @fileoverview Check-in search routes with modular types and schemas
 * @typedef {import('../../types/database.js').Registration} Registration
 */

import prisma from "#config/database.js";
import { 
	successResponse, 
	validationErrorResponse, 
	notFoundResponse, 
	serverErrorResponse
} from "#utils/response.js";

/**
 * Check-in search routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {Object} options 
 */
export default async function checkinSearchRoutes(fastify, options) {
	// Search registrations for check-in
	fastify.get(
		"/search",
		{
			schema: {
				description: "搜尋報名記錄進行報到",
				tags: ["checkin"],
				querystring: {
					type: 'object',
					properties: {
						q: {
							type: 'string',
							minLength: 1,
							description: '搜尋關鍵字 (姓名、電子郵件、報名 ID)'
						},
						eventId: {
							type: 'string',
							description: '活動 ID 篩選'
						},
						status: {
							type: 'string',
							enum: ['confirmed', 'pending', 'cancelled'],
							description: '報名狀態篩選'
						},
						checkinStatus: {
							type: 'string',
							enum: ['checked_in', 'not_checked_in'],
							description: '報到狀態篩選'
						}
					},
					required: ['q']
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							message: { type: 'string' },
							data: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										userId: { type: 'string' },
										status: { type: 'string' },
										checkinAt: { type: 'string', format: 'date-time' },
										formData: { type: 'object' },
										user: {
											type: 'object',
											properties: {
												name: { type: 'string' },
												email: { type: 'string' }
											}
										},
										event: {
											type: 'object',
											properties: {
												name: { type: 'string' },
												startDate: { type: 'string', format: 'date-time' },
												endDate: { type: 'string', format: 'date-time' }
											}
										},
										ticket: {
											type: 'object',
											properties: {
												name: { type: 'string' },
												price: { type: 'number' }
											}
										}
									}
								}
							}
						}
					}
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Querystring: {q: string, eventId?: string, status?: string, checkinStatus?: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { q, eventId, status, checkinStatus } = request.query;

				// Build search conditions
				const searchConditions = [];
				
				// Search by user name or email
				searchConditions.push({
					user: {
						OR: [
							{ name: { contains: q } },
							{ email: { contains: q } }
						]
					}
				});

				// Search by registration ID
				if (q.length >= 8) { // Assuming registration IDs are at least 8 characters
					searchConditions.push({ id: { contains: q } });
				}

				// Build where clause
				const where = {
					OR: searchConditions,
					...(eventId && { eventId }),
					...(status && { status }),
					...(checkinStatus === 'checked_in' && { checkinAt: { not: null } }),
					...(checkinStatus === 'not_checked_in' && { checkinAt: null })
				};

				/** @type {Registration[]} */
				const registrations = await prisma.registration.findMany({
					where,
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true
							}
						},
						event: {
							select: {
								id: true,
								name: true,
								startDate: true,
								endDate: true
							}
						},
						ticket: {
							select: {
								id: true,
								name: true,
								price: true
							}
						}
					},
					orderBy: { createdAt: 'desc' },
					take: 50 // Limit results to prevent overwhelming UI
				});

				// Add check-in eligibility status
				const now = new Date();
				const registrationsWithStatus = registrations.map(registration => ({
					...registration,
					isEligibleForCheckin: registration.status === 'confirmed' && 
						registration.event.startDate <= now && 
						registration.event.endDate >= now,
					isAlreadyCheckedIn: !!registration.checkinAt
				}));

				return reply.send(successResponse(registrationsWithStatus));
			} catch (error) {
				console.error("Search registrations error:", error);
				const { response, statusCode } = serverErrorResponse("搜尋報名記錄失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Search by QR code or registration ID
	fastify.get(
		"/search/:registrationId",
		{
			schema: {
				description: "通過報名 ID 或 QR 碼搜尋報名記錄",
				tags: ["checkin"],
				params: {
					type: 'object',
					properties: {
						registrationId: {
							type: 'string',
							description: '報名 ID'
						}
					},
					required: ['registrationId']
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {registrationId: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { registrationId } = request.params;

				/** @type {Registration | null} */
				const registration = await prisma.registration.findUnique({
					where: { id: registrationId },
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true
							}
						},
						event: {
							select: {
								id: true,
								name: true,
								location: true,
								startDate: true,
								endDate: true
							}
						},
						ticket: {
							select: {
								id: true,
								name: true,
								description: true,
								price: true
							}
						}
					}
				});

				if (!registration) {
					const { response, statusCode } = notFoundResponse("找不到此報名記錄");
					return reply.code(statusCode).send(response);
				}

				// Check eligibility for check-in
				const now = new Date();
				const isEligibleForCheckin = registration.status === 'confirmed' && 
					registration.event.startDate <= now && 
					registration.event.endDate >= now;

				const registrationWithStatus = {
					...registration,
					isEligibleForCheckin,
					isAlreadyCheckedIn: !!registration.checkinAt,
					canCheckIn: isEligibleForCheckin && !registration.checkinAt
				};

				return reply.send(successResponse(registrationWithStatus));
			} catch (error) {
				console.error("Get registration by ID error:", error);
				const { response, statusCode } = serverErrorResponse("取得報名記錄失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

}