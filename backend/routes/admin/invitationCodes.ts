import type { Prisma } from "#prisma/generated/prisma/client";
import { SpanStatusCode } from "@opentelemetry/api";
import type { InvitationCode } from "@sitcontix/types";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { requireEventAccessViaCodeId, requireEventAccessViaTicketBody, requireEventListAccess } from "#middleware/auth";
import { adminInvitationCodeSchemas, invitationCodeSchemas } from "#schemas";
import { sendInvitationCode } from "#utils/email";
import { logger } from "#utils/logger";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";

const componentLogger = logger.child({ component: "admin/invitationCodes" });

const adminInvitationCodesRoutes: FastifyPluginAsync = async (fastify, _options) => {
	// Create new invitation code
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/invitation-codes",
		{
			preHandler: requireEventAccessViaTicketBody,
			schema: invitationCodeSchemas.createInvitationCode
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.invitation_codes.create", {
				attributes: {
					"invitation_code.code.masked": request.body.code ? `${request.body.code.substring(0, 2)}****` : "****",
					"invitation_code.ticket_id": request.body.ticketId || ""
				}
			});

			try {
				const { code, name, usageLimit, validFrom, validUntil, ticketId } = request.body;

				span.addEvent("invitation_code.checking_existing");

				const existingCode = await prisma.invitationCode.findFirst({
					where: {
						ticketId,
						code
					}
				});

				if (existingCode) {
					span.addEvent("invitation_code.already_exists");
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

				span.addEvent("invitation_code.creating");

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
						createdAt: newCode.createdAt,
						updatedAt: newCode.updatedAt,
						validFrom: newCode.validFrom ?? null,
						validUntil: newCode.validUntil ?? null
					};
				});

				span.setAttribute("invitation_code.id", invitationCode.id);
				span.setAttribute("ticket.id", invitationCode.ticketId);

				// Fetch event.id for context
				const ticketInfo = await prisma.ticket.findUnique({
					where: { id: invitationCode.ticketId },
					select: { eventId: true }
				});
				if (ticketInfo) {
					span.setAttribute("event.id", ticketInfo.eventId);
				}

				span.addEvent("invitation_code.created");
				span.setStatus({ code: SpanStatusCode.OK });

				return reply.code(201).send(successResponse(invitationCode, "邀請碼創建成功"));
			} catch (error) {
				componentLogger.error({ error }, "Create invitation code error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to create invitation code"
				});
				const { response, statusCode } = serverErrorResponse("創建邀請碼失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// Get invitation code by ID
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/invitation-codes/:id",
		{
			preHandler: requireEventAccessViaCodeId,
			schema: invitationCodeSchemas.getInvitationCode
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.invitation_codes.get", {
				attributes: {
					"invitation_code.id": request.params.id
				}
			});

			try {
				const { id } = request.params;

				span.addEvent("invitation_code.fetching");

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
					span.addEvent("invitation_code.not_found");
					const { response, statusCode } = notFoundResponse("邀請碼不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("invitation_code.id", rawInvitationCode.id);
				span.setAttribute("ticket.id", rawInvitationCode.ticketId);
				if (rawInvitationCode.ticket?.event?.id) span.setAttribute("event.id", rawInvitationCode.ticket.event.id);
				span.setAttribute("invitation_code.code.masked", `${rawInvitationCode.code.substring(0, 2)}****`);
				span.setAttribute("invitation_code.used_count", rawInvitationCode.usedCount);

				const invitationCode: InvitationCode = {
					...rawInvitationCode,
					createdAt: rawInvitationCode.createdAt,
					updatedAt: rawInvitationCode.updatedAt,
					validFrom: rawInvitationCode.validFrom ?? null,
					validUntil: rawInvitationCode.validUntil ?? null
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(invitationCode));
			} catch (error) {
				componentLogger.error({ error }, "Get invitation code error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get invitation code"
				});
				const { response, statusCode } = serverErrorResponse("取得邀請碼失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// Update invitation code
	fastify.withTypeProvider<ZodTypeProvider>().put(
		"/invitation-codes/:id",
		{
			preHandler: requireEventAccessViaCodeId,
			schema: invitationCodeSchemas.updateInvitationCode
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.invitation_codes.update", {
				attributes: {
					"invitation_code.id": request.params.id
				}
			});

			try {
				const { id } = request.params;
				const { code, name, usageLimit, validFrom, validUntil, isActive, ticketId } = request.body;

				span.addEvent("invitation_code.fetching_existing");

				const existingCode = await prisma.invitationCode.findUnique({
					where: { id }
				});

				if (!existingCode) {
					span.addEvent("invitation_code.not_found");
					const { response, statusCode } = notFoundResponse("邀請碼不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("invitation_code.id", existingCode.id);
				span.setAttribute("ticket.id", existingCode.ticketId);
				span.setAttribute("invitation_code.existing.used_count", existingCode.usedCount);

				if (code && code !== existingCode.code) {
					span.addEvent("invitation_code.checking_code_conflict");
					const codeConflict = await prisma.invitationCode.findFirst({
						where: {
							ticketId: existingCode.ticketId,
							code,
							id: { not: id }
						}
					});

					if (codeConflict) {
						span.addEvent("invitation_code.code_conflict");
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

				span.addEvent("invitation_code.updating");

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
						createdAt: updatedCode.createdAt,
						updatedAt: updatedCode.updatedAt,
						validFrom: updatedCode.validFrom ?? null,
						validUntil: updatedCode.validUntil ?? null
					};
				});

				span.setAttribute("invitation_code.id", invitationCode.id);
				span.setAttribute("ticket.id", invitationCode.ticketId);
				span.addEvent("invitation_code.updated");
				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(successResponse(invitationCode, "邀請碼更新成功"));
			} catch (error) {
				componentLogger.error({ error }, "Update invitation code error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to update invitation code"
				});
				const { response, statusCode } = serverErrorResponse("更新邀請碼失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// Delete invitation code
	fastify.withTypeProvider<ZodTypeProvider>().delete(
		"/invitation-codes/:id",
		{
			preHandler: requireEventAccessViaCodeId,
			schema: invitationCodeSchemas.deleteInvitationCode
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.invitation_codes.delete", {
				attributes: {
					"invitation_code.id": request.params.id
				}
			});

			try {
				const { id } = request.params;

				span.addEvent("invitation_code.fetching");

				const existingCode = await prisma.invitationCode.findUnique({
					where: { id }
				});

				if (!existingCode) {
					span.addEvent("invitation_code.not_found");
					const { response, statusCode } = notFoundResponse("邀請碼不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("invitation_code.id", existingCode.id);
				span.setAttribute("ticket.id", existingCode.ticketId);
				span.setAttribute("invitation_code.used_count", existingCode.usedCount);

				if (existingCode.usedCount > 0) {
					span.addEvent("invitation_code.has_been_used");
					const { response, statusCode } = conflictResponse("無法刪除已被使用的邀請碼");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("invitation_code.deleting");

				await prisma.invitationCode.delete({
					where: { id }
				});

				span.addEvent("invitation_code.deleted");
				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(successResponse(null, "邀請碼刪除成功"));
			} catch (error) {
				componentLogger.error({ error }, "Delete invitation code error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to delete invitation code"
				});
				const { response, statusCode } = serverErrorResponse("刪除邀請碼失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// List invitation codes
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/invitation-codes",
		{
			preHandler: requireEventListAccess,
			schema: invitationCodeSchemas.listInvitationCodes
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.invitation_codes.list", {
				attributes: {
					"invitation_codes.has_user_permissions": !!request.userEventPermissions
				}
			});

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

				span.addEvent("invitation_codes.fetching");

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

				span.setAttribute("invitation_codes.count", rawInvitationCodes.length);
				span.addEvent("invitation_codes.fetched");

				const invitationCodes = rawInvitationCodes.map(code => ({
					...code,
					createdAt: code.createdAt,
					updatedAt: code.updatedAt,
					validFrom: code.validFrom ?? null,
					validUntil: code.validUntil ?? null
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

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(codesWithStatus));
			} catch (error) {
				componentLogger.error({ error }, "List invitation codes error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to list invitation codes"
				});
				const { response, statusCode } = serverErrorResponse("取得邀請碼列表失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// Bulk create invitation codes
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/invitation-codes/bulk",
		{
			preHandler: requireEventAccessViaTicketBody,
			schema: adminInvitationCodeSchemas.bulkCreateInvitationCodes
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.invitation_codes.bulk_create", {
				attributes: {
					"invitation_codes.bulk.count": request.body.count,
					"invitation_codes.bulk.ticket_id": request.body.ticketId
				}
			});

			try {
				const { ticketId, name, count, usageLimit, validFrom, validUntil } = request.body;

				span.addEvent("invitation_codes.checking_ticket");

				const ticket = await prisma.ticket.findUnique({
					where: { id: ticketId }
				});

				span.setAttribute("ticket.id", ticketId);

				if (ticket) {
					span.setAttribute("event.id", ticket.eventId);
				}

				if (!ticket) {
					span.addEvent("invitation_codes.ticket_not_found");
					const { response, statusCode } = notFoundResponse("票券不存在");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("invitation_codes.generating_codes");

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
						span.addEvent("invitation_codes.generation_failed");
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

				span.addEvent("invitation_codes.creating_batch");

				await prisma.$transaction(
					codes.map(codeData =>
						prisma.invitationCode.create({
							data: codeData
						})
					)
				);

				span.setAttribute("invitation_codes.created_count", codes.length);
				span.addEvent("invitation_codes.batch_created");
				span.setStatus({ code: SpanStatusCode.OK });

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
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to bulk create invitation codes"
				});
				const { response, statusCode } = serverErrorResponse("批量創建邀請碼失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// Send invitation codes via email
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/invitation-codes/send-email",
		{
			schema: adminInvitationCodeSchemas.sendInvitationCodeEmail
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.invitation_codes.send_email", {
				attributes: {
					"invitation_code.email.recipient.masked": request.body.email ? `****${request.body.email.split("@")[1]}` : "****",
					"invitation_code.code.masked": request.body.code ? `${request.body.code.substring(0, 2)}****` : "****"
				}
			});

			try {
				const { email, code, message } = request.body;

				span.addEvent("invitation_code.fetching");

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
					span.addEvent("invitation_code.not_found");
					const { response, statusCode } = notFoundResponse("邀請碼不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("invitation_code.id", invitationCode.id);
				span.setAttribute("ticket.id", invitationCode.ticket.id);
				span.setAttribute("event.id", invitationCode.ticket.event.id);
				span.setAttribute("invitation_code.event_id", invitationCode.ticket.event.id);
				span.setAttribute("invitation_code.ticket_id", invitationCode.ticket.id);

				// Build ticket URL
				const frontendUrl = process.env.FRONTEND_URI || "http://localhost:3000";
				const ticketUrl = `${frontendUrl}/${invitationCode.ticket.event.slug}/ticket/${invitationCode.ticket.id}?inv=${code}`;

				// Format valid until date
				const validUntil = invitationCode.validUntil ? new Date(invitationCode.validUntil).toLocaleDateString("zh-TW") : "無期限";

				span.addEvent("invitation_code.sending_email");

				await sendInvitationCode(email, code, invitationCode.ticket.event.name, invitationCode.ticket.name, ticketUrl, validUntil, message);

				span.addEvent("invitation_code.email_sent");
				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(successResponse(null, "成功寄送邀請碼"));
			} catch (error) {
				componentLogger.error({ error }, "Send invitation codes email error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to send invitation code email"
				});
				const { response, statusCode } = serverErrorResponse("寄送邀請碼失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);
};

export default adminInvitationCodesRoutes;
