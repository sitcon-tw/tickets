import prisma from "#config/database";
import { publicInvitationCodeSchemas } from "#schemas";
import { logger } from "#utils/logger";
import { notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { LocalizedTextSchema } from "@sitcontix/types";

const componentLogger = logger.child({ component: "public/invitationCodes" });

const invitationCodesRoutes: FastifyPluginAsync = async fastify => {
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/invitation-codes/verify",
		{
			schema: publicInvitationCodeSchemas.verifyInvitationCode
		},
		async (request, reply) => {
			try {
				const { code, ticketId } = request.body;

				if (!code || !ticketId) {
					const { response, statusCode } = validationErrorResponse("邀請碼和票券 ID 為必填");
					return reply.code(statusCode).send(response);
				}

				const ticket = await prisma.ticket.findUnique({
					where: {
						id: ticketId,
						isActive: true
					}
				});

				if (!ticket) {
					return reply.send(
						successResponse({
							valid: false,
							message: "票券不存在或已關閉"
						})
					);
				}

				const invitationCode = await prisma.invitationCode.findFirst({
					where: {
						code,
						ticketId,
						isActive: true
					}
				});

				if (!invitationCode) {
					return reply.send(
						successResponse({
							valid: false,
							message: "邀請碼不存在"
						})
					);
				}

				const now = new Date();
				if (invitationCode.validUntil && now > invitationCode.validUntil) {
					return reply.send(
						successResponse({
							valid: false,
							message: "邀請碼已過期"
						})
					);
				}

				if (invitationCode.validFrom && now < invitationCode.validFrom) {
					return reply.send(
						successResponse({
							valid: false,
							message: "邀請碼尚未生效"
						})
					);
				}

				if (invitationCode.usageLimit && invitationCode.usedCount >= invitationCode.usageLimit) {
					return reply.send(
						successResponse({
							valid: false,
							message: "邀請碼已達使用上限"
						})
					);
				}

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
				const { response, statusCode } = serverErrorResponse("驗證邀請碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/invitation-codes/:code/info",
		{
			schema: publicInvitationCodeSchemas.getInvitationCodeInfo
		},
		async (request, reply) => {
			try {
				const { code } = request.params;
				const { ticketId } = request.query;

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
					const { response, statusCode } = notFoundResponse("邀請碼不存在");
					return reply.code(statusCode).send(response);
				}

				const now = new Date();
				const isExpired = invitationCode.validUntil && now > invitationCode.validUntil;
				const isNotYetValid = invitationCode.validFrom && now < invitationCode.validFrom;
				const isUsageExceeded = invitationCode.usageLimit && invitationCode.usedCount >= invitationCode.usageLimit;

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
				const { response, statusCode } = serverErrorResponse("取得邀請碼資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default invitationCodesRoutes;
