/**
 * @fileoverview Check-in action routes with modular types and schemas
 * @typedef {import('#types/database.js').Registration} Registration
 * @typedef {import('#types/api.js').CheckinRequest} CheckinRequest
 */

import prisma from "#config/database.js";
import { 
	successResponse, 
	notFoundResponse, 
	conflictResponse,
	serverErrorResponse 
} from "#utils/response.js";

/**
 * Check-in action routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {Object} options 
 */
export default async function checkinActionsRoutes(fastify, options) {
	// Perform check-in
	fastify.post(
		"/registrations/:regId/checkin",
		{
			schema: {
				description: "執行簽到",
				tags: ["checkin"],
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
				body: {
					type: 'object',
					properties: {
						checkInTime: {
							type: 'string',
							format: 'date-time',
							description: '簽到時間 (可選，預設為當前時間)'
						},
						note: {
							type: 'string',
							description: '簽到備註'
						},
						staffId: {
							type: 'string',
							description: '操作員工 ID'
						}
					}
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
									checkInTime: { type: 'string', format: 'date-time' },
									registration: { type: 'object' }
								}
							}
						}
					}
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {regId: string}, Body: CheckinRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { regId } = request.params;
				/** @type {CheckinRequest} */
				const { checkInTime, note, staffId } = request.body;

				// Find registration with event and user details
				/** @type {Registration | null} */
				const registration = await prisma.registration.findFirst({
					where: {
						id: regId,
						status: 'confirmed'
					},
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
						}
					}
				});

				if (!registration) {
					const { response, statusCode } = notFoundResponse("找不到符合的報名記錄");
					return reply.code(statusCode).send(response);
				}

				// Check if already checked in
				if (registration.checkinAt) {
					const { response, statusCode } = conflictResponse("此報名者已簽到");
					return reply.code(statusCode).send(response);
				}

				// Check if event is active for check-in
				const now = new Date();
				if (now < registration.event.startDate || now > registration.event.endDate) {
					const { response, statusCode } = conflictResponse("活動不在簽到時間範圍內");
					return reply.code(statusCode).send(response);
				}

				// Update check-in status
				const updatedRegistration = await prisma.registration.update({
					where: { id: regId },
					data: {
						checkinAt: checkInTime ? new Date(checkInTime) : new Date(),
						updatedAt: new Date(),
						...(note && { tags: JSON.stringify([{ type: 'checkin_note', value: note }]) })
					},
					include: {
						user: {
							select: {
								name: true,
								email: true
							}
						},
						event: {
							select: {
								name: true
							}
						}
					}
				});

				return reply.send(successResponse({
					checkInTime: updatedRegistration.checkinAt,
					registration: {
						id: updatedRegistration.id,
						user: updatedRegistration.user,
						event: updatedRegistration.event
					}
				}, "簽到成功"));
			} catch (error) {
				console.error("Checkin error:", error);
				const { response, statusCode } = serverErrorResponse("簽到失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get check-in status
	fastify.get(
		"/registrations/:regId/status",
		{
			schema: {
				description: "獲取簽到狀態",
				tags: ["checkin"],
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
									checkedIn: { type: 'boolean' },
									checkinAt: { type: 'string', format: 'date-time' },
									status: { type: 'string' },
									canCheckIn: { type: 'boolean' },
									user: { type: 'object' },
									event: { type: 'object' }
								}
							}
						}
					}
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {regId: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { regId } = request.params;

				// Find registration with event and user details
				/** @type {Registration | null} */
				const registration = await prisma.registration.findFirst({
					where: {
						id: regId,
						status: { not: 'cancelled' }
					},
					include: {
						user: {
							select: {
								name: true,
								email: true
							}
						},
						event: {
							select: {
								name: true,
								startDate: true,
								endDate: true
							}
						}
					}
				});

				if (!registration) {
					const { response, statusCode } = notFoundResponse("找不到符合的報名記錄");
					return reply.code(statusCode).send(response);
				}

				// Check if can check in
				const now = new Date();
				const canCheckIn = registration.status === 'confirmed' && 
					!registration.checkinAt &&
					now >= registration.event.startDate && 
					now <= registration.event.endDate;

				return reply.send(successResponse({
					checkedIn: !!registration.checkinAt,
					checkinAt: registration.checkinAt,
					status: registration.status,
					canCheckIn,
					user: registration.user,
					event: registration.event
				}));
			} catch (error) {
				console.error("Get checkin status error:", error);
				const { response, statusCode } = serverErrorResponse("獲取簽到狀態失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}