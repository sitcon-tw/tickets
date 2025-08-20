import prisma from "../../config/database.js";
import { errorResponse, successResponse } from "../../utils/response.js";
import { sendRegistrationConfirmation, sendEditLink } from "../../utils/email.js";
import { generateCheckInCode, generateQRCodeDataURL } from "../../utils/qrcode.js";
import { validateFormData } from "../../utils/validation.js";
import { generateEditToken, hashToken, createEditTokenExpiry, isTokenExpired } from "../../utils/token.js";

export default async function registrationsRoutes(fastify, options) {
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
							data: {
								type: 'object',
								properties: {
									registrationId: { type: 'string' },
									checkInCode: { type: 'string' },
									qrCodeUrl: { type: 'string' },
									referralLink: { type: 'string' },
									message: { type: 'string' }
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

	// 請求編輯連結
	fastify.post(
		"/registrations/request-edit",
		{
			schema: {
				description: "請求編輯連結（整合 Better Auth 的 email 驗證）",
				tags: ["registrations"],
				body: {
					type: 'object',
					properties: {
						email: {
							type: 'string',
							format: 'email',
							description: '電子信箱'
						},
						orderNumber: {
							type: 'string',
							description: '訂單編號或報到碼'
						},
						identifyField: {
							type: 'string',
							enum: ['orderNumber', 'checkInCode'],
							description: '識別欄位類型'
						}
					},
					required: ['email']
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							data: {
								type: 'object',
								properties: {
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
				const { email, orderNumber, identifyField = "orderNumber" } = request.body;

				if (!email) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "Email為必填欄位");
					return reply.code(statusCode).send(response);
				}

				// Rate limiting check
				const oneHourAgo = new Date();
				oneHourAgo.setHours(oneHourAgo.getHours() - 1);

				// Find registration based on identify field
				let whereCondition = { email: email };
				if (identifyField === "orderNumber" && orderNumber) {
					whereCondition.id = orderNumber;
				} else if (identifyField === "checkInCode" && orderNumber) {
					whereCondition.referralCode = orderNumber;
				}

				const registration = await prisma.registration.findFirst({
					where: {
						...whereCondition,
						status: { not: 'cancelled' }
					},
					include: {
						event: true
					}
				});

				if (!registration) {
					const { response, statusCode } = errorResponse("NOT_FOUND", "找不到符合的報名記錄");
					return reply.code(statusCode).send(response);
				}

				// Check if edit module is enabled (could be stored in system settings)
				// For now, assume it's always enabled

				// Check rate limiting - max 3 requests per hour
				const recentRequests = await prisma.registration.findMany({
					where: {
						email: email,
						updatedAt: {
							gte: oneHourAgo
						}
					}
				});

				if (recentRequests.length >= 3) {
					const { response, statusCode } = errorResponse("RATE_LIMIT", "請求過於頻繁，請稍後再試");
					return reply.code(statusCode).send(response);
				}

				// Generate edit token
				const editToken = generateEditToken();
				const hashedToken = hashToken(editToken);
				const tokenExpiry = createEditTokenExpiry(30); // 30 minutes

				// Update registration with edit token
				await prisma.registration.update({
					where: { id: registration.id },
					data: {
						editToken: hashedToken,
						editTokenExpiry: tokenExpiry,
						updatedAt: new Date()
					}
				});

				// Send edit link email
				try {
					await sendEditLink(email, editToken, registration.event);
				} catch (emailError) {
					console.error("Failed to send edit link email:", emailError);
					const { response, statusCode } = errorResponse("EMAIL_ERROR", "發送編輯連結失敗");
					return reply.code(statusCode).send(response);
				}

				return successResponse({ message: "編輯連結已發送到您的信箱" });
			} catch (error) {
				console.error("Request edit error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "請求編輯連結失敗", error.message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 驗證編輯 token
	fastify.get(
		"/registrations/verify-edit",
		{
			schema: {
				description: "驗證編輯 token（Better Auth 驗證流程）",
				tags: ["registrations"],
				querystring: {
					type: 'object',
					properties: {
						token: {
							type: 'string',
							description: '驗證 token'
						}
					},
					required: ['token']
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							data: {
								type: 'object',
								properties: {
									isValid: { type: 'boolean' },
									registrationId: { type: 'string' }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { token } = request.query;

				if (!token) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "驗證 token 為必填");
					return reply.code(statusCode).send(response);
				}

				// Hash the provided token to compare with stored hash
				const hashedToken = hashToken(token);

				// Find registration with this token
				const registration = await prisma.registration.findFirst({
					where: {
						editToken: hashedToken,
						status: { not: 'cancelled' }
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

				return successResponse({ 
					isValid: true,
					registrationId: registration.id
				});
			} catch (error) {
				console.error("Verify edit token error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "驗證編輯 token 失敗", error.message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 透過驗證後進入編輯頁面
	fastify.get(
		"/registrations/edit/:token",
		{
			schema: {
				description: "透過驗證後進入編輯頁面",
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
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							data: {
								type: 'object',
								properties: {
									registration: {
										type: 'object',
										properties: {
											id: { type: 'string' },
											email: { type: 'string' },
											status: { type: 'string' },
											checkInCode: { type: 'string' }
										}
									},
									formFields: {
										type: 'array',
										items: { type: 'object' }
									},
									currentFormData: { type: 'object' }
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
						ticket: true,
						registrationData: {
							include: {
								field: true
							}
						}
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

				// Get editable form fields for this ticket
				const ticketFields = await prisma.ticketFormField.findMany({
					where: { ticketId: registration.ticketId },
					include: { field: true }
				});

				// Build current form data
				const currentFormData = {};
				registration.registrationData.forEach(data => {
					try {
						currentFormData[data.field.name] = JSON.parse(data.value);
					} catch {
						currentFormData[data.field.name] = data.value;
					}
				});

				// Add basic registration data
				currentFormData.email = registration.email;
				if (registration.phone) currentFormData.phone = registration.phone;

				return successResponse({
					registration: {
						id: registration.id,
						email: registration.email,
						phone: registration.phone,
						status: registration.status,
						checkInCode: registration.referralCode,
						event: registration.event,
						ticket: registration.ticket
					},
					formFields: ticketFields.map(tf => ({
						...tf.field,
						isRequired: tf.isRequired,
						isVisible: tf.isVisible
					})),
					currentFormData
				});
			} catch (error) {
				console.error("Get edit registration error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "載入編輯頁面失敗", error.message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 提交編輯後的資料
	fastify.put(
		"/registrations/edit/:token",
		{
			schema: {
				description: "提交編輯後的資料",
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
						formData: {
							type: 'object',
							description: '更新後的表單資料',
							additionalProperties: true
						}
					},
					required: ['formData']
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							data: {
								type: 'object',
								properties: {
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
				const { formData } = request.body;

				if (!formData) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "表單資料為必填");
					return reply.code(statusCode).send(response);
				}

				// Hash the provided token to compare with stored hash
				const hashedToken = hashToken(token);

				// Find registration with this token
				const registration = await prisma.registration.findFirst({
					where: {
						editToken: hashedToken,
						status: { not: 'cancelled' }
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

				// Get form fields for validation
				const ticketFields = await prisma.ticketFormField.findMany({
					where: { ticketId: registration.ticketId },
					include: { field: true }
				});

				// Prepare form fields for validation
				const formFields = ticketFields.map(tf => ({
					...tf.field,
					isRequired: tf.isRequired
				}));

				// Validate form data
				const validationErrors = validateFormData(formData, formFields);

				if (validationErrors) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "表單驗證失敗", validationErrors);
					return reply.code(statusCode).send(response);
				}

				// Update registration with transaction
				await prisma.$transaction(async (tx) => {
					// Update basic registration data
					await tx.registration.update({
						where: { id: registration.id },
						data: {
							email: formData.email || registration.email,
							phone: formData.phone || registration.phone,
							// Clear edit token after successful edit (one-time use)
							editToken: null,
							editTokenExpiry: null
						}
					});

					// Update form data
					for (const ticketField of ticketFields) {
						const fieldValue = formData[ticketField.field.name];
						if (fieldValue !== undefined) {
							// Upsert registration data
							await tx.registrationData.upsert({
								where: {
									registrationId_fieldId: {
										registrationId: registration.id,
										fieldId: ticketField.fieldId
									}
								},
								update: {
									value: typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue)
								},
								create: {
									registrationId: registration.id,
									fieldId: ticketField.fieldId,
									value: typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue)
								}
							});
						}
					}
				});

				return successResponse({ message: "報名資料更新成功" });
			} catch (error) {
				console.error("Update registration error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新報名資料失敗", error.message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

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
							data: {
								type: 'object',
								properties: {
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

	// 獲取專屬推薦連結
	fastify.get(
		"/registrations/:regId/referral-link",
		{
			schema: {
				description: "獲取專屬推薦連結",
				tags: ["referrals"],
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
							data: {
								type: 'object',
								properties: {
									referralLink: { type: 'string' },
									referralCode: { type: 'string' },
									eventId: { type: 'string' }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { regId } = request.params;

				// Find registration
				const registration = await prisma.registration.findFirst({
					where: {
						id: regId,
						status: 'confirmed'
					},
					include: {
						event: true
					}
				});

				if (!registration) {
					const { response, statusCode } = errorResponse("NOT_FOUND", "找不到符合的報名記錄");
					return reply.code(statusCode).send(response);
				}

				// Use the registration's referral code (check-in code) as the referral identifier
				const referralCode = registration.referralCode;
				const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
				const referralLink = `${baseUrl}/register?ref=${referralCode}`;

				return successResponse({
					referralLink: referralLink,
					referralCode: referralCode,
					eventId: registration.eventId
				});
			} catch (error) {
				console.error("Get referral link error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取推薦連結失敗", error.message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 獲取個人推薦統計
	fastify.get(
		"/registrations/referral-stats/:regId",
		{
			schema: {
				description: "獲取個人推薦統計",
				tags: ["referrals"],
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
							data: {
								type: 'object',
								properties: {
									totalReferrals: { type: 'integer' },
									successfulReferrals: { type: 'integer' },
									referralList: {
										type: 'array',
										items: {
											type: 'object',
											properties: {
												id: { type: 'string' },
												status: { type: 'string' },
												ticketName: { type: 'string' },
												registeredAt: { type: 'string', format: 'date-time' },
												email: { type: 'string' }
											}
										}
									},
									referrerInfo: {
										type: 'object',
										properties: {
											id: { type: 'string' },
											checkInCode: { type: 'string' },
											email: { type: 'string' }
										}
									}
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { regId } = request.params;

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

				// Get all referrals made by this registration
				const referrals = await prisma.registration.findMany({
					where: {
						referredBy: registration.id
					},
					include: {
						ticket: true
					},
					orderBy: {
						createdAt: 'desc'
					}
				});

				// Count successful referrals (confirmed registrations)
				const successfulReferrals = referrals.filter(r => r.status === 'confirmed');

				// Build referral list with anonymized data for privacy
				const referralList = referrals.map(referral => ({
					id: referral.id,
					status: referral.status,
					ticketName: referral.ticket.name,
					registeredAt: referral.createdAt,
					// Don't expose email or other personal info
					email: referral.email.replace(/(.{2}).*(@.*)/, '$1***$2') // Partially hide email
				}));

				return successResponse({
					totalReferrals: referrals.length,
					successfulReferrals: successfulReferrals.length,
					referralList: referralList,
					referrerInfo: {
						id: registration.id,
						checkInCode: registration.referralCode,
						email: registration.email.replace(/(.{2}).*(@.*)/, '$1***$2')
					}
				});
			} catch (error) {
				console.error("Get referral stats error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取推薦統計失敗", error.message, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}
