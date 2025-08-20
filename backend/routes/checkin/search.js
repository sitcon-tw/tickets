import prisma from "../../config/database.js";
import { errorResponse, successResponse } from "../../utils/response.js";

export default async function searchRoutes(fastify, options) {
	// 搜尋報名者
	fastify.get(
		"/registrations/search",
		{
			schema: {
				description: "搜尋報名者（支援多種搜尋方式）",
				tags: ["checkin"],
				querystring: {
					type: 'object',
					properties: {
						q: {
							type: 'string',
							description: '搜尋關鍵字'
						},
						type: {
							type: 'string',
							enum: ['all', 'email', 'checkInCode', 'orderNumber'],
							default: 'all',
							description: '搜尋類型'
						}
					},
					required: ['q']
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
										email: { type: 'string' },
										phone: { type: 'string' },
										status: { type: 'string' },
										checkInCode: { type: 'string' },
										isCheckedIn: { type: 'boolean' },
										ticket: {
											type: 'object',
											properties: {
												name: { type: 'string' }
											}
										},
										event: {
											type: 'object',
											properties: {
												name: { type: 'string' }
											}
										}
									}
								}
							}
						}
					},
					400: {
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
				const { q, type = "all" } = request.query;

				if (!q) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "搜尋關鍵字為必填");
					return reply.code(statusCode).send(response);
				}

				// Build search conditions
				let whereConditions = {
					status: { not: 'cancelled' }
				};

				// Search by different criteria based on type
				if (type === 'email') {
					whereConditions.email = {
						contains: q,
						mode: 'insensitive'
					};
				} else if (type === 'checkInCode') {
					whereConditions.referralCode = {
						contains: q,
						mode: 'insensitive'
					};
				} else if (type === 'orderNumber') {
					whereConditions.id = {
						contains: q,
						mode: 'insensitive'
					};
				} else {
					// Search all fields
					whereConditions.OR = [
						{ email: { contains: q, mode: 'insensitive' } },
						{ referralCode: { contains: q, mode: 'insensitive' } },
						{ id: { contains: q, mode: 'insensitive' } },
						{ phone: { contains: q, mode: 'insensitive' } }
					];
				}

				const registrations = await prisma.registration.findMany({
					where: whereConditions,
					include: {
						event: true,
						ticket: true,
						registrationData: {
							include: {
								field: true
							}
						}
					},
					take: 50, // Limit results
					orderBy: {
						createdAt: 'desc'
					}
				});

				// Format results for display
				const results = registrations.map(reg => {
					// Build form data for display
					const formData = {};
					reg.registrationData.forEach(data => {
						try {
							formData[data.field.name] = JSON.parse(data.value);
						} catch {
							formData[data.field.name] = data.value;
						}
					});

					return {
						id: reg.id,
						email: reg.email,
						phone: reg.phone,
						checkInCode: reg.referralCode,
						status: reg.status,
						checkInStatus: reg.checkInStatus,
						checkInTime: reg.checkInTime,
						event: reg.event,
						ticket: reg.ticket,
						formData: formData,
						createdAt: reg.createdAt
					};
				});

				return successResponse(results);
			} catch (error) {
				console.error("Search registrations error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "搜尋報名者失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}