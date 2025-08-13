import prisma from "../../config/database.js";
import { requireAdmin } from "../../middleware/auth.js";
import { errorResponse, successResponse } from "../../utils/response.js";

export default async function adminEventsRoutes(fastify, options) {
	// Add auth middleware to all admin routes
	fastify.addHook("preHandler", requireAdmin);

	// 獲取活動詳細資訊
	fastify.get(
		"/events/:eventId",
		{
			schema: {
				description: "獲取活動詳細資訊",
				tags: ["admin-events"],
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
							data: {
								type: 'object',
								properties: {
									id: { type: 'string' },
									name: { type: 'string' },
									description: { type: 'string' },
									startDate: { type: 'string', format: 'date-time' },
									endDate: { type: 'string', format: 'date-time' },
									location: { type: 'string' },
									tickets: {
										type: 'array',
										items: { type: 'object' }
									},
									_count: {
										type: 'object',
										properties: {
											registrations: { type: 'integer' },
											invitationCodes: { type: 'integer' }
										}
									}
								}
							}
						}
					},
					404: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							error: { type: 'string' }
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { eventId } = request.params;

				const event = await prisma.event.findUnique({
					where: { id: eventId },
					include: {
						tickets: {
							where: { isActive: true },
							orderBy: { createdAt: "asc" }
						},
						_count: {
							select: {
								registrations: true,
								invitationCodes: true
							}
						}
					}
				});

				if (!event) {
					const { response, statusCode } = errorResponse("NOT_FOUND", "活動不存在", null, 404);
					return reply.code(statusCode).send(response);
				}

				return successResponse(event);
			} catch (error) {
				console.error("Get event error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得活動資訊失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 更新活動資訊
	fastify.put(
		"/events/:eventId",
		{
			schema: {
				description: "更新活動資訊",
				tags: ["admin-events"],
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
				body: {
					type: 'object',
					properties: {
						name: {
							type: 'string',
							description: '活動名稱'
						},
						description: {
							type: 'string',
							description: '活動描述'
						},
						startDate: {
							type: 'string',
							format: 'date-time',
							description: '開始時間'
						},
						endDate: {
							type: 'string',
							format: 'date-time',
							description: '結束時間'
						},
						location: {
							type: 'string',
							description: '地點'
						},
						venue: {
							type: 'string',
							description: '場地'
						},
						organizer: {
							type: 'string',
							description: '主辦單位'
						},
						contactPerson: {
							type: 'string',
							description: '聯絡人'
						},
						contactEmail: {
							type: 'string',
							format: 'email',
							description: '聯絡信箱'
						},
						contactPhone: {
							type: 'string',
							description: '聯絡電話'
						},
						website: {
							type: 'string',
							format: 'uri',
							description: '官網'
						}
					}
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							data: { type: 'object' },
							message: { type: 'string' }
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				const { eventId } = request.params;
				const { name, description, startDate, endDate, location, venue, organizer, contactPerson, contactEmail, contactPhone, website } = request.body;

				const event = await prisma.event.update({
					where: { id: eventId },
					data: {
						name,
						description,
						location,
						venue,
						organizer,
						contactPerson,
						contactEmail,
						contactPhone,
						website,
						startDate: startDate ? new Date(startDate) : undefined,
						endDate: endDate ? new Date(endDate) : undefined,
						updatedAt: new Date()
					}
				});

				return successResponse(event, "更新活動資訊成功");
			} catch (error) {
				console.error("Update event error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新活動資訊失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 更新活動首頁內容
	fastify.put(
		"/events/:eventId/landing-page",
		{
			schema: {
				description: "更新活動首頁內容",
				tags: ["admin-events"]
			}
		},
		async (request, reply) => {
			try {
				const { eventId } = request.params;
				const { heroTitle, heroSubtitle, description, schedule, venue, ogTitle, ogDescription, features } = request.body;

				const landingPageData = {
					heroTitle,
					heroSubtitle,
					description,
					schedule,
					venue,
					ogTitle,
					ogDescription,
					features
				};

				const event = await prisma.event.update({
					where: { id: eventId },
					data: {
						landingPage: JSON.stringify(landingPageData),
						updatedAt: new Date()
					}
				});

				return successResponse(event, "更新活動首頁內容成功");
			} catch (error) {
				console.error("Update landing page error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新活動首頁內容失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 上傳 OG 圖片
	fastify.post(
		"/events/:eventId/og-image",
		{
			schema: {
				description: "上傳 OG 圖片",
				tags: ["admin-events"]
			}
		},
		async (request, reply) => {
			try {
				const { eventId } = request.params;

				// TODO: Implement OG image upload logic
				return successResponse({ message: "OG 圖片上傳功能尚未實現" });
			} catch (error) {
				console.error("Upload OG image error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "上傳 OG 圖片失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}
