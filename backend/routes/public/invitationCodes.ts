import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { publicInvitationCodeSchemas } from "#schemas";
import { logger } from "#utils/logger";
import { notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";
import { LocalizedTextSchema } from "@sitcontix/types";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const componentLogger = logger.child({ component: "public/invitationCodes" });

const invitationCodesRoutes: FastifyPluginAsync = async fastify => {
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/invitation-codes/verify",
		{
			schema: publicInvitationCodeSchemas.verifyInvitationCode
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.invitation_codes.verify");

			try {
				const { code, ticketId } = request.body;

				// Mask invitation code for security (show only first 2 and last 2 chars)
				const maskedCode = code && code.length > 4 ? `${code.slice(0, 2)}****${code.slice(-2)}` : "****";
				span.setAttribute("invitation_code.masked", maskedCode);
				span.setAttribute("ticket.id", ticketId);

				if (!code || !ticketId) {
					span.addEvent("validation.failed", {
						"error.reason": "missing_required_fields"
					});
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Validation error" });
					const { response, statusCode } = validationErrorResponse("邀請碼和票券 ID 為必填");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("ticket.lookup");
				const ticket = await prisma.ticket.findUnique({
					where: {
						id: ticketId,
						isActive: true
					}
				});

				if (!ticket) {
					span.addEvent("validation.result", {
						result: "invalid_ticket"
					});
					span.setStatus({ code: SpanStatusCode.OK });
					return reply.send(
						successResponse({
							valid: false,
							message: "票券不存在或已關閉"
						})
					);
				}

				// Add event context
				span.setAttribute("event.id", ticket.eventId);

				span.addEvent("invitation_code.lookup");
				const invitationCode = await prisma.invitationCode.findFirst({
					where: {
						code,
						ticketId,
						isActive: true
					}
				});

				if (!invitationCode) {
					span.addEvent("validation.result", {
						result: "code_not_found"
					});
					span.setStatus({ code: SpanStatusCode.OK });
					return reply.send(
						successResponse({
							valid: false,
							message: "邀請碼不存在"
						})
					);
				}

				span.setAttribute("invitation_code.id", invitationCode.id);
				span.setAttribute("invitation_code.usage_count", invitationCode.usedCount);
				span.setAttribute("invitation_code.usage_limit", invitationCode.usageLimit || -1);

				const now = new Date();
				if (invitationCode.validUntil && now > invitationCode.validUntil) {
					span.addEvent("validation.result", {
						result: "expired",
						valid_until: invitationCode.validUntil.toISOString()
					});
					span.setStatus({ code: SpanStatusCode.OK });
					return reply.send(
						successResponse({
							valid: false,
							message: "邀請碼已過期"
						})
					);
				}

				if (invitationCode.validFrom && now < invitationCode.validFrom) {
					span.addEvent("validation.result", {
						result: "not_yet_valid",
						valid_from: invitationCode.validFrom.toISOString()
					});
					span.setStatus({ code: SpanStatusCode.OK });
					return reply.send(
						successResponse({
							valid: false,
							message: "邀請碼尚未生效"
						})
					);
				}

				if (invitationCode.usageLimit && invitationCode.usedCount >= invitationCode.usageLimit) {
					span.addEvent("validation.result", {
						result: "usage_limit_exceeded"
					});
					span.setStatus({ code: SpanStatusCode.OK });
					return reply.send(
						successResponse({
							valid: false,
							message: "邀請碼已達使用上限"
						})
					);
				}

				span.addEvent("tickets.lookup");
				const tickets = await prisma.ticket.findMany({
					where: {
						id: ticketId,
						isActive: true
					},
					select: {
						id: true,
						name: true,
						description: true,
						price: true,
						quantity: true,
						soldCount: true,
						saleStart: true,
						saleEnd: true,
						isActive: true
					},
					orderBy: { createdAt: "asc" }
				});

				const availableTickets = tickets
					.map(ticket => {
						const available = ticket.quantity - ticket.soldCount;
						const isOnSale = (!ticket.saleStart || now >= ticket.saleStart) && (!ticket.saleEnd || now <= ticket.saleEnd) && ticket.isActive && available > 0;

						return {
							...ticket,
							available,
							isOnSale
						};
					})
					.filter(ticket => ticket.isOnSale);

				span.setAttribute("available_tickets.count", availableTickets.length);
				span.addEvent("validation.result", {
					result: "valid"
				});
				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(
					successResponse({
						valid: true,
						invitationCode: {
							id: invitationCode.id,
							code: invitationCode.code,
							name: invitationCode.name,
							usedCount: invitationCode.usedCount,
							usageLimit: invitationCode.usageLimit,
							validFrom: invitationCode.validFrom,
							validUntil: invitationCode.validUntil,
							ticketId: invitationCode.ticketId
						},
						availableTickets: availableTickets.map(ticket => ({
							...ticket,
							name: LocalizedTextSchema.parse(ticket.name),
							description: LocalizedTextSchema.nullable().parse(ticket.description)
						}))
					})
				);
			} catch (error) {
				componentLogger.error({ error }, "Verify invitation code error");
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to verify invitation code" });
				const { response, statusCode } = serverErrorResponse("驗證邀請碼失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/invitation-codes/:code/info",
		{
			schema: publicInvitationCodeSchemas.getInvitationCodeInfo
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.invitation_codes.get_info");

			try {
				const { code } = request.params;
				const { ticketId } = request.query;

				// Mask invitation code for security
				const maskedCode = code && code.length > 4 ? `${code.slice(0, 2)}****${code.slice(-2)}` : "****";
				span.setAttribute("invitation_code.masked", maskedCode);
				span.setAttribute("ticket.id", ticketId);

				span.addEvent("invitation_code.lookup");
				const invitationCode = await prisma.invitationCode.findFirst({
					where: {
						code,
						ticketId,
						isActive: true
					},
					select: {
						id: true,
						code: true,
						name: true,
						usedCount: true,
						usageLimit: true,
						validFrom: true,
						validUntil: true,
						ticket: {
							select: {
								event: {
									select: {
										name: true,
										startDate: true,
										endDate: true
									}
								}
							}
						}
					}
				});

				if (!invitationCode) {
					span.addEvent("invitation_code.not_found");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Invitation code not found" });
					const { response, statusCode } = notFoundResponse("邀請碼不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("invitation_code.id", invitationCode.id);
				span.setAttribute("invitation_code.usage_count", invitationCode.usedCount);
				span.setAttribute("invitation_code.usage_limit", invitationCode.usageLimit || -1);

				const now = new Date();
				const isExpired = !!(invitationCode.validUntil && now > invitationCode.validUntil);
				const isNotYetValid = !!(invitationCode.validFrom && now < invitationCode.validFrom);
				const isUsageExceeded = !!(invitationCode.usageLimit && invitationCode.usedCount >= invitationCode.usageLimit);

				if (isExpired) {
					span.addEvent("validation.result", {
						result: "expired"
					});
				} else if (isNotYetValid) {
					span.addEvent("validation.result", {
						result: "not_yet_valid"
					});
				} else if (isUsageExceeded) {
					span.addEvent("validation.result", {
						result: "usage_limit_exceeded"
					});
				} else {
					span.addEvent("validation.result", {
						result: "valid"
					});
				}

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(
					successResponse({
						...invitationCode,
						isValid: !isExpired && !isNotYetValid && !isUsageExceeded,
						isExpired,
						isNotYetValid,
						isUsageExceeded,
						remainingUses: invitationCode.usageLimit ? Math.max(0, invitationCode.usageLimit - invitationCode.usedCount) : null
					})
				);
			} catch (error) {
				componentLogger.error({ error }, "Get invitation code info error");
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to get invitation code info" });
				const { response, statusCode } = serverErrorResponse("取得邀請碼資訊失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);
};

export default invitationCodesRoutes;
