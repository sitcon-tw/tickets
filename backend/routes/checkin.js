import prisma from "../config/database.js";
import { requireCheckIn } from "../middleware/auth.js";
import { errorResponse, successResponse } from "../utils/response.js";

export default async function checkinRoutes(fastify, options) {
	// Add checkin auth middleware
	fastify.addHook("preHandler", requireCheckIn);

	// 搜尋報名者
	fastify.get(
		"/registrations/search",
		{
			schema: {
				description: "搜尋報名者（支援多種搜尋方式）",
				tags: ["checkin"],
				querystring: {
					type: 'object',
					properties: {
						q: {
							type: 'string',
							description: '搜尋關鍵字'
						},
						type: {
							type: 'string',
							enum: ['all', 'email', 'checkInCode', 'orderNumber'],
							default: 'all',
							description: '搜尋類型'
						}
					},
					required: ['q']
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							data: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										email: { type: 'string' },
										phone: { type: 'string' },
										status: { type: 'string' },
										checkInCode: { type: 'string' },
										isCheckedIn: { type: 'boolean' },
										ticket: {
											type: 'object',
											properties: {
												name: { type: 'string' }
											}
										},
										event: {
											type: 'object',
											properties: {
												name: { type: 'string' }
											}
										}
									}
								}
							}
						}
					},
					400: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							error: { type: 'string' }
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { q, type = "all" } = request.query;

				if (!q) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "搜尋關鍵字為必填");
					return reply.code(statusCode).send(response);
				}

				// Build search conditions
				let whereConditions = {
					status: { not: 'cancelled' }
				};

				// Search by different criteria based on type
				if (type === 'email') {
					whereConditions.email = {
						contains: q,
						mode: 'insensitive'
					};
				} else if (type === 'checkInCode') {
					whereConditions.referralCode = {
						contains: q,
						mode: 'insensitive'
					};
				} else if (type === 'orderNumber') {
					whereConditions.id = {
						contains: q,
						mode: 'insensitive'
					};
				} else {
					// Search all fields
					whereConditions.OR = [
						{ email: { contains: q, mode: 'insensitive' } },
						{ referralCode: { contains: q, mode: 'insensitive' } },
						{ id: { contains: q, mode: 'insensitive' } },
						{ phone: { contains: q, mode: 'insensitive' } }
					];
				}

				const registrations = await prisma.registration.findMany({
					where: whereConditions,
					include: {
						event: true,
						ticket: true,
						registrationData: {
							include: {
								field: true
							}
						}
					},
					take: 50, // Limit results
					orderBy: {
						createdAt: 'desc'
					}
				});

				// Format results for display
				const results = registrations.map(reg => {
					// Build form data for display
					const formData = {};
					reg.registrationData.forEach(data => {
						try {
							formData[data.field.name] = JSON.parse(data.value);
						} catch {
							formData[data.field.name] = data.value;
						}
					});

					return {
						id: reg.id,
						email: reg.email,
						phone: reg.phone,
						checkInCode: reg.referralCode,
						status: reg.status,
						checkInStatus: reg.checkInStatus,
						checkInTime: reg.checkInTime,
						event: reg.event,
						ticket: reg.ticket,
						formData: formData,
						createdAt: reg.createdAt
					};
				});

				return successResponse(results);
			} catch (error) {
				console.error("Search registrations error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "搜尋報名者失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 執行簽到
	fastify.post(
		"/registrations/:regId/checkin",
		{
			schema: {
				description: "執行簽到",
				tags: ["checkin"]
			}
		},
		async (request, reply) => {
			try {
				const { regId } = request.params;
				const { checkInTime, note, staffId } = request.body;

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

				// Check if already checked in
				if (registration.checkInStatus === 'checked_in') {
					const { response, statusCode } = errorResponse("ALREADY_CHECKED_IN", "此報名者已簽到");
					return reply.code(statusCode).send(response);
				}

				// Update check-in status
				const updatedRegistration = await prisma.registration.update({
					where: { id: regId },
					data: {
						checkInStatus: 'checked_in',
						checkInTime: checkInTime ? new Date(checkInTime) : new Date()
					}
				});

				return successResponse({
					message: "簽到成功",
					checkInTime: updatedRegistration.checkInTime,
					checkInCode: updatedRegistration.referralCode
				});
			} catch (error) {
				console.error("Checkin error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "簽到失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 獲取簽到狀態
	fastify.get(
		"/registrations/:regId/status",
		{
			schema: {
				description: "獲取簽到狀態",
				tags: ["checkin"]
			}
		},
		async (request, reply) => {
			try {
				const { regId } = request.params;

				// Find registration
				const registration = await prisma.registration.findFirst({
					where: {
						id: regId,
						status: { not: 'cancelled' }
					}
				});

				if (!registration) {
					const { response, statusCode } = errorResponse("NOT_FOUND", "找不到符合的報名記錄");
					return reply.code(statusCode).send(response);
				}

				return successResponse({
					checkedIn: registration.checkInStatus === 'checked_in',
					checkInStatus: registration.checkInStatus,
					checkInTime: registration.checkInTime,
					checkInCode: registration.referralCode,
					status: registration.status
				});
			} catch (error) {
				console.error("Get checkin status error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取簽到狀態失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 簽到統計資訊
	fastify.get(
		"/stats",
		{
			schema: {
				description: "簽到統計資訊",
				tags: ["checkin"]
			}
		},
		async (request, reply) => {
			try {
				// Get check-in statistics
				const totalRegistrations = await prisma.registration.count({
					where: {
						status: 'confirmed'
					}
				});

				const checkedInCount = await prisma.registration.count({
					where: {
						status: 'confirmed',
						checkInStatus: 'checked_in'
					}
				});

				const checkedInPercentage = totalRegistrations > 0 ? Math.round((checkedInCount / totalRegistrations) * 100) : 0;

				return successResponse({
					totalRegistrations,
					checkedIn: checkedInCount,
					checkedInPercentage
				});
			} catch (error) {
				console.error("Get checkin stats error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取簽到統計失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 驗證 QR Code
	fastify.post(
		"/qr-verify",
		{
			schema: {
				description: "驗證 QR Code 並返回報名者資訊",
				tags: ["checkin"]
			}
		},
		async (request, reply) => {
			try {
				const { qrData, autoCheckIn = false } = request.body;

				if (!qrData) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "QR Code 資料為必填");
					return reply.code(statusCode).send(response);
				}

				// QR data should contain the check-in code
				const checkInCode = qrData.trim();

				// Find registration by check-in code
				const registration = await prisma.registration.findFirst({
					where: {
						referralCode: checkInCode,
						status: 'confirmed'
					},
					include: {
						event: true,
						ticket: true,
						registrationData: {
							include: {
								field: true
							}
						}
					}
				});

				if (!registration) {
					return successResponse({
						valid: false,
						message: "無效的 QR Code 或報名不存在"
					});
				}

				// Build form data
				const formData = {};
				registration.registrationData.forEach(data => {
					try {
						formData[data.field.name] = JSON.parse(data.value);
					} catch {
						formData[data.field.name] = data.value;
					}
				});

				// Auto check-in if requested
				if (autoCheckIn && registration.checkInStatus !== 'checked_in') {
					await prisma.registration.update({
						where: { id: registration.id },
						data: {
							checkInStatus: 'checked_in',
							checkInTime: new Date()
						}
					});
					registration.checkInStatus = 'checked_in';
					registration.checkInTime = new Date();
				}

				return successResponse({
					valid: true,
					registration: {
						id: registration.id,
						email: registration.email,
						phone: registration.phone,
						checkInCode: registration.referralCode,
						status: registration.status,
						checkInStatus: registration.checkInStatus,
						checkInTime: registration.checkInTime,
						event: registration.event,
						ticket: registration.ticket,
						formData: formData,
						createdAt: registration.createdAt
					}
				});
			} catch (error) {
				console.error("QR verify error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "驗證 QR Code 失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 透過 Check-in ID 獲取報名者資訊
	fastify.get(
		"/qr/:checkInId",
		{
			schema: {
				description: "透過 Check-in ID 獲取報名者資訊",
				tags: ["checkin"]
			}
		},
		async (request, reply) => {
			try {
				const { checkInId } = request.params;

				// Find registration by check-in code
				const registration = await prisma.registration.findFirst({
					where: {
						referralCode: checkInId,
						status: { not: 'cancelled' }
					},
					include: {
						event: true,
						ticket: true,
						registrationData: {
							include: {
								field: true
							}
						}
					}
				});

				if (!registration) {
					const { response, statusCode } = errorResponse("NOT_FOUND", "找不到符合的報名記錄");
					return reply.code(statusCode).send(response);
				}

				// Build form data
				const formData = {};
				registration.registrationData.forEach(data => {
					try {
						formData[data.field.name] = JSON.parse(data.value);
					} catch {
						formData[data.field.name] = data.value;
					}
				});

				return successResponse({
					registration: {
						id: registration.id,
						email: registration.email,
						phone: registration.phone,
						checkInCode: registration.referralCode,
						status: registration.status,
						checkInStatus: registration.checkInStatus,
						checkInTime: registration.checkInTime,
						event: registration.event,
						ticket: registration.ticket,
						formData: formData,
						createdAt: registration.createdAt
					}
				});
			} catch (error) {
				console.error("Get registration by checkin ID error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取報名者資訊失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}
