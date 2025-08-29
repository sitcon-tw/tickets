import prisma from "#config/database.js";
import { errorResponse, successResponse } from "#utils/response.js";
import { sendEditLink } from "#utils/email.js";
import { generateEditToken, hashToken, createEditTokenExpiry, isTokenExpired } from "#utils/token.js";
import { validateFormData } from "#utils/validation.js";

export default async function editingRoutes(fastify, options) {
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
					},
					429: {
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
							message: { type: 'string' },
							data: {
								type: 'object',
								properties: {
									isValid: { type: 'boolean' },
									registrationId: { type: 'string' }
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
							message: { type: 'string' },
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
}