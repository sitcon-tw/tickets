import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { requireEventAccess, requireEventAccessViaTicketId } from "#middleware/auth";
import { adminTicketSchemas, ticketSchemas } from "#schemas";
import { logger } from "#utils/logger";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";
import { LocalizedTextSchema } from "@sitcontix/types";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const componentLogger = logger.child({ component: "admin/tickets" });

const adminTicketsRoutes: FastifyPluginAsync = async fastify => {
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/tickets",
		{
			preHandler: requireEventAccess,
			schema: ticketSchemas.createTicket
		},
		async (request, reply) => {
			const { eventId, name, description, price, quantity, saleStart, saleEnd, requireInviteCode, hidden, showRemaining } = request.body;

			const span = tracer.startSpan("route.admin.tickets.create", {
				attributes: {
					"ticket.eventId": eventId,
					"ticket.price": price,
					"ticket.quantity": quantity,
					"ticket.requireInviteCode": requireInviteCode || false,
					"ticket.hidden": hidden || false
				}
			});

			try {
				span.addEvent("database.query.findUnique");

				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					span.addEvent("event.not_found");
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				if (saleStart && saleEnd) {
					const saleStartDate = new Date(saleStart);
					const saleEndDate = new Date(saleEnd);

					if (isNaN(saleStartDate.getTime()) || isNaN(saleEndDate.getTime())) {
						span.addEvent("ticket.validation.invalid_date_format");
						span.setStatus({ code: SpanStatusCode.OK });
						span.end();

						const { response, statusCode } = validationErrorResponse("無效的販售日期格式");
						return reply.code(statusCode).send(response);
					}

					if (saleStartDate >= saleEndDate) {
						span.addEvent("ticket.validation.invalid_date_range");
						span.setStatus({ code: SpanStatusCode.OK });
						span.end();

						const { response, statusCode } = validationErrorResponse("販售開始時間必須早於結束時間");
						return reply.code(statusCode).send(response);
					}

					if (saleEndDate > event.startDate) {
						span.addEvent("ticket.validation.sale_end_after_event_start");
						span.setStatus({ code: SpanStatusCode.OK });
						span.end();

						const { response, statusCode } = validationErrorResponse("販售結束時間不應晚於活動開始時間");
						return reply.code(statusCode).send(response);
					}
				}

				// Get the highest order for this event to set new ticket order
				span.addEvent("database.query.findFirst");
				const maxOrderTicket = await prisma.ticket.findFirst({
					where: { eventId },
					orderBy: { order: "desc" },
					select: { order: true }
				});

				const nextOrder = (maxOrderTicket?.order ?? -1) + 1;
				span.setAttribute("ticket.order", request.body.order ?? nextOrder);

				span.addEvent("database.query.create");
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

				span.setAttribute("ticket.id", ticket.id);
				span.addEvent("ticket.created");

				const responseTicket = {
					...ticket,
					name: LocalizedTextSchema.parse(ticket.name),
					description: LocalizedTextSchema.nullable().parse(ticket.description),
					plainDescription: LocalizedTextSchema.nullable().parse(ticket.plainDescription)
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.code(201).send(successResponse(responseTicket, "票券創建成功"));
			} catch (error) {
				componentLogger.error({ error }, "Create ticket error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to create ticket"
				});

				const { response, statusCode } = serverErrorResponse("創建票券失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
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
			const { id } = request.params;

			const span = tracer.startSpan("route.admin.tickets.get", {
				attributes: {
					"ticket.id": id
				}
			});

			try {
				span.addEvent("database.query.findUnique");

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
					span.addEvent("ticket.not_found");
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = notFoundResponse("票券不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("ticket.price", Number(ticket.price));
				span.setAttribute("ticket.sold_count", ticket.soldCount);
				span.setAttribute("ticket.registrations.count", ticket._count.registrations);

				const responseTicket = {
					...ticket,
					name: LocalizedTextSchema.parse(ticket.name),
					description: LocalizedTextSchema.nullable().parse(ticket.description),
					plainDescription: LocalizedTextSchema.nullable().parse(ticket.plainDescription),
					event: ticket.event
						? {
								...ticket.event,
								name: LocalizedTextSchema.parse(ticket.event.name)
							}
						: undefined
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(responseTicket));
			} catch (error) {
				componentLogger.error({ error }, "Get ticket error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get ticket"
				});

				const { response, statusCode } = serverErrorResponse("取得票券資訊失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
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
			const { id } = request.params;
			const updateData = request.body;

			const span = tracer.startSpan("route.admin.tickets.update", {
				attributes: {
					"ticket.id": id
				}
			});

			try {
				span.addEvent("database.query.findUnique");

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
					span.addEvent("ticket.not_found");
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = notFoundResponse("票券不存在");
					return reply.code(statusCode).send(response);
				}

				if (updateData.quantity !== undefined && updateData.quantity < existingTicket.soldCount) {
					span.addEvent("ticket.validation.quantity_below_sold", {
						"ticket.quantity.new": updateData.quantity,
						"ticket.sold_count": existingTicket.soldCount
					});
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = validationErrorResponse(`票券數量不能低於已售出數量 (${existingTicket.soldCount})`);
					return reply.code(statusCode).send(response);
				}

				if (updateData.saleStart || updateData.saleEnd) {
					const saleStart = updateData.saleStart ? new Date(updateData.saleStart) : existingTicket.saleStart;
					const saleEnd = updateData.saleEnd ? new Date(updateData.saleEnd) : existingTicket.saleEnd;

					if (updateData.saleStart && isNaN(new Date(updateData.saleStart).getTime())) {
						span.addEvent("ticket.validation.invalid_sale_start_format");
						span.setStatus({ code: SpanStatusCode.OK });
						span.end();

						const { response, statusCode } = validationErrorResponse("無效的販售開始日期格式");
						return reply.code(statusCode).send(response);
					}

					if (updateData.saleEnd && isNaN(new Date(updateData.saleEnd).getTime())) {
						span.addEvent("ticket.validation.invalid_sale_end_format");
						span.setStatus({ code: SpanStatusCode.OK });
						span.end();

						const { response, statusCode } = validationErrorResponse("無效的販售結束日期格式");
						return reply.code(statusCode).send(response);
					}

					if (saleStart && saleEnd && saleStart >= saleEnd) {
						span.addEvent("ticket.validation.invalid_sale_date_range");
						span.setStatus({ code: SpanStatusCode.OK });
						span.end();

						const { response, statusCode } = validationErrorResponse("販售開始時間必須早於結束時間");
						return reply.code(statusCode).send(response);
					}

					if (saleEnd && saleEnd > existingTicket.event.startDate) {
						span.addEvent("ticket.validation.sale_end_after_event_start");
						span.setStatus({ code: SpanStatusCode.OK });
						span.end();

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

				if (updateData.quantity !== undefined) {
					span.setAttribute("ticket.quantity.new", updateData.quantity);
				}
				if (updateData.price !== undefined) {
					span.setAttribute("ticket.price.new", updateData.price);
				}

				span.addEvent("database.query.update");

				const ticket = await prisma.ticket.update({
					where: { id },
					data: updatePayload
				});

				span.addEvent("ticket.updated");

				const responseTicket = {
					...ticket,
					name: LocalizedTextSchema.parse(ticket.name),
					description: LocalizedTextSchema.nullable().parse(ticket.description),
					plainDescription: LocalizedTextSchema.nullable().parse(ticket.plainDescription)
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(responseTicket, "票券更新成功"));
			} catch (error) {
				componentLogger.error({ error }, "Update ticket error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to update ticket"
				});

				const { response, statusCode } = serverErrorResponse("更新票券失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
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
			const { id } = request.params;

			const span = tracer.startSpan("route.admin.tickets.delete", {
				attributes: {
					"ticket.id": id
				}
			});

			try {
				span.addEvent("database.query.findUnique");

				const existingTicket = await prisma.ticket.findUnique({
					where: { id },
					include: {
						_count: {
							select: { registrations: true }
						}
					}
				});

				if (!existingTicket) {
					span.addEvent("ticket.not_found");
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = notFoundResponse("票券不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("ticket.registrations.count", existingTicket._count.registrations);

				if (existingTicket._count.registrations > 0) {
					span.addEvent("ticket.validation.has_registrations");
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = conflictResponse("無法刪除已有報名的票券");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("database.query.delete");
				await prisma.ticket.delete({
					where: { id }
				});

				span.addEvent("ticket.deleted");
				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(successResponse(null, "票券刪除成功"));
			} catch (error) {
				componentLogger.error({ error }, "Delete ticket error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to delete ticket"
				});

				const { response, statusCode } = serverErrorResponse("刪除票券失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
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
			const { eventId, isActive } = request.query;

			const span = tracer.startSpan("route.admin.tickets.list", {
				attributes: {
					"tickets.filter.eventId": eventId || "",
					"tickets.filter.isActive": isActive !== undefined ? isActive : ""
				}
			});

			try {
				const where: any = {};
				if (eventId) where.eventId = eventId;
				if (isActive !== undefined) where.isActive = isActive;

				span.addEvent("database.query.findMany");

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

				span.setAttribute("tickets.found", tickets.length);
				span.addEvent("tickets.calculate_availability");

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
									name: LocalizedTextSchema.parse(ticket.event.name)
								}
							: undefined,
						available,
						isOnSale,
						isSoldOut
					};
				});

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(ticketsWithAvailability));
			} catch (error) {
				componentLogger.error({ error }, "List tickets error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to list tickets"
				});

				const { response, statusCode } = serverErrorResponse("取得票券列表失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/tickets/:id/analytics",
		{
			schema: adminTicketSchemas.getTicketAnalytics
		},
		async (request, reply) => {
			const { id } = request.params;

			const span = tracer.startSpan("route.admin.tickets.analytics", {
				attributes: {
					"ticket.id": id
				}
			});

			try {
				span.addEvent("database.query.findUnique");

				const ticket = await prisma.ticket.findUnique({
					where: { id }
				});

				if (!ticket) {
					span.addEvent("ticket.not_found");
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = notFoundResponse("票券不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("ticket.sold_count", ticket.soldCount);
				span.setAttribute("ticket.price", Number(ticket.price));

				span.addEvent("database.query.analytics");

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

				span.setAttribute("analytics.totalSold", totalSold);
				span.setAttribute("analytics.totalRevenue", Number(totalRevenue));
				span.setAttribute("analytics.availableQuantity", availableQuantity);
				span.addEvent("analytics.calculated");

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

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(analytics));
			} catch (error) {
				componentLogger.error({ error }, "Get ticket analytics error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get ticket analytics"
				});

				const { response, statusCode } = serverErrorResponse("取得票券分析失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
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
			const { tickets } = request.body;

			const span = tracer.startSpan("route.admin.tickets.reorder", {
				attributes: {
					"tickets.reorder.count": tickets?.length || 0
				}
			});

			try {
				if (!tickets || tickets.length === 0) {
					span.addEvent("tickets.validation.empty_list");
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = validationErrorResponse("票券列表不能為空");
					return reply.code(statusCode).send(response);
				}

				// Validate all tickets exist
				const ticketIds = tickets.map(t => t.id);
				span.addEvent("database.query.findMany");

				const existingTickets = await prisma.ticket.findMany({
					where: { id: { in: ticketIds } },
					select: { id: true, eventId: true }
				});

				if (existingTickets.length !== tickets.length) {
					span.addEvent("tickets.validation.some_not_found", {
						"tickets.requested": tickets.length,
						"tickets.found": existingTickets.length
					});
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = notFoundResponse("部分票券不存在");
					return reply.code(statusCode).send(response);
				}

				// Validate all tickets belong to the same event
				const eventIds = [...new Set(existingTickets.map(t => t.eventId))];
				if (eventIds.length > 1) {
					span.addEvent("tickets.validation.multiple_events", {
						"events.count": eventIds.length
					});
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = validationErrorResponse("所有票券必須屬於同一個活動");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("tickets.eventId", eventIds[0]);

				// Validate no duplicate orders
				const orders = tickets.map(t => t.order);
				const uniqueOrders = new Set(orders);
				if (uniqueOrders.size !== orders.length) {
					span.addEvent("tickets.validation.duplicate_orders");
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = validationErrorResponse("票券順序不能重複");
					return reply.code(statusCode).send(response);
				}

				// Update all tickets in a transaction
				span.addEvent("database.transaction.reorder");

				await prisma.$transaction(
					tickets.map(ticket =>
						prisma.ticket.update({
							where: { id: ticket.id },
							data: { order: ticket.order }
						})
					)
				);

				span.addEvent("tickets.reordered");
				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(successResponse(null, "票券順序更新成功"));
			} catch (error) {
				componentLogger.error({ error }, "Reorder tickets error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to reorder tickets"
				});

				const { response, statusCode } = serverErrorResponse("重新排序票券失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);
};

export default adminTicketsRoutes;
