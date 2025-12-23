import type { InvitationCode } from "@tickets/shared";
import type { Prisma } from "@prisma/client";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import prisma from "#config/database";
import { requireEventAccessViaCodeId, requireEventAccessViaTicketBody, requireEventListAccess } from "#middleware/auth";
import { sendInvitationCode } from "#utils/email.ts";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";
import {
	invitationCodeCreateSchema,
	invitationCodeUpdateSchema,
	type InvitationCodeCreateRequest,
	type InvitationCodeUpdateRequest,
} from "@tickets/shared";

const adminInvitationCodesRoutes: FastifyPluginAsync = async (fastify, _options) => {
	// Create new invitation code
	fastify.post(
		"/invitation-codes",
		{
			preHandler: requireEventAccessViaTicketBody,
			schema: {
				description: "Create a new invitation code",
				tags: ["admin/invitation-codes"],
				body: invitationCodeCreateSchema,
			},
		},
		async (request, reply) => {
			try {
				const { code, name, usageLimit, validFrom, validUntil, ticketId } = request.body as InvitationCodeCreateRequest;

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

					return newCode;
				});

				return reply.code(201).send(successResponse(invitationCode, "邀請碼創建成功"));
			} catch (error) {
				console.error("Create invitation code error:", error);
				const { response, statusCode } = serverErrorResponse("創建邀請碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get invitation code by ID
	fastify.get(
		"/invitation-codes/:id",
		{
			preHandler: requireEventAccessViaCodeId,
			schema: {
				description: "Get invitation code by ID",
				tags: ["admin/invitation-codes"],
			},
		},
		async (request, reply) => {
			try {
				const { id } = request.params as { id: string };

				const invitationCode: InvitationCode | null = await prisma.invitationCode.findUnique({
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

				if (!invitationCode) {
					const { response, statusCode } = notFoundResponse("邀請碼不存在");
					return reply.code(statusCode).send(response);
				}

				return reply.send(successResponse(invitationCode));
			} catch (error) {
				console.error("Get invitation code error:", error);
				const { response, statusCode } = serverErrorResponse("取得邀請碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Update invitation code
	fastify.put(
		"/invitation-codes/:id",
		{
			preHandler: requireEventAccessViaCodeId,
			schema: {
				description: "Update invitation code",
				tags: ["admin/invitation-codes"],
				body: invitationCodeUpdateSchema,
			},
		},
		async (request, reply) => {
			try {
				const { id } = request.params as { id: string };
				const { code, name, usageLimit, validFrom, validUntil, isActive, ticketId } = request.body as InvitationCodeUpdateRequest;

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

					return updatedCode;
				});

				return reply.send(successResponse(invitationCode, "邀請碼更新成功"));
			} catch (error) {
				console.error("Update invitation code error:", error);
				const { response, statusCode } = serverErrorResponse("更新邀請碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Delete invitation code
	fastify.delete(
		"/invitation-codes/:id",
		{
			preHandler: requireEventAccessViaCodeId,
			schema: {
				description: "Delete invitation code",
				tags: ["admin/invitation-codes"],
			},
		},
		async (request, reply) => {
			try {
				const { id } = request.params as { id: string };

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
				console.error("Delete invitation code error:", error);
				const { response, statusCode } = serverErrorResponse("刪除邀請碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// List invitation codes
	fastify.get(
		"/invitation-codes",
		{
			preHandler: requireEventListAccess,
			schema: {
				description: "List invitation codes",
				tags: ["admin/invitation-codes"],
			},
		},
		async (request, reply) => {
			try {
				const { ticketId, isActive, eventId } = request.query as { ticketId?: string; isActive?: string; eventId?: string };

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

				const invitationCodes: InvitationCode[] = await prisma.invitationCode.findMany({
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

				// Add status indicators
				const now = new Date();
				const codesWithStatus = invitationCodes.map(code => ({
					...code,
					isExpired: code.validUntil && code.validUntil < now,
					isNotStarted: code.validFrom && code.validFrom > now,
					isExhausted: code.usageLimit && code.usedCount >= code.usageLimit,
					remainingUses: code.usageLimit ? Math.max(0, code.usageLimit - code.usedCount) : null
				}));

				return reply.send(successResponse(codesWithStatus));
			} catch (error) {
				console.error("List invitation codes error:", error);
				const { response, statusCode } = serverErrorResponse("取得邀請碼列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Bulk create invitation codes
	fastify.post<{
		Body: {
			ticketId: string;
			prefix: string;
			count: number;
			usageLimit?: number;
			validFrom?: string;
			validUntil?: string;
		};
	}>(
		"/invitation-codes/bulk",
		{
			preHandler: requireEventAccessViaTicketBody,
			schema: {
				description: "批量創建邀請碼",
				tags: ["admin/invitation-codes"],
				body: {
					type: "object",
					properties: {
						ticketId: {
							type: "string",
							description: "票券 ID"
						},
						prefix: {
							type: "string",
							description: "邀請碼前綴",
							minLength: 1
						},
						count: {
							type: "integer",
							minimum: 1,
							maximum: 100,
							description: "生成數量"
						},
						usageLimit: {
							type: "integer",
							minimum: 1,
							description: "使用次數限制"
						},
						validFrom: {
							type: "string",
							format: "date-time",
							description: "開始時間"
						},
						validUntil: {
							type: "string",
							format: "date-time",
							description: "結束時間"
						}
					},
					required: ["ticketId", "prefix", "count"]
				}
			}
		},
		async (
			request: FastifyRequest<{
				Body: {
					ticketId: string;
					prefix: string;
					count: number;
					usageLimit?: number;
					validFrom?: string;
					validUntil?: string;
				};
			}>,
			reply: FastifyReply
		) => {
			try {
				const { ticketId, prefix, count, usageLimit, validFrom, validUntil } = request.body;

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
						const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
						code = `${prefix}-${randomSuffix}`;
						attempts++;
					} while (existingCodeSet.has(code) && attempts < 100);

					if (attempts >= 100) {
						const { response, statusCode } = serverErrorResponse("無法生成足夠的唯一邀請碼");
						return reply.code(statusCode).send(response);
					}

					codes.push({
						ticket: { connect: { id: ticketId } },
						code,
						name: `批量生成的邀請碼 - ${prefix}`,
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
				console.error("Bulk create invitation codes error:", error);
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
			schema: {
				description: "透過 Email 寄送邀請碼",
				tags: ["admin/invitation-codes"],
				body: {
					type: "object",
					properties: {
						email: {
							type: "string",
							format: "email",
							description: "收件者 Email"
						},
						code: {
							type: "string",
							description: "邀請碼"
						},
						message: {
							type: "string",
							description: "附加訊息",
							default: ""
						}
					},
					required: ["email", "code"]
				}
			}
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
				console.error("Send invitation codes email error:", error);
				const { response, statusCode } = serverErrorResponse("寄送邀請碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default adminInvitationCodesRoutes;
