/**
 * @fileoverview Admin invitation codes routes with modular types and schemas
 * @typedef {import('#types/database.js').InvitationCode} InvitationCode
 * @typedef {import('#types/api.js').InvitationCodeCreateRequest} InvitationCodeCreateRequest
 * @typedef {import('#types/api.js').InvitationCodeUpdateRequest} InvitationCodeUpdateRequest
 */

import prisma from "#config/database.js";
import { invitationCodeSchemas } from "#schemas/invitationCode.js";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response.js";

/**
 * Admin invitation codes routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
export default async function adminInvitationCodesRoutes(fastify, options) {
	// Create new invitation code
	fastify.post(
		"/invitation-codes",
		{
			schema: invitationCodeSchemas.createInvitationCode
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Body: InvitationCodeCreateRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				/** @type {InvitationCodeCreateRequest} */
				const { code, name, usageLimit, validFrom, validUntil, ticketId } = request.body;

				// Check for duplicate codes
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

				// Validate date ranges
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

				// Create invitation code in transaction
				/** @type {InvitationCode} */
				const invitationCode = await prisma.$transaction(async tx => {
					// Verify ticket exists if provided
					if (ticketId) {
						const ticket = await tx.ticket.findFirst({
							where: {
								id: ticketId
							}
						});

						if (!ticket) {
							throw new Error("票券不存在");
						}
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
			schema: invitationCodeSchemas.getInvitationCode
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				/** @type {InvitationCode | null} */
				const invitationCode = await prisma.invitationCode.findUnique({
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
			schema: invitationCodeSchemas.updateInvitationCode
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}, Body: InvitationCodeUpdateRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;
				const { code, name, usageLimit, validFrom, validUntil, isActive, ticketId } = request.body;

				// Check if invitation code exists
				const existingCode = await prisma.invitationCode.findUnique({
					where: { id }
				});

				if (!existingCode) {
					const { response, statusCode } = notFoundResponse("邀請碼不存在");
					return reply.code(statusCode).send(response);
				}

				// Check for code conflicts in the same event
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

				// Validate date ranges
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

				// Don't allow reducing usage limit below current usage
				if (usageLimit !== undefined && usageLimit < existingCode.usedCount) {
					const { response, statusCode } = validationErrorResponse(`使用次數限制不能低於已使用次數 (${existingCode.usedCount})`);
					return reply.code(statusCode).send(response);
				}

				// Update invitation code in transaction
				/** @type {InvitationCode} */
				const invitationCode = await prisma.$transaction(async tx => {
					// Prepare update data
					const updatePayload = {};
					if (code !== undefined) updatePayload.code = code;
					if (name !== undefined) updatePayload.name = name;
					if (usageLimit !== undefined) updatePayload.usageLimit = usageLimit;
					if (isActive !== undefined) updatePayload.isActive = isActive;
					if (validFrom !== undefined) updatePayload.validFrom = validFrom ? new Date(validFrom) : null;
					if (validUntil !== undefined) updatePayload.validUntil = validUntil ? new Date(validUntil) : null;

					// Update ticket association if provided
					if (ticketId !== undefined) {
						if (ticketId) {
							// Verify ticket exists
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
			schema: invitationCodeSchemas.deleteInvitationCode
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				// Check if invitation code exists
				const existingCode = await prisma.invitationCode.findUnique({
					where: { id }
				});

				if (!existingCode) {
					const { response, statusCode } = notFoundResponse("邀請碼不存在");
					return reply.code(statusCode).send(response);
				}

				// Check if code has been used (based on usedCount)
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
			schema: invitationCodeSchemas.listInvitationCodes
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Querystring: {ticketId?: string, isActive?: boolean}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { ticketId, isActive } = request.query;

				// Build where clause
				const where = {};
				if (ticketId) where.ticketId = ticketId;
				if (isActive !== undefined) where.isActive = isActive;

				/** @type {InvitationCode[]} */
				const invitationCodes = await prisma.invitationCode.findMany({
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
	fastify.post(
		"/invitation-codes/bulk",
		{
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
		/**
		 * @param {import('fastify').FastifyRequest<{Body: {ticketId: string, prefix: string, count: number, usageLimit?: number, validFrom?: string, validUntil?: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { ticketId, prefix, count, usageLimit, validFrom, validUntil } = request.body;

				// Verify ticket exists
				const ticket = await prisma.ticket.findUnique({
					where: { id: ticketId }
				});

				if (!ticket) {
					const { response, statusCode } = notFoundResponse("票券不存在");
					return reply.code(statusCode).send(response);
				}

				// Generate unique codes
				const codes = [];
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
						ticketId,
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

				// Create all codes in a transaction
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
	fastify.post(
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
						codes: {
							type: "array",
							items: { type: "string" },
							description: "邀請碼列表"
						},
						groupName: {
							type: "string",
							description: "邀請碼組名稱"
						}
					},
					required: ["email", "codes"]
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Body: {email: string, codes: string[], groupName?: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { email, codes, groupName } = request.body;

				// Import email utility
				const { sendInvitationCodes } = await import("#utils/email.js");

				// Send email
				await sendInvitationCodes(email, codes, groupName);

				return reply.send(successResponse(null, "成功寄送邀請碼"));
			} catch (error) {
				console.error("Send invitation codes email error:", error);
				const { response, statusCode } = serverErrorResponse("寄送邀請碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}
