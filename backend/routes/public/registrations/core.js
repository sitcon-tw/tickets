import prisma from "../../../config/database.js";
import { errorResponse, successResponse } from "../../../utils/response.js";
import { sendRegistrationConfirmation } from "../../../utils/email.js";
import { generateCheckInCode, generateQRCodeDataURL } from "../../../utils/qrcode.js";
import { validateFormData } from "../../../utils/validation.js";

export default async function coreRegistrationRoutes(fastify, options) {
	// 提交報名表單
	fastify.post(
		"/registrations",
		{
			schema: {
				description: "提交報名表單",
				tags: ["registrations"],
				body: {
					type: 'object',
					properties: {
						eventId: {
							type: 'string',
							description: '活動 ID'
						},
						ticketId: {
							type: 'string',
							description: '票種 ID'
						},
						inviteCode: {
							type: 'string',
							description: '邀請碼'
						},
						referralCode: {
							type: 'string',
							description: '推薦碼'
						},
						formData: {
							type: 'object',
							properties: {
								email: {
									type: 'string',
									format: 'email',
									description: '電子信箱'
								},
								phone: {
									type: 'string',
									description: '電話號碼'
								}
							},
							required: ['email'],
							additionalProperties: true
						},
						agreedToTerms: {
							type: 'boolean',
							description: '同意條款'
						},
						files: {
							type: 'array',
							description: '上傳檔案'
						}
					},
					required: ['eventId', 'ticketId', 'formData', 'agreedToTerms']
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
									registrationId: { type: 'string' },
									checkInCode: { type: 'string' },
									qrCodeUrl: { type: 'string' },
									referralLink: { type: 'string' }
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
					}
				}
			}
		},
		async (request, reply) => {
				try {
				const { eventId, ticketId, inviteCode, referralCode, formData, agreedToTerms, files } = request.body;

				if (!eventId || !ticketId || !formData || !agreedToTerms) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "必填欄位不完整");
					return reply.code(statusCode).send(response);
				}

				// Validate event exists and is active
				const event = await prisma.event.findFirst({
					where: { id: eventId, isActive: true }
				});

				if (!event) {
					const { response, statusCode } = errorResponse("NOT_FOUND", "活動不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				// Validate ticket exists and is available
				const ticket = await prisma.ticket.findFirst({
					where: { 
						id: ticketId, 
						eventId: eventId,
						isActive: true
					}
				});

				if (!ticket) {
					const { response, statusCode } = errorResponse("NOT_FOUND", "票種不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				// Check ticket availability
				if (ticket.soldCount >= ticket.quantity) {
					const { response, statusCode } = errorResponse("SOLD_OUT", "票券已售完");
					return reply.code(statusCode).send(response);
				}

				// Check sale period
				const now = new Date();
				if (ticket.saleStart && now < ticket.saleStart) {
					const { response, statusCode } = errorResponse("NOT_AVAILABLE", "票券尚未開始販售");
					return reply.code(statusCode).send(response);
				}
				if (ticket.saleEnd && now > ticket.saleEnd) {
					const { response, statusCode } = errorResponse("NOT_AVAILABLE", "票券販售已結束");
					return reply.code(statusCode).send(response);
				}

				// Validate invitation code if required
				if (inviteCode) {
					const invitation = await prisma.invitationCode.findFirst({
						where: {
							code: inviteCode,
							eventId: eventId,
							isActive: true,
							tickets: {
								some: { ticketId: ticketId }
							}
						}
					});

					if (!invitation) {
						const { response, statusCode } = errorResponse("INVALID_INVITE", "邀請碼無效或不適用於此票種");
						return reply.code(statusCode).send(response);
					}

					// Check invitation usage limit
					if (invitation.usageLimit && invitation.usedCount >= invitation.usageLimit) {
						const { response, statusCode } = errorResponse("INVITE_EXHAUSTED", "邀請碼使用次數已達上限");
						return reply.code(statusCode).send(response);
					}

					// Check invitation validity period
					if (invitation.validFrom && now < invitation.validFrom) {
						const { response, statusCode } = errorResponse("INVITE_NOT_VALID", "邀請碼尚未生效");
						return reply.code(statusCode).send(response);
					}
					if (invitation.validUntil && now > invitation.validUntil) {
						const { response, statusCode } = errorResponse("INVITE_EXPIRED", "邀請碼已過期");
						return reply.code(statusCode).send(response);
					}
				}

				// Check if user already registered for this event
				const existingRegistration = await prisma.registration.findFirst({
					where: {
						email: formData.email,
						eventId: eventId,
						status: { not: 'cancelled' }
					}
				});

				if (existingRegistration) {
					const { response, statusCode } = errorResponse("ALREADY_REGISTERED", "此信箱已報名過此活動");
					return reply.code(statusCode).send(response);
				}

				// Handle referral
				let referrer = null;
				if (referralCode) {
					referrer = await prisma.registration.findFirst({
						where: {
							referralCode: referralCode,
							eventId: eventId,
							status: 'confirmed'
						}
					});
				}

				// Generate unique check-in code
				let checkInCode;
				do {
					checkInCode = generateCheckInCode();
					const existing = await prisma.registration.findFirst({
						where: { referralCode: checkInCode }
					});
					if (!existing) break;
				} while (true);

				// Create registration with transaction
				const registration = await prisma.$transaction(async (tx) => {
					// Create registration
					const newRegistration = await tx.registration.create({
						data: {
							eventId,
							ticketId,
							email: formData.email,
							phone: formData.phone || null,
							status: 'confirmed',
							referredBy: referrer?.id || null,
							referralCode: checkInCode
						}
					});

					// Get form fields for this ticket
					const ticketFields = await tx.ticketFormField.findMany({
						where: { ticketId },
						include: { field: true }
					});

					// Save form data
					for (const ticketField of ticketFields) {
						const fieldValue = formData[ticketField.field.name];
						if (fieldValue !== undefined) {
							await tx.registrationData.create({
								data: {
									registrationId: newRegistration.id,
									fieldId: ticketField.fieldId,
									value: typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue)
								}
							});
						}
					}

					// Update ticket sold count
					await tx.ticket.update({
						where: { id: ticketId },
						data: { soldCount: { increment: 1 } }
					});

					// Update invitation code usage if used
					if (inviteCode) {
						await tx.invitationCode.update({
							where: { code: inviteCode },
							data: { usedCount: { increment: 1 } }
						});
					}

					return newRegistration;
				});

				// Generate QR code
				const qrCodeUrl = generateQRCodeDataURL(checkInCode);

				// Send confirmation email
				try {
					await sendRegistrationConfirmation(registration, event, qrCodeUrl);
				} catch (emailError) {
					console.error("Failed to send confirmation email:", emailError);
					// Don't fail the registration if email sending fails
				}

				return successResponse({
					registrationId: registration.id,
					checkInCode: checkInCode,
					qrCodeUrl: qrCodeUrl,
					referralLink: `${process.env.FRONTEND_URL || 'http://localhost:4321'}/register?ref=${checkInCode}`,
					message: "報名成功！確認信件已發送至您的信箱"
				});
			} catch (error) {
				console.error("Registration submission error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "提交報名失敗", error.message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 表單預驗證
	fastify.post(
		"/registrations/validate",
		{
			schema: {
				description: "表單預驗證（即時驗證）",
				tags: ["registrations"],
				body: {
					type: 'object',
					properties: {
						ticketId: {
							type: 'string',
							description: '票種 ID'
						},
						formData: {
							type: 'object',
							description: '表單資料',
							additionalProperties: true
						}
					},
					required: ['ticketId', 'formData']
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
									isValid: { type: 'boolean' },
									errors: { type: 'object' }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { ticketId, formData } = request.body;

				if (!ticketId || !formData) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "票種ID和表單資料為必填");
					return reply.code(statusCode).send(response);
				}

				// Get form fields for this ticket
				const ticketFields = await prisma.ticketFormField.findMany({
					where: { ticketId },
					include: { field: true }
				});

				if (ticketFields.length === 0) {
					const { response, statusCode } = errorResponse("NOT_FOUND", "找不到票種表單欄位");
					return reply.code(statusCode).send(response);
				}

				// Prepare form fields for validation
				const formFields = ticketFields.map(tf => ({
					...tf.field,
					isRequired: tf.isRequired
				}));

				// Validate form data
				const validationErrors = validateFormData(formData, formFields);

				return successResponse({
					isValid: !validationErrors,
					errors: validationErrors || {}
				});
			} catch (error) {
				console.error("Registration validation error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "表單驗證失敗", error.message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}