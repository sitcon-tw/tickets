import prisma from "#config/database";
import { auth } from "#lib/auth";
import { generateVerificationCode, sendVerificationCode } from "#lib/sms";
import { getClientIP, validateTurnstile } from "#lib/turnstile";
import { requireAuth } from "#middleware/auth";
import { Prisma } from "#prisma/generated/prisma";
import { smsVerificationSchemas } from "#schemas";
import { serverErrorResponse, successResponse, unauthorizedResponse, validationErrorResponse } from "#utils/response";
import { sanitizeText } from "#utils/sanitize";
import type { SendVerificationRequest, VerifyCodeRequest } from "@sitcontix/types";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

const smsVerificationRoutes: FastifyPluginAsync = async fastify => {
	fastify.addHook("preHandler", requireAuth);

	/**
	 * Send SMS verification code
	 * POST /api/sms-verification/send
	 */
	fastify.post(
		"/sms-verification/send",
		{
			schema: smsVerificationSchemas.send
		},
		async (request: FastifyRequest<{ Body: SendVerificationRequest }>, reply: FastifyReply) => {
			try {
				const session = await auth.api.getSession({
					headers: request.headers as unknown as Headers
				});

				if (!session?.user) {
					const { response, statusCode } = unauthorizedResponse("請先登入");
					return reply.code(statusCode).send(response);
				}

				const { phoneNumber, locale = "zh-Hant", turnstileToken } = request.body;
				const sanitizedPhoneNumber = sanitizeText(phoneNumber);
				const userId = session.user.id;

				// Validate Turnstile token
				const clientIP = getClientIP(request.headers);
				const turnstileResult = await validateTurnstile(turnstileToken, {
					remoteip: clientIP,
					expectedAction: "sms-verification"
				});

				if (!turnstileResult.valid) {
					request.log.warn(
						{
							reason: turnstileResult.reason,
							errors: turnstileResult.errors,
							ip: clientIP
						},
						"Turnstile validation failed"
					);
					const { response, statusCode } = validationErrorResponse("驗證失敗，請重新整理頁面再試");
					return reply.code(statusCode).send(response);
				}

				if (!sanitizedPhoneNumber.match(/^09\d{8}$/)) {
					const { response, statusCode } = validationErrorResponse("無效的手機號碼格式，請使用 09xxxxxxxx");
					return reply.code(statusCode).send(response);
				}

				const user = await prisma.user.findUnique({
					where: { id: userId },
					select: { phoneVerified: true }
				});

				if (user?.phoneVerified) {
					const { response, statusCode } = validationErrorResponse("您的手機號碼已經驗證過了");
					return reply.code(statusCode).send(response);
				}

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

				const code = generateVerificationCode();
				const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

				const rateLimitResult = await prisma.$transaction(
					async tx => {
						const recentCodePhone = await tx.smsVerification.findFirst({
							where: {
								phoneNumber: sanitizedPhoneNumber,
								createdAt: {
									gt: new Date(Date.now() - 60000)
								}
							},
							orderBy: {
								createdAt: "desc"
							}
						});

						if (recentCodePhone) {
							return { error: "請稍後再試，驗證碼發送間隔需 30 秒" };
						}

						const recentCodeSender = await tx.smsVerification.findFirst({
							where: {
								userId,
								createdAt: {
									gt: new Date(Date.now() - 60000)
								}
							},
							orderBy: {
								createdAt: "desc"
							}
						});

						if (recentCodeSender) {
							return { error: "請稍後再試，驗證碼發送間隔需 30 秒" };
						}

						const todayStart = new Date();
						todayStart.setHours(0, 0, 0, 0);

						const todayEnd = new Date();
						todayEnd.setHours(23, 59, 59, 999);

						const todaySmsCountPhone = await tx.smsVerification.count({
							where: {
								phoneNumber: sanitizedPhoneNumber,
								createdAt: {
									gte: todayStart,
									lte: todayEnd
								}
							}
						});

						if (todaySmsCountPhone >= 3) {
							return { error: "此手機號碼今日已達到發送簡訊驗證碼的次數上限（3 次），請明天再試" };
						}

						const todaySmsCountUser = await tx.smsVerification.count({
							where: {
								userId,
								createdAt: {
									gte: todayStart,
									lte: todayEnd
								}
							}
						});

						if (todaySmsCountUser >= 3) {
							return { error: "您今日已達到發送簡訊驗證碼的次數上限（3 次），請明天再試" };
						}

						await tx.smsVerification.create({
							data: {
								userId,
								phoneNumber: sanitizedPhoneNumber,
								code,
								expiresAt
							}
						});

						return { success: true };
					},
					{ isolationLevel: "Serializable" }
				);

				if ("error" in rateLimitResult) {
					const { response, statusCode } = validationErrorResponse(rateLimitResult.error);
					return reply.code(statusCode).send(response);
				}

				try {
					await sendVerificationCode(sanitizedPhoneNumber, code, locale);
				} catch (smsError) {
					request.log.error({ error: smsError }, "SMS send error");
					const { response, statusCode } = serverErrorResponse("發送簡訊失敗，請稍後再試");
					return reply.code(statusCode).send(response);
				}

				return reply.send(
					successResponse(
						{
							expiresAt
						},
						"驗證碼已發送"
					)
				);
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					const prismaError = error as Prisma.PrismaClientKnownRequestError;
					if (prismaError.code === "P2034") {
						request.log.warn({ error }, "SMS verification transaction conflict detected");
						const { response, statusCode } = validationErrorResponse("系統繁忙，請稍後再試");
						return reply.code(statusCode).send(response);
					}
				}

				request.log.error({ error }, "Send SMS verification error");
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
			schema: smsVerificationSchemas.verify
		},
		async (request: FastifyRequest<{ Body: VerifyCodeRequest }>, reply: FastifyReply) => {
			try {
				const session = await auth.api.getSession({
					headers: request.headers as unknown as Headers
				});

				if (!session?.user) {
					const { response, statusCode } = unauthorizedResponse("請先登入");
					return reply.code(statusCode).send(response);
				}

				const { phoneNumber, code } = request.body;
				const sanitizedPhoneNumber = sanitizeText(phoneNumber);
				const sanitizedCode = sanitizeText(code);
				const userId = session.user.id;

				const user = await prisma.user.findUnique({
					where: { id: userId },
					select: { phoneVerified: true }
				});

				if (user?.phoneVerified) {
					const { response, statusCode } = validationErrorResponse("您的手機號碼已經驗證過了");
					return reply.code(statusCode).send(response);
				}
				const verification = await prisma.smsVerification.findFirst({
					where: {
						userId,
						phoneNumber: sanitizedPhoneNumber,
						code: sanitizedCode,
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

				if (new Date() > verification.expiresAt) {
					const { response, statusCode } = validationErrorResponse("驗證碼已過期，請重新發送");
					return reply.code(statusCode).send(response);
				}

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

				await prisma.smsVerification.update({
					where: { id: verification.id },
					data: { verified: true }
				});

				await prisma.user.update({
					where: { id: userId },
					data: {
						phoneNumber: sanitizedPhoneNumber,
						phoneVerified: true
					}
				});

				return reply.send(
					successResponse(
						{
							verified: true
						},
						"驗證成功"
					)
				);
			} catch (error) {
				request.log.error({ error }, "Verify SMS code error");
				const { response, statusCode } = serverErrorResponse("驗證失敗");
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
			schema: smsVerificationSchemas.status
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				const session = await auth.api.getSession({
					headers: request.headers as unknown as Headers
				});

				if (!session?.user) {
					const { response, statusCode } = unauthorizedResponse("請先登入");
					return reply.code(statusCode).send(response);
				}

				const userId = session.user.id;

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
				request.log.error({ error }, "Get SMS verification status error");
				const { response, statusCode } = serverErrorResponse("取得驗證狀態失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default smsVerificationRoutes;
