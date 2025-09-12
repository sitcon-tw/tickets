/**
 * @fileoverview Public registrations routes with modular types and schemas
 * @typedef {import('#types/database.js').Registration} Registration
 * @typedef {import('#types/api.js').RegistrationCreateRequest} RegistrationCreateRequest
 */

import prisma from "#config/database.js";
import { 
	successResponse, 
	validationErrorResponse, 
	notFoundResponse, 
	serverErrorResponse,
	conflictResponse,
	unauthorizedResponse
} from "#utils/response.js";
import { registrationSchemas, userRegistrationsResponse } from "#schemas/registration.js";
import { validateRegistrationFormData } from "#utils/validation.js";
import { auth } from "#lib/auth.js";


/**
 * Public registrations routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {Object} options 
 */
export default async function publicRegistrationsRoutes(fastify, options) {
	// Create new registration
	fastify.post(
		"/registrations",
		{
			schema: registrationSchemas.createRegistration
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Body: RegistrationCreateRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				/** @type {RegistrationCreateRequest} */
				const { eventId, ticketId, invitationCode, referralCode, formData } = request.body;
				const session = await auth.api.getSession({
					headers: request.headers
				});
				const userId = session.userId;

				// Get user info from session
				const user = session.user;

				// Check if user already registered for this event
				const existingRegistration = await prisma.registration.findFirst({
					where: {
						email: user.email,
						eventId
					}
				});

				if (existingRegistration) {
					const { response, statusCode } = conflictResponse("您已經報名此活動");
					return reply.code(statusCode).send(response);
				}

				// Verify event and ticket
				const [event, ticket] = await Promise.all([
					prisma.event.findUnique({
						where: { 
							id: eventId,
							isActive: true 
						}
					}),
					prisma.ticket.findUnique({
						where: { 
							id: ticketId,
							eventId,
							isActive: true 
						}
					})
				]);

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				if (!ticket) {
					const { response, statusCode } = notFoundResponse("票券不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				// Check ticket availability
				if (ticket.soldCount >= ticket.quantity) {
					const { response, statusCode } = conflictResponse("票券已售完");
					return reply.code(statusCode).send(response);
				}

				// Check sale period
				const now = new Date();
				if (ticket.saleStart && now < ticket.saleStart) {
					const { response, statusCode } = validationErrorResponse("票券尚未開始販售");
					return reply.code(statusCode).send(response);
				}

				if (ticket.saleEnd && now > ticket.saleEnd) {
					const { response, statusCode } = validationErrorResponse("票券販售已結束");
					return reply.code(statusCode).send(response);
				}

				// Validate invitation code if provided
				let invitationCodeId = null;
				if (invitationCode) {
					const code = await prisma.invitationCode.findFirst({
						where: {
							code: invitationCode,
							eventId,
							isActive: true
						}
					});

					if (!code) {
						const { response, statusCode } = validationErrorResponse("無效的邀請碼");
						return reply.code(statusCode).send(response);
					}

					// Check if code is expired
					if (code.expiresAt && now > code.expiresAt) {
						const { response, statusCode } = validationErrorResponse("邀請碼已過期");
						return reply.code(statusCode).send(response);
					}

					// Check if code has remaining uses
					if (code.usageLimit && code.usageCount >= code.usageLimit) {
						const { response, statusCode } = validationErrorResponse("邀請碼已達使用上限");
						return reply.code(statusCode).send(response);
					}

					invitationCodeId = code.id;
				}

				// Validate referral code if provided
				let referralCodeId = null;
				if (referralCode) {
					const referral = await prisma.referral.findFirst({
						where: {
							code: referralCode,
							eventId,
							isActive: true
						}
					});

					if (!referral) {
						const { response, statusCode } = validationErrorResponse("無效的推薦碼");
						return reply.code(statusCode).send(response);
					}

					referralCodeId = referral.id;
				}

				// Validate form data with hard-coded fields
				const formErrors = validateRegistrationFormData(formData);
				if (formErrors) {
					const { response, statusCode } = validationErrorResponse("表單驗證失敗", formErrors);
					return reply.code(statusCode).send(response);
				}

				// Create registration in transaction
				const result = await prisma.$transaction(async (tx) => {
					// Create registration with form data as JSON
					const registration = await tx.registration.create({
						data: {
							eventId,
							ticketId,
							email: user.email,
							phone: formData.phoneNumber || null,
							formData: JSON.stringify(formData),
							status: 'confirmed',
							paymentStatus: 'pending'
						},
						include: {
							event: {
								select: {
									name: true,
									startDate: true,
									endDate: true
								}
							},
							ticket: {
								select: {
									name: true,
									price: true
								}
							}
						}
					});

					// Update ticket sold count
					await tx.ticket.update({
						where: { id: ticketId },
						data: { soldCount: { increment: 1 } }
					});

					// Update invitation code usage if used
					if (invitationCodeId) {
						await tx.invitationCode.update({
							where: { id: invitationCodeId },
							data: { usageCount: { increment: 1 } }
						});
					}

					// Create referral usage record if used
					if (referralCodeId) {
						await tx.referralUsage.create({
							data: {
								referralId: referralCodeId,
								registrationId: registration.id,
								eventId
							}
						});
					}

					// Add parsed form data to response
					return {
						...registration,
						formData: JSON.parse(registration.formData)
					};
				});

				return reply.code(201).send(successResponse(result, "報名成功"));
			} catch (error) {
				console.error("Create registration error:", error);
				const { response, statusCode } = serverErrorResponse("報名失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get user's registrations
	fastify.get(
		"/registrations",
		{
			schema: {
				description: "取得用戶的報名記錄",
				tags: ["registrations"],
				response: userRegistrationsResponse
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const session = await auth.api.getSession({
					headers: request.headers
				});
				const userId = session.userId;

				/** @type {Registration[]} */
				const registrations = await prisma.registration.findMany({
					where: { userId },
					include: {
						event: {
							select: {
								id: true,
								name: true,
								description: true,
								location: true,
								startDate: true,
								endDate: true,
								ogImage: true
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
					},
					orderBy: { createdAt: 'desc' }
				});

				// Parse form data and add status indicators
				const registrationsWithStatus = registrations.map(reg => {
					const now = new Date();
					return {
						...reg,
						formData: JSON.parse(reg.formData),
						isUpcoming: reg.event.startDate > now,
						isPast: reg.event.endDate < now,
						canEdit: reg.status === 'confirmed' && reg.event.startDate > now,
						canCancel: reg.status === 'confirmed' && reg.event.startDate > now
					};
				});

				return reply.send(successResponse(registrationsWithStatus));
			} catch (error) {
				console.error("Get user registrations error:", error);
				const { response, statusCode } = serverErrorResponse("取得報名記錄失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get specific registration
	fastify.get(
		"/registrations/:id",
		{
			schema: {
				description: "取得特定報名記錄",
				tags: ["registrations"]
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const session = await auth.api.getSession({
					headers: request.headers
				});
				const userId = session.userId;

				/** @type {Registration | null} */
				const registration = await prisma.registration.findFirst({
					where: {
						id,
						userId // Ensure user can only access their own registrations
					},
					include: {
						event: {
							select: {
								id: true,
								name: true,
								description: true,
								location: true,
								startDate: true,
								endDate: true,
								ogImage: true
							}
						},
						ticket: {
							select: {
								id: true,
								name: true,
								description: true,
								price: true
							}
						},
						invitationCode: {
							select: {
								code: true,
								description: true
							}
						},
						referralCode: {
							select: {
								code: true,
								description: true
							}
						}
					}
				});

				if (!registration) {
					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				// Parse form data and add status indicators
				const now = new Date();
				const registrationWithStatus = {
					...registration,
					formData: JSON.parse(registration.formData),
					isUpcoming: registration.event.startDate > now,
					isPast: registration.event.endDate < now,
					canEdit: registration.status === 'confirmed' && registration.event.startDate > now,
					canCancel: registration.status === 'confirmed' && registration.event.startDate > now
				};

				return reply.send(successResponse(registrationWithStatus));
			} catch (error) {
				console.error("Get registration error:", error);
				const { response, statusCode } = serverErrorResponse("取得報名記錄失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Cancel registration
	fastify.put(
		"/registrations/:id/cancel",
		{
			schema: {
				description: "取消報名",
				tags: ["registrations"]
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const session = await auth.api.getSession({
					headers: request.headers
				});
				const userId = session.userId;

				// Check if registration exists and belongs to user
				const registration = await prisma.registration.findFirst({
					where: {
						id,
						userId
					},
					include: {
						event: {
							select: {
								startDate: true,
								endDate: true
							}
						}
					}
				});

				if (!registration) {
					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				// Check if registration can be cancelled
				if (registration.status !== 'confirmed') {
					const { response, statusCode } = validationErrorResponse("只能取消已確認的報名");
					return reply.code(statusCode).send(response);
				}

				if (new Date() >= registration.event.startDate) {
					const { response, statusCode } = validationErrorResponse("活動已開始，無法取消報名");
					return reply.code(statusCode).send(response);
				}

				// Cancel registration and update ticket count
				await prisma.$transaction(async (tx) => {
					// Update registration status
					await tx.registration.update({
						where: { id },
						data: {
							status: 'cancelled',
							updatedAt: new Date()
						}
					});

					// Decrease ticket sold count
					await tx.ticket.update({
						where: { id: registration.ticketId },
						data: { soldCount: { decrement: 1 } }
					});
				});

				return reply.send(successResponse(null, "報名已取消"));
			} catch (error) {
				console.error("Cancel registration error:", error);
				const { response, statusCode } = serverErrorResponse("取消報名失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}