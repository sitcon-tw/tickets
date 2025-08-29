import prisma from "#config/database.js";
import { errorResponse, successResponse } from "#utils/response.js";

export default async function adminInvitationCodesRoutes(fastify, options) {	// 獲取邀請碼列表
	fastify.get(
		"/invitation-codes",
		{
			schema: {
				description: "獲取邀請碼列表",
				tags: ["admin/invitation-codes"],
				querystring: {
					type: 'object',
					properties: {
						page: {
							type: 'integer',
							default: 1,
							minimum: 1,
							description: '頁碼'
						},
						limit: {
							type: 'integer',
							default: 20,
							minimum: 1,
							maximum: 100,
							description: '每頁筆數'
						},
						eventId: {
							type: 'string',
							description: '活動 ID 篩選'
						}
					}
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							data: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										code: { type: 'string' },
										name: { type: 'string' },
										description: { type: 'string' },
										usageLimit: { type: 'integer' },
										usedCount: { type: 'integer' },
										isActive: { type: 'boolean' },
										event: {
											type: 'object',
											properties: {
												id: { type: 'string' },
												name: { type: 'string' }
											}
										}
									}
								}
							},
							message: { type: 'string' },
							pagination: {
								type: 'object',
								properties: {
									page: { type: 'integer' },
									limit: { type: 'integer' },
									total: { type: 'integer' },
									totalPages: { type: 'integer' }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { page = 1, limit = 20, eventId } = request.query;
				const skip = (page - 1) * limit;
				const where = eventId ? { eventId } : {};

				const [codes, total] = await Promise.all([
					prisma.invitationCode.findMany({
						where,
						skip,
						take: parseInt(limit),
						include: {
							event: { select: { id: true, name: true } },
							tickets: { include: { ticket: { select: { id: true, name: true } } } }
						},
						orderBy: { createdAt: "desc" }
					}),
					prisma.invitationCode.count({ where })
				]);

				const pagination = {
					page: parseInt(page),
					limit: parseInt(limit),
					total,
					totalPages: Math.ceil(total / limit)
				};

				return successResponse(codes, "取得邀請碼列表成功", pagination);
			} catch (error) {
				console.error("Get invitation codes error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得邀請碼列表失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 自動生成邀請碼
	fastify.post(
		"/invitation-codes/generate",
		{
			schema: {
				description: "自動生成邀請碼",
				tags: ["admin/invitation-codes"],
				body: {
					type: 'object',
					properties: {
						eventId: {
							type: 'string',
							description: '活動 ID'
						},
						name: {
							type: 'string',
							description: '邀請碼名稱'
						},
						description: {
							type: 'string',
							description: '邀請碼描述'
						},
						count: {
							type: 'integer',
							minimum: 1,
							maximum: 1000,
							default: 1,
							description: '生成數量'
						},
						usageLimit: {
							type: 'integer',
							minimum: 1,
							description: '使用次數限制'
						},
						validFrom: {
							type: 'string',
							format: 'date-time',
							description: '有效開始時間'
						},
						validUntil: {
							type: 'string',
							format: 'date-time',
							description: '有效結束時間'
						},
						ticketIds: {
							type: 'array',
							items: { type: 'string' },
							description: '可用票種 ID 列表'
						}
					},
					required: ['eventId', 'name', 'ticketIds']
				},
				response: {
					201: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							data: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										code: { type: 'string' },
										name: { type: 'string' }
									}
								}
							},
							message: { type: 'string' }
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { ticketId, count, usageLimit, prefix, expiryDate } = request.body;

				if (!ticketId || !count) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "票種ID和生成數量為必填");
					return reply.code(statusCode).send(response);
				}

				// TODO: Implement invitation code generation logic
				return successResponse({ message: `已生成 ${count} 個邀請碼` });
			} catch (error) {
				console.error("Generate invitation codes error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "生成邀請碼失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 手動新增邀請碼
	fastify.post(
		"/invitation-codes",
		{
			schema: {
				description: "手動新增邀請碼",
				tags: ["admin/invitation-codes"]
			}
		},
		async (request, reply) => {
			try {
				const { code, ticketIds, usageLimit, description, expiryDate } = request.body;

				if (!code || !ticketIds || !Array.isArray(ticketIds)) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "邀請碼和票種ID列表為必填");
					return reply.code(statusCode).send(response);
				}

				// TODO: Implement manual invitation code creation
				return successResponse({ message: "邀請碼創建成功" });
			} catch (error) {
				console.error("Create invitation code error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "創建邀請碼失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 更新邀請碼設定
	fastify.put(
		"/invitation-codes/:codeId",
		{
			schema: {
				description: "更新邀請碼設定",
				tags: ["admin/invitation-codes"]
			}
		},
		async (request, reply) => {
			try {
				const { codeId } = request.params;
				const { usageLimit, isActive, expiryDate } = request.body;

				// TODO: Implement invitation code update
				return successResponse({ message: "邀請碼設定更新成功" });
			} catch (error) {
				console.error("Update invitation code error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新邀請碼設定失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 刪除邀請碼
	fastify.delete(
		"/invitation-codes/:codeId",
		{
			schema: {
				description: "刪除邀請碼",
				tags: ["admin/invitation-codes"]
			}
		},
		async (request, reply) => {
			try {
				const { codeId } = request.params;

				// TODO: Implement invitation code deletion
				return successResponse({ message: "邀請碼已刪除" });
			} catch (error) {
				console.error("Delete invitation code error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "刪除邀請碼失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 獲取邀請碼使用情況
	fastify.get(
		"/invitation-codes/:codeId/usage",
		{
			schema: {
				description: "獲取邀請碼使用情況",
				tags: ["admin/invitation-codes"]
			}
		},
		async (request, reply) => {
			try {
				const { codeId } = request.params;

				// TODO: Implement invitation code usage retrieval
				return successResponse({
					usageCount: 0,
					usageLimit: null,
					usageHistory: []
				});
			} catch (error) {
				console.error("Get invitation code usage error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得邀請碼使用情況失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}
