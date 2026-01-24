import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { LocalizedTextSchema } from "@sitcontix/types";
import prisma from "#config/database";
import { requireEventAccess, requireEventAccessViaTicketId } from "#middleware/auth";
import { adminTicketSchemas, ticketSchemas } from "#schemas";
import { logger } from "#utils/logger";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";

const componentLogger = logger.child({ component: "admin/tickets" });

const adminTicketsRoutes: FastifyPluginAsync = async fastify => {
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/tickets",
		{
			preHandler: requireEventAccess,
			schema: ticketSchemas.createTicket
		},
		async (request, reply) => {
			try {
				const { eventId, name, description, price, quantity, saleStart, saleEnd, requireInviteCode, hidden, showRemaining } = request.body;

				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

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

					if (saleEndDate > event.startDate) {
						const { response, statusCode } = validationErrorResponse("販售結束時間不應晚於活動開始時間");
						return reply.code(statusCode).send(response);
					}
				}

				// Get the highest order for this event to set new ticket order
				const maxOrderTicket = await prisma.ticket.findFirst({
					where: { eventId },
					orderBy: { order: "desc" },
					select: { order: true }
				});

				const nextOrder = (maxOrderTicket?.order ?? -1) + 1;

				const ticket = await prisma.ticket.create({
					data: {
						eventId,
						order: request.body.order ?? nextOrder,
						name,
						description,
						price,
						quantity,
						soldCount: 0,
						saleStart: saleStart ? new Date(saleStart) : null,
						saleEnd: saleEnd ? new Date(saleEnd) : null,
						isActive: true,
						requireInviteCode,
						hidden: hidden ?? false,
						showRemaining: showRemaining ?? true
					}
				});


				const responseTicket = {
					...ticket,
					name: LocalizedTextSchema.parse(ticket.name),
					description: LocalizedTextSchema.nullable().parse(ticket.description),
					plainDescription: LocalizedTextSchema.nullable().parse(ticket.plainDescription),
				};

				return reply.code(201).send(successResponse(responseTicket, "票券創建成功"));
			} catch (error) {
				componentLogger.error({ error }, "Create ticket error");
				const { response, statusCode } = serverErrorResponse("創建票券失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/tickets/:id",
		{
			preHandler: requireEventAccessViaTicketId,
			schema: ticketSchemas.getTicket
		},
		async (request, reply) => {
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

				const responseTicket = {
					...ticket,
					name: LocalizedTextSchema.parse(ticket.name),
					description: LocalizedTextSchema.nullable().parse(ticket.description),
					plainDescription: LocalizedTextSchema.nullable().parse(ticket.plainDescription),
					event: ticket.event
						? {
								...ticket.event,
								name: LocalizedTextSchema.parse(ticket.event.name),
							}
						: undefined
				};

				return reply.send(successResponse(responseTicket));
			} catch (error) {
				componentLogger.error({ error }, "Get ticket error");
				const { response, statusCode } = serverErrorResponse("取得票券資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	fastify.withTypeProvider<ZodTypeProvider>().put(
		"/tickets/:id",
		{
			preHandler: requireEventAccessViaTicketId,
			schema: ticketSchemas.updateTicket
		},
		async (request, reply) => {
			try {
				const { id } = request.params;
				const updateData = request.body;

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

				if (updateData.quantity !== undefined && updateData.quantity < existingTicket.soldCount) {
					const { response, statusCode } = validationErrorResponse(`票券數量不能低於已售出數量 (${existingTicket.soldCount})`);
					return reply.code(statusCode).send(response);
				}

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

				const updatePayload: any = {
					...updateData,
					...(updateData.saleStart && { saleStart: new Date(updateData.saleStart) }),
					...(updateData.saleEnd && { saleEnd: new Date(updateData.saleEnd) }),
					updatedAt: new Date()
				};

				const ticket = await prisma.ticket.update({
					where: { id },
					data: updatePayload
				});

				const responseTicket = {
					...ticket,
					name: LocalizedTextSchema.parse(ticket.name),
					description: LocalizedTextSchema.nullable().parse(ticket.description),
					plainDescription: LocalizedTextSchema.nullable().parse(ticket.plainDescription),
				};

				return reply.send(successResponse(responseTicket, "票券更新成功"));
			} catch (error) {
				componentLogger.error({ error }, "Update ticket error");
				const { response, statusCode } = serverErrorResponse("更新票券失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	fastify.withTypeProvider<ZodTypeProvider>().delete(
		"/tickets/:id",
		{
			preHandler: requireEventAccessViaTicketId,
			schema: ticketSchemas.deleteTicket
		},
		async (request, reply) => {
			try {
				const { id } = request.params;

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

				if (existingTicket._count.registrations > 0) {
					const { response, statusCode } = conflictResponse("無法刪除已有報名的票券");
					return reply.code(statusCode).send(response);
				}

				await prisma.ticket.delete({
					where: { id }
				});

				return reply.send(successResponse(null, "票券刪除成功"));
			} catch (error) {
				componentLogger.error({ error }, "Delete ticket error");
				const { response, statusCode } = serverErrorResponse("刪除票券失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// List tickets
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/tickets",
		{
			preHandler: requireEventAccess,
			schema: ticketSchemas.listTickets
		},
		async (request, reply) => {
			try {
				const { eventId, isActive } = request.query;

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
					orderBy: { order: "asc" }
				});

				const ticketsWithAvailability = tickets.map(ticket => {
					const now = new Date();
					const isOnSale = (!ticket.saleStart || now >= ticket.saleStart) && (!ticket.saleEnd || now <= ticket.saleEnd);
					const available = ticket.quantity - ticket.soldCount;
					const isSoldOut = available <= 0;

					return {
						...ticket,
						name: LocalizedTextSchema.parse(ticket.name),
						description: LocalizedTextSchema.nullable().parse(ticket.description),
						plainDescription: LocalizedTextSchema.nullable().parse(ticket.plainDescription),
						event: ticket.event
							? {
									...ticket.event,
									name: LocalizedTextSchema.parse(ticket.event.name),
								}
							: undefined,
						available,
						isOnSale,
						isSoldOut
					};
				});

				return reply.send(successResponse(ticketsWithAvailability));
			} catch (error) {
				componentLogger.error({ error }, "List tickets error");
				const { response, statusCode } = serverErrorResponse("取得票券列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/tickets/:id/analytics",
		{
			schema: adminTicketSchemas.getTicketAnalytics
		},
		async (request, reply) => {
			try {
				const { id } = request.params;

				const ticket = await prisma.ticket.findUnique({
					where: { id }
				});

				if (!ticket) {
					const { response, statusCode } = notFoundResponse("票券不存在");
					return reply.code(statusCode).send(response);
				}

				const [salesByStatus, dailySales] = await Promise.all([
					prisma.registration.groupBy({
						by: ["status"],
						where: { ticketId: id },
						_count: { id: true }
					}),
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
					dailySales: dailySales as unknown[]
				};

				return reply.send(successResponse(analytics));
			} catch (error) {
				componentLogger.error({ error }, "Get ticket analytics error");
				const { response, statusCode } = serverErrorResponse("取得票券分析失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Reorder tickets
	fastify.withTypeProvider<ZodTypeProvider>().put(
		"/tickets/reorder",
		{
			preHandler: requireEventAccess,
			schema: adminTicketSchemas.reorderTickets
		},
		async (request, reply) => {
			try {
				const { tickets } = request.body;

				if (!tickets || tickets.length === 0) {
					const { response, statusCode } = validationErrorResponse("票券列表不能為空");
					return reply.code(statusCode).send(response);
				}

				// Validate all tickets exist
				const ticketIds = tickets.map(t => t.id);
				const existingTickets = await prisma.ticket.findMany({
					where: { id: { in: ticketIds } },
					select: { id: true, eventId: true }
				});

				if (existingTickets.length !== tickets.length) {
					const { response, statusCode } = notFoundResponse("部分票券不存在");
					return reply.code(statusCode).send(response);
				}

				// Validate all tickets belong to the same event
				const eventIds = [...new Set(existingTickets.map(t => t.eventId))];
				if (eventIds.length > 1) {
					const { response, statusCode } = validationErrorResponse("所有票券必須屬於同一個活動");
					return reply.code(statusCode).send(response);
				}

				// Validate no duplicate orders
				const orders = tickets.map(t => t.order);
				const uniqueOrders = new Set(orders);
				if (uniqueOrders.size !== orders.length) {
					const { response, statusCode } = validationErrorResponse("票券順序不能重複");
					return reply.code(statusCode).send(response);
				}

				// Update all tickets in a transaction
				await prisma.$transaction(
					tickets.map(ticket =>
						prisma.ticket.update({
							where: { id: ticket.id },
							data: { order: ticket.order }
						})
					)
				);

				return reply.send(successResponse(null, "票券順序更新成功"));
			} catch (error) {
				componentLogger.error({ error }, "Reorder tickets error");
				const { response, statusCode } = serverErrorResponse("重新排序票券失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default adminTicketsRoutes;
