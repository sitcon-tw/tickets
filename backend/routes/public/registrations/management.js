import prisma from "#config/database.js";
import { errorResponse, successResponse } from "#utils/response.js";
import { hashToken, isTokenExpired } from "#utils/token.js";

export default async function managementRoutes(fastify, options) {
	// 取消報名
	fastify.post(
		"/registrations/cancel/:token",
		{
			schema: {
				description: "取消報名",
				tags: ["registrations"],
				params: {
					type: 'object',
					properties: {
						token: {
							type: 'string',
							description: '編輯 token'
						}
					},
					required: ['token']
				},
				body: {
					type: 'object',
					properties: {
						reason: {
							type: 'string',
							description: '取消原因'
						},
						confirmed: {
							type: 'boolean',
							description: '確認取消'
						}
					},
					required: ['confirmed']
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
									message: { type: 'string' }
								}
							}
						}
					},
					400: {
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
				const { token } = request.params;
				const { reason, confirmed } = request.body;

				if (!confirmed) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "請確認取消報名");
					return reply.code(statusCode).send(response);
				}

				// Hash the provided token to compare with stored hash
				const hashedToken = hashToken(token);

				// Find registration with this token
				const registration = await prisma.registration.findFirst({
					where: {
						editToken: hashedToken,
						status: { not: 'cancelled' }
					},
					include: {
						event: true,
						ticket: true
					}
				});

				if (!registration) {
					const { response, statusCode } = errorResponse("INVALID_TOKEN", "編輯連結無效或已過期");
					return reply.code(statusCode).send(response);
				}

				// Check if token is expired
				if (!registration.editTokenExpiry || isTokenExpired(registration.editTokenExpiry)) {
					const { response, statusCode } = errorResponse("TOKEN_EXPIRED", "編輯連結已過期");
					return reply.code(statusCode).send(response);
				}

				// Check if cancellation is allowed for this ticket type
				// For now, assume all tickets are cancellable
				// In the future, you could add a 'cancellable' field to the ticket model

				// Check cancellation deadline (e.g., cannot cancel N days before event)
				const dayBeforeEvent = new Date(registration.event.startDate);
				dayBeforeEvent.setDate(dayBeforeEvent.getDate() - 3); // 3 days before
				const now = new Date();

				if (now > dayBeforeEvent) {
					const { response, statusCode } = errorResponse("CANCELLATION_DEADLINE_PASSED", "活動進入禁止取消期，無法取消報名");
					return reply.code(statusCode).send(response);
				}

				// Cancel registration with transaction
				await prisma.$transaction(async (tx) => {
					// Update registration status
					await tx.registration.update({
						where: { id: registration.id },
						data: {
							status: 'cancelled',
							// Clear edit token
							editToken: null,
							editTokenExpiry: null
						}
					});

					// Release ticket quota
					await tx.ticket.update({
						where: { id: registration.ticketId },
						data: { soldCount: { decrement: 1 } }
					});
				});

				// TODO: Send cancellation confirmation email

				return successResponse({ message: "報名已成功取消，票券名額已釋出" });
			} catch (error) {
				console.error("Cancel registration error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取消報名失敗", error.message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}