import type { Prisma } from "@prisma/client";
import type { InvitationCode, InvitationCodeCreateRequest, InvitationCodeUpdateRequest } from "@sitcontix/types";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import prisma from "#config/database";
import { requireEventAccessViaCodeId, requireEventAccessViaTicketBody, requireEventListAccess } from "#middleware/auth";
import { adminInvitationCodeSchemas, invitationCodeSchemas } from "#schemas";
import { sendInvitationCode } from "#utils/email.ts";
import { logger } from "#utils/logger";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";

const componentLogger = logger.child({ component: "admin/invitationCodes" });

const adminInvitationCodesRoutes: FastifyPluginAsync = async (fastify, _options) => {
	// Create new invitation code
	fastify.post<{
		Body: InvitationCodeCreateRequest;
	}>(
		"/invitation-codes",
		{
			preHandler: requireEventAccessViaTicketBody,
			schema: invitationCodeSchemas.createInvitationCode
		},
		async (request: FastifyRequest<{ Body: InvitationCodeCreateRequest }>, reply: FastifyReply) => {
			try {
				const { code, name, usageLimit, validFrom, validUntil, ticketId } = request.body;

				const existingCode = await prisma.invitationCode.findFirst({
					where: {
						ticketId,
						code
					}
				});

				if (existingCode) {
					const { response, statusCode } = conflictResponse("此活動已存在相同邀請碼");
					return reply.code(statusCode).send(response);
				}

				if (validFrom && new Date(validFrom) <= new Date()) {
					const { response, statusCode } = validationErrorResponse("開始時間必須是未來時間");
					return reply.code(statusCode).send(response);
				}
				if (validUntil && new Date(validUntil) <= new Date()) {
					const { response, statusCode } = validationErrorResponse("結束時間必須是未來時間");
					return reply.code(statusCode).send(response);
				}
				if (validFrom && validUntil && new Date(validFrom) >= new Date(validUntil)) {
					const { response, statusCode } = validationErrorResponse("開始時間必須早於結束時間");
					return reply.code(statusCode).send(response);
				}

				if (!ticketId) {
					const { response, statusCode } = validationErrorResponse("必須提供票券 ID");
					return reply.code(statusCode).send(response);
				}

				const invitationCode: InvitationCode = await prisma.$transaction(async tx => {
					const ticket = await tx.ticket.findFirst({
						where: {
							id: ticketId
						}
					});

					if (!ticket) {
						throw new Error("票券不存在");
					}

					const newCode = await tx.invitationCode.create({
						data: {
							ticketId,
							code,
							name,
							usageLimit,
							usedCount: 0,
							validFrom: validFrom ? new Date(validFrom) : null,
							validUntil: validUntil ? new Date(validUntil) : null,
							isActive: true
						}
					});

					return {
						...newCode,
						createdAt: newCode.createdAt.toISOString(),
						updatedAt: newCode.updatedAt.toISOString(),
						validFrom: newCode.validFrom?.toISOString() ?? null,
						validUntil: newCode.validUntil?.toISOString() ?? null
					};
				});

				return reply.code(201).send(successResponse(invitationCode, "邀請碼創建成功"));
			} catch (error) {
				componentLogger.error({ error }, "Create invitation code error");
				const { response, statusCode } = serverErrorResponse("創建邀請碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get invitation code by ID
	fastify.get<{
		Params: { id: string };
	}>(
		"/invitation-codes/:id",
		{
			preHandler: requireEventAccessViaCodeId,
			schema: invitationCodeSchemas.getInvitationCode
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;

				const rawInvitationCode = await prisma.invitationCode.findUnique({
					where: { id },
					include: {
						ticket: {
							select: {
								id: true,
								name: true,
								price: true,
								isActive: true,
								event: {
									select: {
										id: true,
										name: true,
										startDate: true,
										endDate: true
									}
								}
							}
						}
					}
				});

				if (!rawInvitationCode) {
					const { response, statusCode } = notFoundResponse("邀請碼不存在");
					return reply.code(statusCode).send(response);
				}

				const invitationCode: InvitationCode = {
					...rawInvitationCode,
					createdAt: rawInvitationCode.createdAt.toISOString(),
					updatedAt: rawInvitationCode.updatedAt.toISOString(),
					validFrom: rawInvitationCode.validFrom?.toISOString() ?? null,
					validUntil: rawInvitationCode.validUntil?.toISOString() ?? null
				};

				return reply.send(successResponse(invitationCode));
			} catch (error) {
				componentLogger.error({ error }, "Get invitation code error");
				const { response, statusCode } = serverErrorResponse("取得邀請碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Update invitation code
	fastify.put<{
		Params: { id: string };
		Body: InvitationCodeUpdateRequest;
	}>(
		"/invitation-codes/:id",
		{
			preHandler: requireEventAccessViaCodeId,
			schema: invitationCodeSchemas.updateInvitationCode
		},
		async (request: FastifyRequest<{ Params: { id: string }; Body: InvitationCodeUpdateRequest }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;
				const { code, name, usageLimit, validFrom, validUntil, isActive, ticketId } = request.body;

				const existingCode = await prisma.invitationCode.findUnique({
					where: { id }
				});

				if (!existingCode) {
					const { response, statusCode } = notFoundResponse("邀請碼不存在");
					return reply.code(statusCode).send(response);
				}

				if (code && code !== existingCode.code) {
					const codeConflict = await prisma.invitationCode.findFirst({
						where: {
							ticketId: existingCode.ticketId,
							code,
							id: { not: id }
						}
					});

					if (codeConflict) {
						const { response, statusCode } = conflictResponse("此活動已存在相同邀請碼");
						return reply.code(statusCode).send(response);
					}
				}

				if (validFrom && new Date(validFrom) <= new Date()) {
					const { response, statusCode } = validationErrorResponse("開始時間必須是未來時間");
					return reply.code(statusCode).send(response);
				}
				if (validUntil && new Date(validUntil) <= new Date()) {
					const { response, statusCode } = validationErrorResponse("結束時間必須是未來時間");
					return reply.code(statusCode).send(response);
				}
				if (validFrom && validUntil && new Date(validFrom) >= new Date(validUntil)) {
					const { response, statusCode } = validationErrorResponse("開始時間必須早於結束時間");
					return reply.code(statusCode).send(response);
				}

				if (usageLimit !== undefined && usageLimit < existingCode.usedCount) {
					const { response, statusCode } = validationErrorResponse(`使用次數限制不能低於已使用次數 (${existingCode.usedCount})`);
					return reply.code(statusCode).send(response);
				}

				// Update invitation code in transaction
				const invitationCode: InvitationCode = await prisma.$transaction(async tx => {
					const updatePayload: Record<string, unknown> = {};
					if (code !== undefined) updatePayload.code = code;
					if (name !== undefined) updatePayload.name = name;
					if (usageLimit !== undefined) updatePayload.usageLimit = usageLimit;
					if (isActive !== undefined) updatePayload.isActive = isActive;
					if (validFrom !== undefined) updatePayload.validFrom = validFrom ? new Date(validFrom) : null;
					if (validUntil !== undefined) updatePayload.validUntil = validUntil ? new Date(validUntil) : null;

					if (ticketId !== undefined) {
						if (ticketId) {
							const ticket = await tx.ticket.findUnique({
								where: {
									id: ticketId
								}
							});

							if (!ticket) {
								throw new Error("票券不存在");
							}
						}
						updatePayload.ticketId = ticketId;
					}

					const updatedCode = await tx.invitationCode.update({
						where: { id },
						data: updatePayload
					});

					return {
						...updatedCode,
						createdAt: updatedCode.createdAt.toISOString(),
						updatedAt: updatedCode.updatedAt.toISOString(),
						validFrom: updatedCode.validFrom?.toISOString() ?? null,
						validUntil: updatedCode.validUntil?.toISOString() ?? null
					};
				});

				return reply.send(successResponse(invitationCode, "邀請碼更新成功"));
			} catch (error) {
				componentLogger.error({ error }, "Update invitation code error");
				const { response, statusCode } = serverErrorResponse("更新邀請碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Delete invitation code
	fastify.delete<{
		Params: { id: string };
	}>(
		"/invitation-codes/:id",
		{
			preHandler: requireEventAccessViaCodeId,
			schema: invitationCodeSchemas.deleteInvitationCode
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;

				const existingCode = await prisma.invitationCode.findUnique({
					where: { id }
				});

				if (!existingCode) {
					const { response, statusCode } = notFoundResponse("邀請碼不存在");
					return reply.code(statusCode).send(response);
				}

				if (existingCode.usedCount > 0) {
					const { response, statusCode } = conflictResponse("無法刪除已被使用的邀請碼");
					return reply.code(statusCode).send(response);
				}

				await prisma.invitationCode.delete({
					where: { id }
				});

				return reply.send(successResponse(null, "邀請碼刪除成功"));
			} catch (error) {
				componentLogger.error({ error }, "Delete invitation code error");
				const { response, statusCode } = serverErrorResponse("刪除邀請碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// List invitation codes
	fastify.get<{
		Querystring: { ticketId?: string; isActive?: boolean; eventId?: string };
	}>(
		"/invitation-codes",
		{
			preHandler: requireEventListAccess,
			schema: invitationCodeSchemas.listInvitationCodes
		},
		async (request: FastifyRequest<{ Querystring: { ticketId?: string; isActive?: boolean; eventId?: string } }>, reply: FastifyReply) => {
			try {
				const { ticketId, isActive, eventId } = request.query;

				const where: Record<string, unknown> = {};
				if (ticketId) where.ticketId = ticketId;
				if (isActive !== undefined) where.isActive = isActive;

				if (request.userEventPermissions) {
					const ticketWhere: Record<string, unknown> = { eventId: { in: request.userEventPermissions } };
					if (eventId) ticketWhere.eventId = eventId;

					const accessibleTickets = await prisma.ticket.findMany({
						where: ticketWhere,
						select: { id: true }
					});
					const accessibleTicketIds = accessibleTickets.map(t => t.id);
					where.ticketId = ticketId ? (accessibleTicketIds.includes(ticketId) ? ticketId : "none") : { in: accessibleTicketIds };
				} else if (eventId) {
					// If no user permissions but eventId is provided, filter by eventId
					const eventTickets = await prisma.ticket.findMany({
						where: { eventId },
						select: { id: true }
					});
					const eventTicketIds = eventTickets.map(t => t.id);
					where.ticketId = ticketId ? (eventTicketIds.includes(ticketId) ? ticketId : "none") : { in: eventTicketIds };
				}

				const rawInvitationCodes = await prisma.invitationCode.findMany({
					where,
					include: {
						ticket: {
							select: {
								id: true,
								name: true,
								price: true,
								isActive: true,
								event: {
									select: {
										id: true,
										name: true,
										startDate: true,
										endDate: true
									}
								}
							}
						}
					},
					orderBy: { createdAt: "desc" }
				});

				const invitationCodes: InvitationCode[] = rawInvitationCodes.map(code => ({
					...code,
					createdAt: code.createdAt.toISOString(),
					updatedAt: code.updatedAt.toISOString(),
					validFrom: code.validFrom?.toISOString() ?? null,
					validUntil: code.validUntil?.toISOString() ?? null
				}));

				// Add status indicators
				const now = new Date();
				const codesWithStatus = invitationCodes.map(code => ({
					...code,
					isExpired: code.validUntil && new Date(code.validUntil) < now,
					isNotStarted: code.validFrom && new Date(code.validFrom) > now,
					isExhausted: code.usageLimit && code.usedCount >= code.usageLimit,
					remainingUses: code.usageLimit ? Math.max(0, code.usageLimit - code.usedCount) : null
				}));

				return reply.send(successResponse(codesWithStatus));
			} catch (error) {
				componentLogger.error({ error }, "List invitation codes error");
				const { response, statusCode } = serverErrorResponse("取得邀請碼列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Bulk create invitation codes
	fastify.post<{
		Body: {
			ticketId: string;
			name: string;
			count: number;
			usageLimit?: number;
			validFrom?: string;
			validUntil?: string;
		};
	}>(
		"/invitation-codes/bulk",
		{
			preHandler: requireEventAccessViaTicketBody,
			schema: adminInvitationCodeSchemas.bulkCreateInvitationCodes
		},
		async (
			request: FastifyRequest<{
				Body: {
					ticketId: string;
					name: string;
					count: number;
					usageLimit?: number;
					validFrom?: string;
					validUntil?: string;
				};
			}>,
			reply: FastifyReply
		) => {
			try {
				const { ticketId, name, count, usageLimit, validFrom, validUntil } = request.body;

				const ticket = await prisma.ticket.findUnique({
					where: { id: ticketId }
				});

				if (!ticket) {
					const { response, statusCode } = notFoundResponse("票券不存在");
					return reply.code(statusCode).send(response);
				}

				const codes: Array<Prisma.InvitationCodeCreateInput> = [];
				const existingCodes = await prisma.invitationCode.findMany({
					where: { ticketId },
					select: { code: true }
				});
				const existingCodeSet = new Set(existingCodes.map(c => c.code));

				for (let i = 0; i < count; i++) {
					let code;
					let attempts = 0;
					do {
						code = Math.random().toString(36).substring(2, 8).toUpperCase();
						attempts++;
					} while (existingCodeSet.has(code) && attempts < 100);

					if (attempts >= 100) {
						const { response, statusCode } = serverErrorResponse("無法生成足夠的唯一邀請碼");
						return reply.code(statusCode).send(response);
					}

					codes.push({
						ticket: { connect: { id: ticketId } },
						code,
						name: `批量生成的邀請碼 - ${name}`,
						usageLimit,
						usedCount: 0,
						validFrom: validFrom ? new Date(validFrom) : null,
						validUntil: validUntil ? new Date(validUntil) : null,
						isActive: true
					});
					existingCodeSet.add(code);
				}

				await prisma.$transaction(
					codes.map(codeData =>
						prisma.invitationCode.create({
							data: codeData
						})
					)
				);

				return reply.code(201).send(
					successResponse(
						{
							count: codes.length,
							codes: codes.map(c => c.code)
						},
						`成功創建 ${codes.length} 個邀請碼`
					)
				);
			} catch (error) {
				componentLogger.error({ error }, "Bulk create invitation codes error");
				const { response, statusCode } = serverErrorResponse("批量創建邀請碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Send invitation codes via email
	fastify.post<{
		Body: { email: string; code: string; message?: string };
	}>(
		"/invitation-codes/send-email",
		{
			schema: adminInvitationCodeSchemas.sendInvitationCodeEmail
		},
		async (request: FastifyRequest<{ Body: { email: string; code: string; message?: string } }>, reply: FastifyReply) => {
			try {
				const { email, code, message } = request.body;

				// Fetch the invitation code details
				const invitationCode = await prisma.invitationCode.findFirst({
					where: {
						code: code,
						isActive: true
					},
					include: {
						ticket: {
							select: {
								id: true,
								name: true,
								event: {
									select: {
										id: true,
										name: true,
										slug: true
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

				// Build ticket URL
				const frontendUrl = process.env.FRONTEND_URI || "http://localhost:3000";
				const ticketUrl = `${frontendUrl}/${invitationCode.ticket.event.slug}/ticket/${invitationCode.ticket.id}?inv=${code}`;

				// Format valid until date
				const validUntil = invitationCode.validUntil ? new Date(invitationCode.validUntil).toLocaleDateString("zh-TW") : "無期限";

				await sendInvitationCode(email, code, invitationCode.ticket.event.name, invitationCode.ticket.name, ticketUrl, validUntil, message);

				return reply.send(successResponse(null, "成功寄送邀請碼"));
			} catch (error) {
				componentLogger.error({ error }, "Send invitation codes email error");
				const { response, statusCode } = serverErrorResponse("寄送邀請碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default adminInvitationCodesRoutes;
