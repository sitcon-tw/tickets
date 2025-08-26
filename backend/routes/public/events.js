import prisma from "../../config/database.js";
import { errorResponse, successResponse } from "../../utils/response.js";

export default async function eventsRoutes(fastify, options) {
	// 活動基本資訊
	fastify.get(
		"/events/:eventId/info",
		{
			schema: {
				description: "獲取活動基本資訊（名稱、時間、地點、描述、OG 圖等）",
				tags: ["events"],
				params: {
					type: 'object',
					properties: {
						eventId: {
							type: 'string',
							description: '活動 ID'
						}
					},
					required: ['eventId']
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							message: { type: 'string' },
							data: {
								type: 'object',
								properties: {
									id: { type: 'string' },
									name: { type: 'string' },
									description: { type: 'string' },
									location: { type: 'string' },
									startDate: { type: 'string', format: 'date-time' },
									endDate: { type: 'string', format: 'date-time' },
									ogImage: { type: 'string' },
									landingPage: { type: 'string' }
								}
							}
						}
					},
					404: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							error: {
								type: 'object',
								properties: {
									code: { type: 'string' },
									message: { type: 'string' }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { eventId } = request.params;

				const event = await prisma.event.findUnique({
					where: { id: eventId, isActive: true },
					select: {
						id: true,
						name: true,
						description: true,
						location: true,
						startDate: true,
						endDate: true,
						ogImage: true,
						landingPage: true
					}
				});

				if (!event) {
					const { response, statusCode } = errorResponse("NOT_FOUND", "活動不存在", null, 404);
					return reply.code(statusCode).send(response);
				}

				return successResponse(event);
			} catch (error) {
				console.error("Get event info error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得活動資訊失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 獲取可用票種列表
	fastify.get(
		"/events/:eventId/tickets",
		{
			schema: {
				description: "獲取可用票種列表（含價格、數量、開售時間）",
				tags: ["events"],
				params: {
					type: 'object',
					properties: {
						eventId: {
							type: 'string',
							description: '活動 ID'
						}
					},
					required: ['eventId']
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							message: { type: 'string' },
							data: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										name: { type: 'string' },
										description: { type: 'string' },
										price: { type: 'number' },
										quantity: { type: 'integer' },
										soldCount: { type: 'integer' },
										saleStart: { type: 'string', format: 'date-time' },
										saleEnd: { type: 'string', format: 'date-time' }
									}
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { eventId } = request.params;

				const tickets = await prisma.ticket.findMany({
					where: {
						eventId: eventId,
						isActive: true,
					},
					select: {
						id: true,
						name: true,
						description: true,
						price: true,
						quantity: true,
						soldCount: true,
						saleStart: true,
						saleEnd: true
					},
					orderBy: { createdAt: "asc" }
				});

				return successResponse(tickets);
			} catch (error) {
				console.error("Get tickets error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得票種列表失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 獲取特定票種的表單欄位
	fastify.get(
		"/events/:eventId/form-fields/:ticketId",
		{
			schema: {
				description: "獲取特定票種的表單欄位配置",
				tags: ["events"],
				params: {
					type: 'object',
					properties: {
						eventId: {
							type: 'string',
							description: '活動 ID'
						},
						ticketId: {
							type: 'string',
							description: '票種 ID'
						}
					},
					required: ['eventId', 'ticketId']
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							message: { type: 'string' },
							data: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										name: { type: 'string' },
										label: { type: 'string' },
										type: { type: 'string' },
										options: { type: 'string' },
										placeholder: { type: 'string' },
										helpText: { type: 'string' },
										validation: { type: 'string' },
										isRequired: { type: 'boolean' },
										order: { type: 'integer' }
									}
								}
							}
						}
					},
					404: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							error: {
								type: 'object',
								properties: {
									code: { type: 'string' },
									message: { type: 'string' }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { eventId, ticketId } = request.params;

				// Verify ticket belongs to event
				const ticket = await prisma.ticket.findFirst({
					where: { id: ticketId, eventId, isActive: true }
				});

				if (!ticket) {
					const { response, statusCode } = errorResponse("NOT_FOUND", "票種不存在", null, 404);
					return reply.code(statusCode).send(response);
				}

				const formFields = await prisma.ticketFormField.findMany({
					where: {
						ticketId,
						isVisible: true,
						field: { isActive: true }
					},
					include: {
						field: {
							select: {
								id: true,
								name: true,
								label: true,
								type: true,
								options: true,
								placeholder: true,
								helpText: true,
								validation: true
							}
						}
					},
					orderBy: { order: "asc" }
				});

				const fields = formFields.map(tf => ({
					...tf.field,
					isRequired: tf.isRequired,
					order: tf.order
				}));

				return successResponse(fields);
			} catch (error) {
				console.error("Get form fields error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得表單欄位失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 透過邀請碼進入活動頁面
	fastify.get(
		"/events/:eventId",
		{
			schema: {
				description: "透過邀請碼進入活動頁面",
				tags: ["events"],
				params: {
					type: 'object',
					properties: {
						eventId: {
							type: 'string',
							description: '活動 ID'
						}
					},
					required: ['eventId']
				},
				querystring: {
					type: 'object',
					properties: {
						inviteCode: {
							type: 'string',
							description: '邀請碼'
						}
					}
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							message: { type: 'string' },
							data: {
								type: 'object',
								properties: {
									event: {
										type: 'object',
										properties: {
											id: { type: 'string' },
											name: { type: 'string' },
											description: { type: 'string' },
											location: { type: 'string' },
											startDate: { type: 'string', format: 'date-time' },
											endDate: { type: 'string', format: 'date-time' }
										}
									},
									availableTickets: {
										type: 'array',
										items: {
											type: 'object',
											properties: {
												id: { type: 'string' },
												name: { type: 'string' },
												price: { type: 'number' },
												quantity: { type: 'integer' }
											}
										}
									},
									hasValidInviteCode: { type: 'boolean' }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { eventId } = request.params;
				const { inviteCode } = request.query;

				const event = await prisma.event.findUnique({
					where: { id: eventId, isActive: true },
					select: {
						id: true,
						name: true,
						description: true,
						location: true,
						startDate: true,
						endDate: true,
						ogImage: true,
						landingPage: true
					}
				});

				if (!event) {
					const { response, statusCode } = errorResponse("NOT_FOUND", "活動不存在", null, 404);
					return reply.code(statusCode).send(response);
				}

				let availableTickets = [];

				if (inviteCode) {
					// Verify invitation code and get available tickets
					const invitationCode = await prisma.invitationCode.findFirst({
						where: {
							code: inviteCode,
							eventId,
							isActive: true,
							OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }],
							OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
							OR: [{ usageLimit: null }, { usedCount: { lt: prisma.invitationCode.fields.usageLimit } }]
						},
						include: {
							tickets: {
								include: {
									ticket: {
										select: {
											id: true,
											name: true,
											description: true,
											price: true,
											quantity: true,
											soldCount: true
										}
									}
								}
							}
						}
					});

					if (invitationCode) {
						availableTickets = invitationCode.tickets.map(it => it.ticket);
					}
				}

				return successResponse({
					event,
					availableTickets,
					hasValidInviteCode: !!inviteCode && availableTickets.length > 0
				});
			} catch (error) {
				console.error("Get event with invite code error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得活動資訊失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}
