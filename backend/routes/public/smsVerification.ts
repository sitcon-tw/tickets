import prisma from "#config/database";
import { auth } from "#lib/auth";
import { generateVerificationCode, sendVerificationCode } from "#lib/sms";
import { tracer } from "#lib/tracing";
import { getClientIP, validateTurnstile } from "#lib/turnstile";
import { requireAuth } from "#middleware/auth";
import { Prisma } from "#prisma/generated/prisma";
import { smsVerificationSchemas } from "#schemas";
import { serverErrorResponse, successResponse, unauthorizedResponse, validationErrorResponse } from "#utils/response";
import { sanitizeText } from "#utils/sanitize";
import { SpanStatusCode } from "@opentelemetry/api";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const smsVerificationRoutes: FastifyPluginAsync = async fastify => {
	fastify.addHook("preHandler", requireAuth);

	/**
	 * Send SMS verification code
	 * POST /api/sms-verification/send
	 */
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/sms-verification/send",
		{
			schema: smsVerificationSchemas.send
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.sms_verification.send");

			try {
				const session = await auth.api.getSession({
					headers: request.headers as unknown as Headers
				});

				if (!session?.user) {
					span.addEvent("sms_verification.unauthorized");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Unauthorized" });
					const { response, statusCode } = unauthorizedResponse("請先登入");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("auth.user.id", session.user.id);

				const { phoneNumber, locale = "zh-Hant", turnstileToken } = request.body;
				const sanitizedPhoneNumber = sanitizeText(phoneNumber);
				const userId = session.user.id;

				const maskedPhone = sanitizedPhoneNumber.length > 4 ? `****${sanitizedPhoneNumber.slice(-4)}` : "****";
				span.setAttribute("sms.phone.masked", maskedPhone);
				span.setAttribute("sms.locale", locale);

				// Validate Turnstile token
				span.addEvent("sms_verification.turnstile_validation_start");
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
					span.addEvent("sms_verification.turnstile_failed", {
						reason: turnstileResult.reason || "unknown"
					});
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Turnstile validation failed" });
					const { response, statusCode } = validationErrorResponse("驗證失敗，請重新整理頁面再試");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("sms_verification.turnstile_validated");

				if (!sanitizedPhoneNumber.match(/^09\d{8}$/)) {
					span.addEvent("sms_verification.invalid_phone_format");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Invalid phone format" });
					const { response, statusCode } = validationErrorResponse("無效的手機號碼格式，請使用 09xxxxxxxx");
					return reply.code(statusCode).send(response);
				}

				const user = await prisma.user.findUnique({
					where: { id: userId },
					select: { phoneVerified: true }
				});

				if (user?.phoneVerified) {
					span.addEvent("sms_verification.already_verified");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Phone already verified" });
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
					span.addEvent("sms_verification.phone_in_use");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Phone number in use" });
					const { response, statusCode } = validationErrorResponse("此手機號碼已被其他用戶使用");
					return reply.code(statusCode).send(response);
				}

				const code = generateVerificationCode();
				const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
				span.setAttribute("sms.code.length", code.length);

				span.addEvent("sms_verification.rate_limit_check_start");
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
					span.addEvent("sms_verification.rate_limited", {
						error: rateLimitResult.error
					});
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Rate limited" });
					const { response, statusCode } = validationErrorResponse(rateLimitResult.error);
					return reply.code(statusCode).send(response);
				}

				span.addEvent("sms_verification.rate_limit_passed");

				// Track SMS send attempt number for the user
				const todayStart = new Date();
				todayStart.setHours(0, 0, 0, 0);
				const todayEnd = new Date();
				todayEnd.setHours(23, 59, 59, 999);
				const attemptCount = await prisma.smsVerification.count({
					where: {
						userId: session.user.id,
						createdAt: {
							gte: todayStart,
							lte: todayEnd
						}
					}
				});
				span.setAttribute("sms_verification.attempt_number", attemptCount + 1);

				try {
					span.addEvent("sms_verification.send_start");
					await sendVerificationCode(sanitizedPhoneNumber, code, locale);
					span.addEvent("sms_verification.send_complete");
				} catch (smsError) {
					request.log.error({ error: smsError }, "SMS send error");
					span.recordException(smsError as Error);
					span.addEvent("sms_verification.send_failed");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "SMS send failed" });
					const { response, statusCode } = serverErrorResponse("發送簡訊失敗，請稍後再試");
					return reply.code(statusCode).send(response);
				}

				span.setStatus({ code: SpanStatusCode.OK });
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
						span.addEvent("sms_verification.transaction_conflict");
						span.setStatus({ code: SpanStatusCode.ERROR, message: "Transaction conflict" });
						const { response, statusCode } = validationErrorResponse("系統繁忙，請稍後再試");
						return reply.code(statusCode).send(response);
					}
				}

				request.log.error({ error }, "Send SMS verification error");
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to send SMS verification" });
				const { response, statusCode } = serverErrorResponse("發送驗證碼失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	/**
	 * Verify SMS code
	 * POST /api/sms-verification/verify
	 */
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/sms-verification/verify",
		{
			schema: smsVerificationSchemas.verify
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.sms_verification.verify");

			try {
				const session = await auth.api.getSession({
					headers: request.headers as unknown as Headers
				});

				if (!session?.user) {
					span.addEvent("sms_verification.unauthorized");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Unauthorized" });
					const { response, statusCode } = unauthorizedResponse("請先登入");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("auth.user.id", session.user.id);

				const { phoneNumber, code } = request.body;
				const sanitizedPhoneNumber = sanitizeText(phoneNumber);
				const sanitizedCode = sanitizeText(code);
				const userId = session.user.id;

				const maskedPhone = sanitizedPhoneNumber.length > 4 ? `****${sanitizedPhoneNumber.slice(-4)}` : "****";
				span.setAttribute("sms.phone.masked", maskedPhone);
				span.setAttribute("sms.code.length", sanitizedCode.length);

				const user = await prisma.user.findUnique({
					where: { id: userId },
					select: { phoneVerified: true }
				});

				if (user?.phoneVerified) {
					span.addEvent("sms_verification.already_verified");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Phone already verified" });
					const { response, statusCode } = validationErrorResponse("您的手機號碼已經驗證過了");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("sms_verification.lookup_code");
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
					span.addEvent("sms_verification.code_not_found");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Code not found" });
					const { response, statusCode } = validationErrorResponse("驗證碼錯誤或不存在");
					return reply.code(statusCode).send(response);
				}

				if (new Date() > verification.expiresAt) {
					span.addEvent("sms_verification.code_expired");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Code expired" });
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
					span.addEvent("sms_verification.phone_in_use");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Phone number in use" });
					const { response, statusCode } = validationErrorResponse("此手機號碼已被其他用戶使用");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("sms_verification.update_verification");
				await prisma.smsVerification.update({
					where: { id: verification.id },
					data: { verified: true }
				});

				span.addEvent("sms_verification.update_user");
				await prisma.user.update({
					where: { id: userId },
					data: {
						phoneNumber: sanitizedPhoneNumber,
						phoneVerified: true
					}
				});

				span.setStatus({ code: SpanStatusCode.OK });
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
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to verify SMS code" });
				const { response, statusCode } = serverErrorResponse("驗證失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	/**
	 * Get user's phone verification status
	 * GET /api/sms-verification/status
	 */
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/sms-verification/status",
		{
			schema: smsVerificationSchemas.status
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.sms_verification.get_status");

			try {
				const session = await auth.api.getSession({
					headers: request.headers as unknown as Headers
				});

				if (!session?.user) {
					span.addEvent("sms_verification.unauthorized");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Unauthorized" });
					const { response, statusCode } = unauthorizedResponse("請先登入");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("auth.user.id", session.user.id);
				const userId = session.user.id;

				const user = await prisma.user.findUnique({
					where: { id: userId },
					select: {
						phoneNumber: true,
						phoneVerified: true
					}
				});

				span.setAttribute("sms.phone_verified", user?.phoneVerified || false);
				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(
					successResponse({
						phoneNumber: user?.phoneNumber,
						phoneVerified: user?.phoneVerified || false
					})
				);
			} catch (error) {
				request.log.error({ error }, "Get SMS verification status error");
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to get SMS verification status" });
				const { response, statusCode } = serverErrorResponse("取得驗證狀態失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);
};

export default smsVerificationRoutes;
