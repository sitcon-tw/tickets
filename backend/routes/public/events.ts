import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { eventSchemas, eventStatsResponse, eventTicketsResponse, publicEventSchemas, publicEventsListResponse } from "#schemas";
import { logger } from "#utils/logger";
import { notFoundResponse, serverErrorResponse, successResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";
import { FieldFilterSchema, FormFieldTypeSchema, LocalizedTextSchema } from "@sitcontix/types";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

const componentLogger = logger.child({ component: "public/events" });

const publicEventsRoutes: FastifyPluginAsync = async fastify => {
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/events/:id/info",
		{
			schema: {
				...eventSchemas.getEvent,
				description: "獲取活動公開資訊"
			}
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.public.events.get_info");

			try {
				const { id } = request.params;
				span.setAttribute("event.lookup_id", id);

				const event = await prisma.event.findFirst({
					where: {
						OR: [{ id }, { slug: id }, ...(id.length === 6 ? [{ id: { endsWith: id } }] : [])],
						isActive: true
					},
					select: {
						id: true,
						slug: true,
						name: true,
						description: true,
						plainDescription: true,
						locationText: true,
						mapLink: true,
						startDate: true,
						endDate: true,
						ogImage: true,
						landingPage: true,
						hideEvent: true,
						useOpass: true,
						opassEventId: true,
						isActive: true,
						createdAt: true,
						updatedAt: true
					}
				});

				if (!event) {
					span.addEvent("event.not_found");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Event not found" });
					const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("event.id", event.id);
				span.setAttribute("event.slug", event.slug || "");

				const eventDto = {
					...event,
					name: LocalizedTextSchema.parse(event.name),
					description: LocalizedTextSchema.nullable().parse(event.description),
					plainDescription: LocalizedTextSchema.nullable().parse(event.plainDescription),
					locationText: LocalizedTextSchema.nullable().parse(event.locationText)
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(eventDto));
			} catch (error) {
				componentLogger.error({ error }, "Get public event info error");
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to get event info" });
				const { response, statusCode } = serverErrorResponse("取得活動資訊失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/events/:id/tickets",
		{
			schema: {
				description: "獲取活動可購買票券",
				tags: ["events"],
				params: eventSchemas.getEvent.params,
				response: eventTicketsResponse
			}
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.public.events.get_tickets");

			try {
				const { id } = request.params;
				span.setAttribute("event.lookup_id", id);

				span.addEvent("event.lookup");
				const event = await prisma.event.findFirst({
					where: {
						OR: [{ id }, { slug: id }, ...(id.length === 6 ? [{ id: { endsWith: id } }] : [])],
						isActive: true
					}
				});

				if (!event) {
					span.addEvent("event.not_found");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Event not found" });
					const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("event.id", event.id);
				span.addEvent("tickets.lookup");

				const tickets = await prisma.ticket.findMany({
					where: {
						eventId: event.id,
						isActive: true,
						hidden: false
					},
					select: {
						id: true,
						name: true,
						description: true,
						plainDescription: true,
						price: true,
						quantity: true,
						soldCount: true,
						saleStart: true,
						saleEnd: true,
						requireInviteCode: true,
						requireSmsVerification: true,
						showRemaining: true
					},
					orderBy: { order: "asc" }
				});

				span.setAttribute("tickets.count", tickets.length);

				const now = new Date();
				const ticketsWithStatus = tickets.map(ticket => {
					const available = ticket.showRemaining ? ticket.quantity - ticket.soldCount : ticket.quantity - ticket.soldCount == 0 ? 0 : 1;
					const quantity = ticket.showRemaining ? ticket.quantity : 1;
					const isOnSale = (!ticket.saleStart || now >= ticket.saleStart) && (!ticket.saleEnd || now <= ticket.saleEnd);
					const isSoldOut = available <= 0;

					return {
						id: ticket.id,
						name: LocalizedTextSchema.parse(ticket.name),
						description: LocalizedTextSchema.nullable().parse(ticket.description),
						plainDescription: LocalizedTextSchema.nullable().parse(ticket.plainDescription),
						price: ticket.price,
						available,
						quantity,
						isOnSale,
						isSoldOut,
						saleStart: ticket.saleStart,
						saleEnd: ticket.saleEnd,
						requireInviteCode: ticket.requireInviteCode,
						requireSmsVerification: ticket.requireSmsVerification,
						showRemaining: ticket.showRemaining
					};
				});

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(ticketsWithStatus));
			} catch (error) {
				componentLogger.error({ error }, "Get event tickets error");
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to get event tickets" });
				const { response, statusCode } = serverErrorResponse("取得票券資訊失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// List all active events
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/events",
		{
			schema: {
				...eventSchemas.listEvents,
				...publicEventSchemas.listPublicEvents,
				response: publicEventsListResponse
			}
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.public.events.list");

			try {
				const { upcoming } = request.query;
				span.setAttribute("events.filter.upcoming", upcoming || false);

				const where: any = {
					isActive: true,
					hideEvent: false
				};

				if (upcoming) {
					where.startDate = {
						gt: new Date()
					};
				}

				span.addEvent("events.lookup");
				const events = await prisma.event.findMany({
					where,
					select: {
						id: true,
						slug: true,
						name: true,
						description: true,
						plainDescription: true,
						locationText: true,
						mapLink: true,
						startDate: true,
						endDate: true,
						ogImage: true,
						hideEvent: true,
						useOpass: true,
						opassEventId: true,
						tickets: {
							select: {
								id: true,
								quantity: true,
								soldCount: true,
								isActive: true,
								saleStart: true,
								saleEnd: true
							},
							where: {
								isActive: true,
								hidden: false
							}
						},
						_count: {
							select: {
								registrations: true
							}
						}
					},
					orderBy: { startDate: "asc" }
				});

				span.setAttribute("events.count", events.length);

				const eventsWithStatus = events.map(event => {
					const now = new Date();
					const activeTickets = event.tickets.filter(ticket => {
						const isOnSale = (!ticket.saleStart || now >= ticket.saleStart) && (!ticket.saleEnd || now <= ticket.saleEnd);
						const hasAvailable = ticket.quantity > ticket.soldCount;
						return ticket.isActive && isOnSale && hasAvailable;
					});

					return {
						id: event.id,
						slug: event.slug,
						name: LocalizedTextSchema.parse(event.name),
						description: LocalizedTextSchema.nullable().parse(event.description),
						plainDescription: LocalizedTextSchema.nullable().parse(event.plainDescription),
						locationText: LocalizedTextSchema.nullable().parse(event.locationText),
						mapLink: event.mapLink,
						startDate: event.startDate,
						endDate: event.endDate,
						ogImage: event.ogImage,
						useOpass: event.useOpass,
						opassEventId: event.opassEventId,
						ticketCount: event.tickets.length,
						registrationCount: event._count.registrations,
						hasAvailableTickets: activeTickets.length > 0
					};
				});

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(eventsWithStatus));
			} catch (error) {
				componentLogger.error({ error }, "List events error");
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to list events" });
				const { response, statusCode } = serverErrorResponse("取得活動列表失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/events/:id/stats",
		{
			schema: {
				description: "獲取活動公開統計資訊",
				tags: ["events"],
				params: eventSchemas.getEvent.params,
				response: eventStatsResponse
			}
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.public.events.get_stats");

			try {
				const { id } = request.params;
				span.setAttribute("event.lookup_id", id);

				span.addEvent("event.lookup");
				const event = await prisma.event.findFirst({
					where: {
						OR: [{ id }, { slug: id }, ...(id.length === 6 ? [{ id: { endsWith: id } }] : [])],
						isActive: true
					},
					select: {
						id: true,
						name: true,
						tickets: {
							select: {
								quantity: true,
								soldCount: true,
								isActive: true
							},
							where: {
								isActive: true,
								hidden: false
							}
						},
						_count: {
							select: {
								registrations: {
									where: { status: "confirmed" }
								}
							}
						}
					}
				});

				if (!event) {
					span.addEvent("event.not_found");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Event not found" });
					const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("event.id", event.id);

				const activeTickets = event.tickets.filter(t => t.isActive);
				const totalTickets = activeTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
				const soldTickets = activeTickets.reduce((sum, ticket) => sum + ticket.soldCount, 0);
				const availableTickets = totalTickets - soldTickets;
				const registrationRate = totalTickets > 0 ? soldTickets / totalTickets : 0;

				span.setAttribute("stats.total_tickets", totalTickets);
				span.setAttribute("stats.sold_tickets", soldTickets);
				span.setAttribute("stats.available_tickets", availableTickets);
				span.setAttribute("stats.registration_rate", registrationRate);
				span.setAttribute("stats.confirmed_registrations", event._count.registrations);

				const stats = {
					eventName: LocalizedTextSchema.parse(event.name),
					totalRegistrations: soldTickets,
					confirmedRegistrations: event._count.registrations,
					totalTickets,
					availableTickets,
					registrationRate: Math.round(registrationRate * 100) / 100
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(stats));
			} catch (error) {
				componentLogger.error({ error }, "Get event stats error");
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to get event stats" });
				const { response, statusCode } = serverErrorResponse("取得活動統計失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// compactability: the formfield perviously migrated from ticket to event, so the endpoint is in here. -ns
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/tickets/:id/form-fields",
		{
			schema: publicEventSchemas.getTicketFormFields
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.public.events.get_form_fields");

			try {
				const { id } = request.params;
				span.setAttribute("ticket.id", id);

				span.addEvent("ticket.lookup");
				const ticket = await prisma.ticket.findUnique({
					where: {
						id,
						isActive: true
					},
					select: {
						eventId: true,
						event: {
							select: {
								isActive: true
							}
						}
					}
				});

				if (!ticket || !ticket.event.isActive) {
					span.addEvent("ticket.not_found_or_inactive");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Ticket not found or inactive" });
					const { response, statusCode } = notFoundResponse("票券不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("event.id", ticket.eventId);
				span.addEvent("form_fields.lookup");

				const formFields = await prisma.eventFormFields.findMany({
					where: {
						eventId: ticket.eventId
					},
					select: {
						id: true,
						name: true,
						description: true,
						type: true,
						required: true,
						validater: true,
						placeholder: true,
						values: true,
						order: true,
						filters: true,
						prompts: true,
						enableOther: true
					},
					orderBy: { order: "asc" }
				});

				span.setAttribute("form_fields.count", formFields.length);

				const transformedFields = formFields.map(field => ({
					id: field.id,
					name: LocalizedTextSchema.parse(field.name),
					description: LocalizedTextSchema.nullable().parse(field.description),
					type: FormFieldTypeSchema.parse(field.type),
					required: field.required,
					validater: field.validater,
					placeholder: field.placeholder,
					options: z.array(z.unknown()).parse(field.values || []),
					order: field.order,
					filters: FieldFilterSchema.safeParse(field.filters).data ?? null,
					prompts: z.record(z.string(), z.array(z.string())).nullable().parse(field.prompts),
					enableOther: field.enableOther || false
				}));

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(transformedFields));
			} catch (error) {
				componentLogger.error({ error }, "Get event form fields error");
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to get form fields" });
				const { response, statusCode } = serverErrorResponse("取得表單欄位失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);
};

export default publicEventsRoutes;
