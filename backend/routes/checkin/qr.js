/**
 * @fileoverview QR code check-in routes with modular types and schemas
 * @typedef {import('#types/database.js').Registration} Registration
 * @typedef {import('#types/api.js').QRVerifyRequest} QRVerifyRequest
 */

import prisma from "#config/database.js";
import { 
	successResponse, 
	validationErrorResponse,
	notFoundResponse, 
	serverErrorResponse 
} from "#utils/response.js";

/**
 * QR code check-in routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {Object} options 
 */
export default async function qrRoutes(fastify, options) {
	// Verify QR Code
	fastify.post(
		"/qr-verify",
		{
			schema: {
				description: "驗證 QR Code 並返回報名者資訊",
				tags: ["checkin"],
				body: {
					type: 'object',
					properties: {
						qrData: {
							type: 'string',
							minLength: 1,
							description: 'QR Code 資料'
						},
						autoCheckIn: {
							type: 'boolean',
							default: false,
							description: '是否自動簽到'
						}
					},
					required: ['qrData']
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
									valid: { type: 'boolean' },
									registration: {
										type: 'object',
										properties: {
											id: { type: 'string' },
											status: { type: 'string' },
											checkinAt: { type: 'string', format: 'date-time' },
											user: { type: 'object' },
											event: { type: 'object' },
											ticket: { type: 'object' },
											formData: { type: 'object' }
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
		 * @param {import('fastify').FastifyRequest<{Body: QRVerifyRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				/** @type {QRVerifyRequest} */
				const { qrData, autoCheckIn = false } = request.body;

				if (!qrData) {
					const { response, statusCode } = validationErrorResponse("QR Code 資料為必填");
					return reply.code(statusCode).send(response);
				}

				// QR data should contain the registration ID
				const registrationId = qrData.trim();

				// Find registration by ID
				/** @type {Registration | null} */
				const registration = await prisma.registration.findFirst({
					where: {
						id: registrationId,
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
								location: true,
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
					}
				});

				if (!registration) {
					return reply.send(successResponse({
						valid: false,
						message: "無效的 QR Code 或報名不存在"
					}));
				}

				// Check if event is active for check-in
				const now = new Date();
				const canCheckIn = now >= registration.event.startDate && now <= registration.event.endDate;

				// Auto check-in if requested and allowed
				let wasCheckedIn = false;
				if (autoCheckIn && !registration.checkinAt && canCheckIn) {
					await prisma.registration.update({
						where: { id: registration.id },
						data: {
							checkinAt: new Date(),
							updatedAt: new Date()
						}
					});
					registration.checkinAt = new Date();
					wasCheckedIn = true;
				}

				// Parse form data
				let formData = {};
				if (registration.formData) {
					try {
						formData = JSON.parse(registration.formData);
					} catch (error) {
						console.warn("Failed to parse form data:", error);
					}
				}

				return reply.send(successResponse({
					valid: true,
					autoCheckedIn: wasCheckedIn,
					registration: {
						id: registration.id,
						status: registration.status,
						checkinAt: registration.checkinAt,
						canCheckIn: canCheckIn && !registration.checkinAt,
						user: registration.user,
						event: registration.event,
						ticket: registration.ticket,
						formData,
						createdAt: registration.createdAt
					}
				}));
			} catch (error) {
				console.error("QR verify error:", error);
				const { response, statusCode } = serverErrorResponse("驗證 QR Code 失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get registration by check-in ID
	fastify.get(
		"/qr/:registrationId",
		{
			schema: {
				description: "透過報名 ID 獲取報名者資訊",
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
									registration: {
										type: 'object',
										properties: {
											id: { type: 'string' },
											status: { type: 'string' },
											checkinAt: { type: 'string', format: 'date-time' },
											user: { type: 'object' },
											event: { type: 'object' },
											ticket: { type: 'object' },
											formData: { type: 'object' }
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
		 * @param {import('fastify').FastifyRequest<{Params: {registrationId: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { registrationId } = request.params;

				// Find registration by ID
				/** @type {Registration | null} */
				const registration = await prisma.registration.findFirst({
					where: {
						id: registrationId,
						status: { not: 'cancelled' }
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
								location: true,
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

				// Parse form data
				let formData = {};
				if (registration.formData) {
					try {
						formData = JSON.parse(registration.formData);
					} catch (error) {
						console.warn("Failed to parse form data:", error);
					}
				}

				return reply.send(successResponse({
					registration: {
						id: registration.id,
						status: registration.status,
						checkinAt: registration.checkinAt,
						canCheckIn,
						user: registration.user,
						event: registration.event,
						ticket: registration.ticket,
						formData,
						createdAt: registration.createdAt
					}
				}));
			} catch (error) {
				console.error("Get registration by ID error:", error);
				const { response, statusCode } = serverErrorResponse("獲取報名者資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}