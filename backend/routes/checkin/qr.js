import prisma from "../../config/database.js";
import { errorResponse, successResponse } from "../../utils/response.js";

export default async function qrRoutes(fastify, options) {
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