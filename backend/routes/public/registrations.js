/**
 * @fileoverview Public registrations routes with modular types and schemas
 * @typedef {import('#types/database.js').Registration} Registration
 * @typedef {import('#types/api.js').RegistrationCreateRequest} RegistrationCreateRequest
 * @typedef {import('#types/api.js').InvitationCode} InvitationCode 
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
import { safeJsonParse, safeJsonStringify } from "#utils/json.js";


/**
 * Public registrations routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {Object} options 
 */
export default async function publicRegistrationsRoutes(fastify, options) {
	// Apply preHandler if provided
	if (options.preHandler) {
		fastify.addHook('preHandler', options.preHandler);
	}

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

				// Verify event and ticket, and get form fields
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
						},
						include: {
							fromFields: {
								orderBy: { order: 'asc' }
							}
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

				// Basic ticket availability check (will be re-checked in transaction)
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

				// Validate invitation code logic
				let invitationCodeId = null;
				if (ticket.requireInviteCode) {
					// Ticket requires invitation code
					if (!invitationCode) {
						const { response, statusCode } = unauthorizedResponse("此票券需要邀請碼");
						return reply.code(statusCode).send(response);
					}

					/** @type {InvitationCode | null} */
					const code = await prisma.invitationCode.findFirst({
						where: {
							code: invitationCode,
							ticketId,
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
					if (code.usageLimit && code.usedCount >= code.usageLimit) {
						const { response, statusCode } = validationErrorResponse("邀請碼已達使用上限");
						return reply.code(statusCode).send(response);
					}

					if (ticket.id != code.ticketId) {
						const { response, statusCode } = validationErrorResponse("邀請碼不適用於此票券");
						return reply.code(statusCode).send(response);
					}

					invitationCodeId = code.id;
				} else if (invitationCode) {
					// Ticket doesn't require invitation code but one was provided - validate it anyway for consistency
					const code = await prisma.invitationCode.findFirst({
						where: {
							code: invitationCode,
							ticketId,
							isActive: true
						}
					});

					if (code && (!code.expiresAt || now <= code.expiresAt) && 
						(!code.usageLimit || code.usedCount < code.usageLimit)) {
						invitationCodeId = code.id;
					}
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

				// Validate form data with dynamic fields from database
				const formErrors = validateRegistrationFormData(formData, ticket.fromFields);
				if (formErrors) {
					const { response, statusCode } = validationErrorResponse("表單驗證失敗", formErrors);
					return reply.code(statusCode).send(response);
				}

				// Create registration in transaction
				const result = await prisma.$transaction(async (tx) => {
					// Re-check ticket availability within transaction to prevent race conditions
					const currentTicket = await tx.ticket.findUnique({
						where: { id: ticketId },
						select: { soldCount: true, quantity: true }
					});

					if (!currentTicket || currentTicket.soldCount >= currentTicket.quantity) {
						throw new Error("TICKET_SOLD_OUT");
					}

					// Create registration with form data as JSON
					const registration = await tx.registration.create({
						data: {
							userId: user.id,
							eventId,
							ticketId,
							email: user.email,
							formData: safeJsonStringify(formData, '{}', 'registration creation'),
							status: 'confirmed',
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
							data: { usedCount: { increment: 1 } }
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

					// Add parsed form data to response with error handling
					const parsedFormData = safeJsonParse(registration.formData, {}, 'registration response');

					return {
						...registration,
						formData: parsedFormData
					};
				});

				return reply.code(201).send(successResponse(result, "報名成功"));
			} catch (error) {
				console.error("Create registration error:", error);
				
				// Handle specific transaction errors
				if (error.message === "TICKET_SOLD_OUT") {
					const { response, statusCode } = conflictResponse("票券已售完");
					return reply.code(statusCode).send(response);
				}
				
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
				const userId = session.user?.id;

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
					const parsedFormData = safeJsonParse(reg.formData, {}, `user registrations for ${reg.id}`);

					return {
						...reg,
						formData: parsedFormData,
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
				const userId = session.user?.id;
				const { id } = request.params;

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
					}
				});

				if (!registration) {
					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				// Parse form data and add status indicators
				const now = new Date();
				const parsedFormData = safeJsonParse(registration.formData, {}, `single registration ${registration.id}`);

				const registrationWithStatus = {
					...registration,
					formData: parsedFormData,
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

	// Edit registration (only form data can be edited)
	fastify.put(
		"/registrations/:id",
		{
			schema: {
				description: "編輯報名記錄（僅限表單資料）",
				tags: ["registrations"],
				body: registrationSchemas.updateRegistration.body,
				response: registrationSchemas.updateRegistration.response
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}, Body: {formData: Object}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const session = await auth.api.getSession({
					headers: request.headers
				});
				const userId = session.user?.id;
				const id = request.params.id;
				const { formData } = request.body;

				// Check if registration exists and belongs to user
				const registration = await prisma.registration.findFirst({
					where: {
						id,
						userId
					},
					include: {
						ticket: {
							include: {
								fromFields: true
							}
						},
						event: {
							select: {
								startDate: true
							}
						}
					}
				});

				if (!registration) {
					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				// Check if registration can be edited
				if (registration.status !== 'confirmed') {
					const { response, statusCode } = validationErrorResponse("只能編輯已確認的報名");
					return reply.code(statusCode).send(response);
				}

				if (new Date() >= registration.event.startDate) {
					const { response, statusCode } = validationErrorResponse("活動已開始，無法編輯報名");
					return reply.code(statusCode).send(response);
				}

				// Validate form data with dynamic fields from database
				const formErrors = validateRegistrationFormData(formData, registration.ticket.fromFields);
				if (formErrors) {
					const { response, statusCode } = validationErrorResponse("表單驗證失敗", formErrors);
					return reply.code(statusCode).send(response);
				}

				// Update registration form data
				const updatedRegistration = await prisma.registration.update({
					where: { id },
					data: {
						formData: safeJsonStringify(formData, '{}', 'registration update'),
						updatedAt: new Date()
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
						}
					}
				});

				// Parse form data for response
				const parsedFormData = safeJsonParse(updatedRegistration.formData, {}, 'updated registration response');

				return reply.send(successResponse(
					{ 
						...updatedRegistration, 
						formData: parsedFormData 
					}, 
					"報名資料已更新"
				));
			} catch (error) {
				console.error("Edit registration error:", error);
				const { response, statusCode } = serverErrorResponse("更新報名資料失敗");
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
				const userId = session.user?.id;
				const id = request.params.id;

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