import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import type { TicketCreateRequest, TicketUpdateRequest } from "#types/api.js";

import prisma from "#config/database.js";
import { requireEventAccess, requireEventAccessViaTicketId } from "#middleware/auth.js";
import { ticketSchemas } from "#schemas/ticket.js";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response.js";

const adminTicketsRoutes: FastifyPluginAsync = async (fastify) => {
	// Create new ticket
	fastify.post<{ Body: TicketCreateRequest }>(
		"/tickets",
		{
			preHandler: requireEventAccess,
			schema: ticketSchemas.createTicket
		},
		async (request: FastifyRequest<{ Body: TicketCreateRequest }>, reply: FastifyReply) => {
			try {
				const { eventId, name, description, price, quantity, saleStart, saleEnd, requireInviteCode, hidden } = request.body;

				// Verify event exists
				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				// Validate sale dates
				if (saleStart && saleEnd) {
					const saleStartDate = new Date(saleStart);
					const saleEndDate = new Date(saleEnd);

					if (isNaN(saleStartDate.getTime()) || isNaN(saleEndDate.getTime())) {
						const { response, statusCode } = validationErrorResponse("無效的販售日期格式");
						return reply.code(statusCode).send(response);
					}

					if (saleStartDate >= saleEndDate) {
						const { response, statusCode } = validationErrorResponse("販售開始時間必須早於結束時間");
						return reply.code(statusCode).send(response);
					}

					// Sale end should not be after event start
					if (saleEndDate > event.startDate) {
						const { response, statusCode } = validationErrorResponse("販售結束時間不應晚於活動開始時間");
						return reply.code(statusCode).send(response);
					}
				}

				const ticket = await prisma.ticket.create({
					data: {
						eventId,
						name,
						description,
						price,
						quantity,
						soldCount: 0,
						saleStart: saleStart ? new Date(saleStart) : null,
						saleEnd: saleEnd ? new Date(saleEnd) : null,
						isActive: true,
						requireInviteCode,
						hidden: hidden ?? false
					},
					// @ts-expect-error - uncache is added by prisma-extension-redis
					uncache: {
						uncacheKeys: ["prisma:event:*"],
						hasPattern: true
					}
				});

				return reply.code(201).send(successResponse(ticket, "票券創建成功"));
			} catch (error) {
				console.error("Create ticket error:", error);
				const { response, statusCode } = serverErrorResponse("創建票券失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get ticket by ID
	fastify.get<{ Params: { id: string } }>(
		"/tickets/:id",
		{
			preHandler: requireEventAccessViaTicketId,
			schema: ticketSchemas.getTicket
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;

				const ticket = await prisma.ticket.findUnique({
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

				if (!ticket) {
					const { response, statusCode } = notFoundResponse("票券不存在");
					return reply.code(statusCode).send(response);
				}

				return reply.send(successResponse(ticket));
			} catch (error) {
				console.error("Get ticket error:", error);
				const { response, statusCode } = serverErrorResponse("取得票券資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Update ticket
	fastify.put<{ Params: { id: string }; Body: TicketUpdateRequest }>(
		"/tickets/:id",
		{
			preHandler: requireEventAccessViaTicketId,
			schema: ticketSchemas.updateTicket
		},
		async (request: FastifyRequest<{ Params: { id: string }; Body: TicketUpdateRequest }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;
				const updateData = request.body;

				// Check if ticket exists
				const existingTicket = await prisma.ticket.findUnique({
					where: { id },
					include: {
						event: {
							select: {
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

				if (!existingTicket) {
					const { response, statusCode } = notFoundResponse("票券不存在");
					return reply.code(statusCode).send(response);
				}

				// Prevent quantity reduction below sold amount
				if (updateData.quantity !== undefined && updateData.quantity < existingTicket.soldCount) {
					const { response, statusCode } = validationErrorResponse(`票券數量不能低於已售出數量 (${existingTicket.soldCount})`);
					return reply.code(statusCode).send(response);
				}

				// Validate sale dates if provided
				if (updateData.saleStart || updateData.saleEnd) {
					const saleStart = updateData.saleStart ? new Date(updateData.saleStart) : existingTicket.saleStart;
					const saleEnd = updateData.saleEnd ? new Date(updateData.saleEnd) : existingTicket.saleEnd;

					if (updateData.saleStart && isNaN(new Date(updateData.saleStart).getTime())) {
						const { response, statusCode } = validationErrorResponse("無效的販售開始日期格式");
						return reply.code(statusCode).send(response);
					}

					if (updateData.saleEnd && isNaN(new Date(updateData.saleEnd).getTime())) {
						const { response, statusCode } = validationErrorResponse("無效的販售結束日期格式");
						return reply.code(statusCode).send(response);
					}

					if (saleStart && saleEnd && saleStart >= saleEnd) {
						const { response, statusCode } = validationErrorResponse("販售開始時間必須早於結束時間");
						return reply.code(statusCode).send(response);
					}

					if (saleEnd && saleEnd > existingTicket.event.startDate) {
						const { response, statusCode } = validationErrorResponse("販售結束時間不應晚於活動開始時間");
						return reply.code(statusCode).send(response);
					}
				}

				// Prepare update data
				const updatePayload: any = {
					...updateData,
					...(updateData.saleStart && { saleStart: new Date(updateData.saleStart) }),
					...(updateData.saleEnd && { saleEnd: new Date(updateData.saleEnd) }),
					updatedAt: new Date()
				};

				const ticket = await prisma.ticket.update({
					where: { id },
					data: updatePayload,
					// @ts-expect-error - uncache is added by prisma-extension-redis
					uncache: {
						uncacheKeys: ["prisma:ticket:*", "prisma:event:*"],
						hasPattern: true
					}
				});

				return reply.send(successResponse(ticket, "票券更新成功"));
			} catch (error) {
				console.error("Update ticket error:", error);
				const { response, statusCode } = serverErrorResponse("更新票券失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Delete ticket
	fastify.delete<{ Params: { id: string } }>(
		"/tickets/:id",
		{
			preHandler: requireEventAccessViaTicketId,
			schema: ticketSchemas.deleteTicket
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;

				// Check if ticket exists
				const existingTicket = await prisma.ticket.findUnique({
					where: { id },
					include: {
						_count: {
							select: { registrations: true }
						}
					}
				});

				if (!existingTicket) {
					const { response, statusCode } = notFoundResponse("票券不存在");
					return reply.code(statusCode).send(response);
				}

				// Prevent deletion if there are registrations
				if (existingTicket._count.registrations > 0) {
					const { response, statusCode } = conflictResponse("無法刪除已有報名的票券");
					return reply.code(statusCode).send(response);
				}

				await prisma.ticket.delete({
					where: { id },
					// @ts-expect-error - uncache is added by prisma-extension-redis
					uncache: {
						uncacheKeys: ["prisma:ticket:*", "prisma:event:*"],
						hasPattern: true
					}
				});

				return reply.send(successResponse(null, "票券刪除成功"));
			} catch (error) {
				console.error("Delete ticket error:", error);
				const { response, statusCode } = serverErrorResponse("刪除票券失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// List tickets
	fastify.get<{ Querystring: { eventId?: string; isActive?: boolean } }>(
		"/tickets",
		{
			preHandler: requireEventAccess,
			schema: ticketSchemas.listTickets
		},
		async (request: FastifyRequest<{ Querystring: { eventId?: string; isActive?: boolean } }>, reply: FastifyReply) => {
			try {
				const { eventId, isActive } = request.query;

				// Build where clause
				const where: any = {};
				if (eventId) where.eventId = eventId;
				if (isActive !== undefined) where.isActive = isActive;

				const tickets = await prisma.ticket.findMany({
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
					orderBy: { createdAt: "desc" }
				});

				// Add availability status to each ticket
				const ticketsWithAvailability = tickets.map(ticket => {
					const now = new Date();
					const isOnSale = (!ticket.saleStart || now >= ticket.saleStart) && (!ticket.saleEnd || now <= ticket.saleEnd);
					const available = ticket.quantity - ticket.soldCount;
					const isSoldOut = available <= 0;

					return {
						...ticket,
						available,
						isOnSale,
						isSoldOut
					};
				});

				return reply.send(successResponse(ticketsWithAvailability));
			} catch (error) {
				console.error("List tickets error:", error);
				const { response, statusCode } = serverErrorResponse("取得票券列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get ticket sales analytics
	fastify.get<{ Params: { id: string } }>(
		"/tickets/:id/analytics",
		{
			schema: {
				description: "取得票券銷售分析",
				tags: ["admin/tickets"],
				params: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "票券 ID"
						}
					},
					required: ["id"]
				},
				response: {
					200: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							message: { type: "string" },
							data: {
								type: "object",
								properties: {
									totalsoldCount: { type: "integer" },
									totalRevenue: { type: "number" },
									availableQuantity: { type: "integer" },
									salesByStatus: { type: "object" },
									dailySales: { type: "array" }
								}
							}
						}
					}
				}
			}
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;

				// Check if ticket exists
				const ticket = await prisma.ticket.findUnique({
					where: { id }
				});

				if (!ticket) {
					const { response, statusCode } = notFoundResponse("票券不存在");
					return reply.code(statusCode).send(response);
				}

				// Get registration statistics
				const [salesByStatus, dailySales] = await Promise.all([
					// Sales by registration status
					prisma.registration.groupBy({
						by: ["status"],
						where: { ticketId: id },
						_count: { id: true }
					}),
					// Daily sales data
					prisma.$queryRaw`
						SELECT
							DATE(createdAt) as date,
							COUNT(*) as count,
							SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count
						FROM Registration
						WHERE ticketId = ${id}
						GROUP BY DATE(createdAt)
						ORDER BY date DESC
						LIMIT 30
					`
				]);

				const totalSold = ticket.soldCount;
				const totalRevenue = totalSold * ticket.price;
				const availableQuantity = ticket.quantity - ticket.soldCount;

				const analytics = {
					totalSold,
					totalRevenue,
					availableQuantity,
					salesByStatus: salesByStatus.reduce((acc: any, item) => {
						acc[item.status] = item._count.id;
						return acc;
					}, {}),
					dailySales
				};

				return reply.send(successResponse(analytics));
			} catch (error) {
				console.error("Get ticket analytics error:", error);
				const { response, statusCode } = serverErrorResponse("取得票券分析失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default adminTicketsRoutes;
