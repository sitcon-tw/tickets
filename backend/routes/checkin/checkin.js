import prisma from "#config/database.js";
import { errorResponse, successResponse } from "#utils/response.js";

export default async function checkinActionsRoutes(fastify, options) {
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
}