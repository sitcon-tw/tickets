/**
 * @fileoverview Admin invitation codes routes with modular types and schemas
 * @typedef {import('../../types/database.js').InvitationCode} InvitationCode
 * @typedef {import('../../types/api.js').InvitationCodeCreateRequest} InvitationCodeCreateRequest
 */

import prisma from "#config/database.js";
import { 
	successResponse, 
	validationErrorResponse, 
	notFoundResponse, 
	serverErrorResponse,
	conflictResponse
} from "#utils/response.js";
import { invitationCodeSchemas } from "../../schemas/invitationCode.js";

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
				const { eventId, code, description, usageLimit, expiresAt } = request.body;

				// Verify event exists
				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				// Check for duplicate codes
				const existingCode = await prisma.invitationCode.findFirst({
					where: { 
						eventId,
						code 
					}
				});

				if (existingCode) {
					const { response, statusCode } = conflictResponse("此活動已存在相同邀請碼");
					return reply.code(statusCode).send(response);
				}

				// Validate expiration date
				if (expiresAt && new Date(expiresAt) <= new Date()) {
					const { response, statusCode } = validationErrorResponse("到期時間必須是未來時間");
					return reply.code(statusCode).send(response);
				}

				/** @type {InvitationCode} */
				const invitationCode = await prisma.invitationCode.create({
					data: {
						eventId,
						code,
						description,
						usageLimit,
						usageCount: 0,
						expiresAt: expiresAt ? new Date(expiresAt) : null,
						isActive: true
					}
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
						event: {
							select: {
								id: true,
								name: true,
								startDate: true,
								endDate: true
							}
						},
						_count: {
							select: {
								registrations: true
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
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}, Body: Partial<InvitationCodeCreateRequest>}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;
				const updateData = request.body;

				// Check if invitation code exists
				const existingCode = await prisma.invitationCode.findUnique({
					where: { id }
				});

				if (!existingCode) {
					const { response, statusCode } = notFoundResponse("邀請碼不存在");
					return reply.code(statusCode).send(response);
				}

				// Check for code conflicts in the same event
				if (updateData.code && updateData.code !== existingCode.code) {
					const codeConflict = await prisma.invitationCode.findFirst({
						where: { 
							eventId: existingCode.eventId,
							code: updateData.code,
							id: { not: id }
						}
					});

					if (codeConflict) {
						const { response, statusCode } = conflictResponse("此活動已存在相同邀請碼");
						return reply.code(statusCode).send(response);
					}
				}

				// Validate expiration date
				if (updateData.expiresAt && new Date(updateData.expiresAt) <= new Date()) {
					const { response, statusCode } = validationErrorResponse("到期時間必須是未來時間");
					return reply.code(statusCode).send(response);
				}

				// Don't allow reducing usage limit below current usage
				if (updateData.usageLimit !== undefined && updateData.usageLimit < existingCode.usageCount) {
					const { response, statusCode } = validationErrorResponse(
						`使用次數限制不能低於已使用次數 (${existingCode.usageCount})`
					);
					return reply.code(statusCode).send(response);
				}

				// Prepare update data
				const updatePayload = {
					...updateData,
					...(updateData.expiresAt && { expiresAt: new Date(updateData.expiresAt) }),
					updatedAt: new Date()
				};

				/** @type {InvitationCode} */
				const invitationCode = await prisma.invitationCode.update({
					where: { id },
					data: updatePayload
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
					where: { id },
					include: {
						_count: {
							select: { registrations: true }
						}
					}
				});

				if (!existingCode) {
					const { response, statusCode } = notFoundResponse("邀請碼不存在");
					return reply.code(statusCode).send(response);
				}

				// Prevent deletion if there are registrations using this code
				if (existingCode._count.registrations > 0) {
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
		 * @param {import('fastify').FastifyRequest<{Querystring: {eventId?: string, isActive?: boolean}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { eventId, isActive } = request.query;

				// Build where clause
				const where = {};
				if (eventId) where.eventId = eventId;
				if (isActive !== undefined) where.isActive = isActive;

				/** @type {InvitationCode[]} */
				const invitationCodes = await prisma.invitationCode.findMany({
					where,
					include: {
						event: {
							select: {
								id: true,
								name: true,
								startDate: true,
								endDate: true
							}
						},
						_count: {
							select: {
								registrations: true
							}
						}
					},
					orderBy: { createdAt: 'desc' }
				});

				// Add status indicators
				const now = new Date();
				const codesWithStatus = invitationCodes.map(code => ({
					...code,
					isExpired: code.expiresAt && code.expiresAt < now,
					isExhausted: code.usageLimit && code.usageCount >= code.usageLimit,
					remainingUses: code.usageLimit ? Math.max(0, code.usageLimit - code.usageCount) : null
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
					type: 'object',
					properties: {
						eventId: {
							type: 'string',
							description: '活動 ID'
						},
						prefix: {
							type: 'string',
							description: '邀請碼前綴',
							minLength: 1
						},
						count: {
							type: 'integer',
							minimum: 1,
							maximum: 100,
							description: '生成數量'
						},
						usageLimit: {
							type: 'integer',
							minimum: 1,
							description: '使用次數限制'
						},
						expiresAt: {
							type: 'string',
							format: 'date-time',
							description: '到期時間'
						}
					},
					required: ['eventId', 'prefix', 'count']
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Body: {eventId: string, prefix: string, count: number, usageLimit?: number, expiresAt?: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { eventId, prefix, count, usageLimit, expiresAt } = request.body;

				// Verify event exists
				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				// Generate unique codes
				const codes = [];
				const existingCodes = await prisma.invitationCode.findMany({
					where: { eventId },
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
						eventId,
						code,
						description: `批量生成的邀請碼 - ${prefix}`,
						usageLimit,
						usageCount: 0,
						expiresAt: expiresAt ? new Date(expiresAt) : null,
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

				return reply.code(201).send(successResponse({
					count: codes.length,
					codes: codes.map(c => c.code)
				}, `成功創建 ${codes.length} 個邀請碼`));
			} catch (error) {
				console.error("Bulk create invitation codes error:", error);
				const { response, statusCode } = serverErrorResponse("批量創建邀請碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}