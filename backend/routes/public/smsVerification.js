/**
 * @fileoverview SMS verification routes
 */

import prisma from "#config/database.js";
import { auth } from "#lib/auth.js";
import { sendVerificationCode, generateVerificationCode } from "#lib/sms.js";
import { notFoundResponse, serverErrorResponse, successResponse, unauthorizedResponse, validationErrorResponse } from "#utils/response.js";
import { sanitizeText } from "#utils/sanitize.js";

/**
 * SMS verification routes
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
export default async function smsVerificationRoutes(fastify, options) {
	// Apply preHandler if provided
	if (options.preHandler) {
		fastify.addHook("preHandler", options.preHandler);
	}

	/**
	 * Send SMS verification code
	 * POST /api/sms-verification/send
	 */
	fastify.post(
		"/sms-verification/send",
		{
			schema: {
				description: "發送簡訊驗證碼",
				tags: ["sms-verification"],
				body: {
					type: "object",
					required: ["phoneNumber", "purpose"],
					properties: {
						phoneNumber: { type: "string", pattern: "^09\\d{8}$" },
						purpose: { type: "string", enum: ["ticket_access", "phone_verification"] },
						ticketId: { type: "string" },
						locale: { type: "string", enum: ["zh-Hant", "zh-Hans", "en"] }
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const session = await auth.api.getSession({
					headers: request.headers
				});

				if (!session?.user) {
					const { response, statusCode } = unauthorizedResponse("請先登入");
					return reply.code(statusCode).send(response);
				}

				const { phoneNumber, purpose, ticketId, locale = "zh-Hant" } = request.body;
				const sanitizedPhoneNumber = sanitizeText(phoneNumber);
				const userId = session.user.id;

				// Validate phone number format
				if (!sanitizedPhoneNumber.match(/^09\d{8}$/)) {
					const { response, statusCode } = validationErrorResponse("無效的手機號碼格式，請使用 09xxxxxxxx");
					return reply.code(statusCode).send(response);
				}

				// If purpose is phone_verification, check if user already verified their phone
				if (purpose === "phone_verification") {
					const user = await prisma.user.findUnique({
						where: { id: userId },
						select: { phoneVerified: true }
					});

					if (user?.phoneVerified) {
						const { response, statusCode } = validationErrorResponse("您的手機號碼已經驗證過了");
						return reply.code(statusCode).send(response);
					}

					// Check if phone number is already used by another user
					const existingUser = await prisma.user.findFirst({
						where: {
							phoneNumber: sanitizedPhoneNumber,
							phoneVerified: true,
							id: { not: userId }
						}
					});

					if (existingUser) {
						const { response, statusCode } = validationErrorResponse("此手機號碼已被其他用戶使用");
						return reply.code(statusCode).send(response);
					}
				}

				// If purpose is ticket_access, verify the ticket requires SMS verification
				if (purpose === "ticket_access") {
					if (!ticketId) {
						const { response, statusCode } = validationErrorResponse("票券 ID 為必填欄位");
						return reply.code(statusCode).send(response);
					}

					const ticket = await prisma.ticket.findUnique({
						where: { id: ticketId }
					});

					if (!ticket) {
						const { response, statusCode } = notFoundResponse("票券不存在");
						return reply.code(statusCode).send(response);
					}

					if (!ticket.requireSmsVerification) {
						const { response, statusCode } = validationErrorResponse("此票券不需要簡訊驗證");
						return reply.code(statusCode).send(response);
					}

					// Check if user has registered for this ticket
					const registration = await prisma.registration.findFirst({
						where: {
							userId,
							ticketId,
							status: "confirmed"
						}
					});

					if (!registration) {
						const { response, statusCode } = unauthorizedResponse("您尚未報名此票券");
						return reply.code(statusCode).send(response);
					}
				}

				// Check for existing non-expired verification code (rate limiting)
				const existingCode = await prisma.smsVerification.findFirst({
					where: {
						userId,
						phoneNumber: sanitizedPhoneNumber,
						purpose,
						ticketId: purpose === "ticket_access" ? ticketId : null,
						verified: false,
						expiresAt: {
							gt: new Date()
						},
						createdAt: {
							gt: new Date(Date.now() - 60000) // Within last 1 minute
						}
					}
				});

				if (existingCode) {
					const { response, statusCode } = validationErrorResponse("請稍後再試，驗證碼已發送");
					return reply.code(statusCode).send(response);
				}

				// Check daily rate limit (3 SMS per user per day)
				const todayStart = new Date();
				todayStart.setHours(0, 0, 0, 0);

				const todayEnd = new Date();
				todayEnd.setHours(23, 59, 59, 999);

				const todaySmsCount = await prisma.smsVerification.count({
					where: {
						userId,
						createdAt: {
							gte: todayStart,
							lte: todayEnd
						}
					}
				});

				if (todaySmsCount >= 3) {
					const { response, statusCode } = validationErrorResponse("您今日已達到發送簡訊驗證碼的次數上限（3次），請明天再試");
					return reply.code(statusCode).send(response);
				}

				// Generate 6-digit verification code
				const code = generateVerificationCode();

				// Calculate expiry time (10 minutes from now)
				const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

				// Send SMS
				try {
					await sendVerificationCode(sanitizedPhoneNumber, code, locale);
				} catch (smsError) {
					request.log.error("SMS send error:", smsError);
					const { response, statusCode } = serverErrorResponse("發送簡訊失敗，請稍後再試");
					return reply.code(statusCode).send(response);
				}

				// Store verification code in database
				await prisma.smsVerification.create({
					data: {
						userId,
						phoneNumber: sanitizedPhoneNumber,
						code,
						purpose,
						ticketId: purpose === "ticket_access" ? ticketId : null,
						expiresAt
					}
				});

				return reply.send(
					successResponse(
						{
							expiresAt
						},
						"驗證碼已發送"
					)
				);
			} catch (error) {
				request.log.error("Send SMS verification error:", error);
				const { response, statusCode } = serverErrorResponse("發送驗證碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	/**
	 * Verify SMS code
	 * POST /api/sms-verification/verify
	 */
	fastify.post(
		"/sms-verification/verify",
		{
			schema: {
				description: "驗證簡訊驗證碼",
				tags: ["sms-verification"],
				body: {
					type: "object",
					required: ["phoneNumber", "code", "purpose"],
					properties: {
						phoneNumber: { type: "string", pattern: "^09\\d{8}$" },
						code: { type: "string", pattern: "^\\d{6}$" },
						purpose: { type: "string", enum: ["ticket_access", "phone_verification"] },
						ticketId: { type: "string" }
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const session = await auth.api.getSession({
					headers: request.headers
				});

				if (!session?.user) {
					const { response, statusCode } = unauthorizedResponse("請先登入");
					return reply.code(statusCode).send(response);
				}

				const { phoneNumber, code, purpose, ticketId } = request.body;
				const sanitizedPhoneNumber = sanitizeText(phoneNumber);
				const sanitizedCode = sanitizeText(code);
				const userId = session.user.id;

				// If purpose is phone_verification, check if user already verified their phone
				if (purpose === "phone_verification") {
					const user = await prisma.user.findUnique({
						where: { id: userId },
						select: { phoneVerified: true }
					});

					if (user?.phoneVerified) {
						const { response, statusCode } = validationErrorResponse("您的手機號碼已經驗證過了");
						return reply.code(statusCode).send(response);
					}
				}

				// Find verification record
				const verification = await prisma.smsVerification.findFirst({
					where: {
						userId,
						phoneNumber: sanitizedPhoneNumber,
						code: sanitizedCode,
						purpose,
						ticketId: purpose === "ticket_access" ? ticketId : null,
						verified: false
					},
					orderBy: {
						createdAt: "desc"
					}
				});

				if (!verification) {
					const { response, statusCode } = validationErrorResponse("驗證碼錯誤或不存在");
					return reply.code(statusCode).send(response);
				}

				// Check if code has expired
				if (new Date() > verification.expiresAt) {
					const { response, statusCode } = validationErrorResponse("驗證碼已過期，請重新發送");
					return reply.code(statusCode).send(response);
				}

				// If purpose is phone_verification, check if phone is already used by another user before verifying
				if (purpose === "phone_verification") {
					const existingUser = await prisma.user.findFirst({
						where: {
							phoneNumber: sanitizedPhoneNumber,
							phoneVerified: true,
							id: { not: userId }
						}
					});

					if (existingUser) {
						const { response, statusCode } = validationErrorResponse("此手機號碼已被其他用戶使用");
						return reply.code(statusCode).send(response);
					}
				}

				// Mark verification as verified
				await prisma.smsVerification.update({
					where: { id: verification.id },
					data: { verified: true }
				});

				// If purpose is phone_verification, update user's phone verification status
				if (purpose === "phone_verification") {
					await prisma.user.update({
						where: { id: userId },
						data: {
							phoneNumber: sanitizedPhoneNumber,
							phoneVerified: true
						}
					});
				}

				return reply.send(
					successResponse(
						{
							verified: true,
							purpose,
							ticketId: verification.ticketId
						},
						"驗證成功"
					)
				);
			} catch (error) {
				request.log.error("Verify SMS code error:", error);
				const { response, statusCode } = serverErrorResponse("驗證失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	/**
	 * Check if user needs SMS verification for a ticket
	 * GET /api/sms-verification/check/:ticketId
	 */
	fastify.get(
		"/sms-verification/check/:ticketId",
		{
			schema: {
				description: "檢查票券是否需要簡訊驗證",
				tags: ["sms-verification"],
				params: {
					type: "object",
					properties: {
						ticketId: { type: "string" }
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const session = await auth.api.getSession({
					headers: request.headers
				});

				if (!session?.user) {
					const { response, statusCode } = unauthorizedResponse("請先登入");
					return reply.code(statusCode).send(response);
				}

				const { ticketId } = request.params;
				const userId = session.user.id;

				// Get ticket info
				const ticket = await prisma.ticket.findUnique({
					where: { id: ticketId }
				});

				if (!ticket) {
					const { response, statusCode } = notFoundResponse("票券不存在");
					return reply.code(statusCode).send(response);
				}

				// If ticket doesn't require SMS verification
				if (!ticket.requireSmsVerification) {
					return reply.send(
						successResponse({
							requiresVerification: false,
							isVerified: true
						})
					);
				}

				// Check if user has a verified SMS code for this ticket
				const verification = await prisma.smsVerification.findFirst({
					where: {
						userId,
						purpose: "ticket_access",
						ticketId,
						verified: true,
						expiresAt: {
							gt: new Date()
						}
					}
				});

				return reply.send(
					successResponse({
						requiresVerification: true,
						isVerified: !!verification,
						phoneNumber: verification?.phoneNumber
					})
				);
			} catch (error) {
				request.log.error("Check SMS verification error:", error);
				const { response, statusCode } = serverErrorResponse("檢查驗證狀態失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	/**
	 * Get user's phone verification status
	 * GET /api/sms-verification/status
	 */
	fastify.get(
		"/sms-verification/status",
		{
			schema: {
				description: "取得用戶的手機驗證狀態",
				tags: ["sms-verification"]
			}
		},
		async (request, reply) => {
			try {
				const session = await auth.api.getSession({
					headers: request.headers
				});

				if (!session?.user) {
					const { response, statusCode } = unauthorizedResponse("請先登入");
					return reply.code(statusCode).send(response);
				}

				const userId = session.user.id;

				// Get user info
				const user = await prisma.user.findUnique({
					where: { id: userId },
					select: {
						phoneNumber: true,
						phoneVerified: true
					}
				});

				return reply.send(
					successResponse({
						phoneNumber: user?.phoneNumber,
						phoneVerified: user?.phoneVerified || false
					})
				);
			} catch (error) {
				request.log.error("Get SMS verification status error:", error);
				const { response, statusCode } = serverErrorResponse("取得驗證狀態失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}
