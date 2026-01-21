import prisma from "#config/database";
import { eventSchemas, eventStatsResponse, eventTicketsResponse, publicEventSchemas, publicEventsListResponse } from "#schemas";
import { notFoundResponse, serializeDates, serverErrorResponse, successResponse } from "#utils/response";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

interface EventIdParams {
	id: string;
}

interface UpcomingQuery {
	upcoming?: boolean;
}

const publicEventsRoutes: FastifyPluginAsync = async fastify => {
	fastify.get<{ Params: EventIdParams }>(
		"/events/:id/info",
		{
			schema: {
				...eventSchemas.getEvent,
				description: "獲取活動公開資訊"
			}
		},
		async (request: FastifyRequest<{ Params: EventIdParams }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;

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
					const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				return reply.send(successResponse(serializeDates(event)));
			} catch (error) {
				console.error("Get public event info error:", error);
				const { response, statusCode } = serverErrorResponse("取得活動資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	fastify.get<{ Params: EventIdParams }>(
		"/events/:id/tickets",
		{
			schema: {
				description: "獲取活動可購買票券",
				tags: ["events"],
				params: eventSchemas.getEvent.params,
				response: eventTicketsResponse
			}
		},
		async (request: FastifyRequest<{ Params: EventIdParams }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;

				const event = await prisma.event.findFirst({
					where: {
						OR: [{ id }, { slug: id }, ...(id.length === 6 ? [{ id: { endsWith: id } }] : [])],
						isActive: true
					}
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

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

				const now = new Date();
				const ticketsWithStatus = tickets.map(ticket => {
					const available = ticket.showRemaining ? ticket.quantity - ticket.soldCount : ticket.quantity - ticket.soldCount == 0 ? 0 : 1;
					const quantity = ticket.showRemaining ? ticket.quantity : 1;
					const isOnSale = (!ticket.saleStart || now >= ticket.saleStart) && (!ticket.saleEnd || now <= ticket.saleEnd);
					const isSoldOut = available <= 0;

					return {
						id: ticket.id,
						name: ticket.name,
						description: ticket.description,
						plainDescription: ticket.plainDescription,
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

				return reply.send(successResponse(serializeDates(ticketsWithStatus)));
			} catch (error) {
				console.error("Get event tickets error:", error);
				const { response, statusCode } = serverErrorResponse("取得票券資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// List all active events
	fastify.get<{ Querystring: UpcomingQuery }>(
		"/events",
		{
			schema: {
				...eventSchemas.listEvents,
				...publicEventSchemas.listPublicEvents,
				response: publicEventsListResponse
			}
		},
		async (request: FastifyRequest<{ Querystring: UpcomingQuery }>, reply: FastifyReply) => {
			try {
				const { upcoming } = request.query;

				const where: any = {
					isActive: true,
					hideEvent: false
				};

				if (upcoming) {
					where.startDate = {
						gt: new Date()
					};
				}

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
						name: event.name,
						description: event.description,
						plainDescription: event.plainDescription,
						locationText: event.locationText,
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

				return reply.send(successResponse(serializeDates(eventsWithStatus)));
			} catch (error) {
				console.error("List events error:", error);
				const { response, statusCode } = serverErrorResponse("取得活動列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	fastify.get<{ Params: EventIdParams }>(
		"/events/:id/stats",
		{
			schema: {
				description: "獲取活動公開統計資訊",
				tags: ["events"],
				params: eventSchemas.getEvent.params,
				response: eventStatsResponse
			}
		},
		async (request: FastifyRequest<{ Params: EventIdParams }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;

				const event = await prisma.event.findFirst({
					where: {
						OR: [{ id }, { slug: id }, ...(id.length === 6 ? [{ id: { endsWith: id } }] : [])],
						isActive: true
					},
					select: {
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
					const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				const activeTickets = event.tickets.filter(t => t.isActive);
				const totalTickets = activeTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
				const soldTickets = activeTickets.reduce((sum, ticket) => sum + ticket.soldCount, 0);
				const availableTickets = totalTickets - soldTickets;
				const registrationRate = totalTickets > 0 ? soldTickets / totalTickets : 0;

				const stats = {
					eventName: event.name,
					totalRegistrations: soldTickets,
					confirmedRegistrations: event._count.registrations,
					totalTickets,
					availableTickets,
					registrationRate: Math.round(registrationRate * 100) / 100
				};

				return reply.send(successResponse(stats));
			} catch (error) {
				console.error("Get event stats error:", error);
				const { response, statusCode } = serverErrorResponse("取得活動統計失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// compactability: the formfield perviously migrated from ticket to event, so the endpoint is in here. -ns
	fastify.get<{ Params: { id: string } }>(
		"/tickets/:id/form-fields",
		{
			schema: publicEventSchemas.getTicketFormFields
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;

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
					const { response, statusCode } = notFoundResponse("票券不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

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

				const transformedFields = formFields.map(field => ({
					id: field.id,
					name: field.name,
					description: field.description,
					type: field.type,
					required: field.required,
					validater: field.validater,
					placeholder: field.placeholder,
					options: field.values || [],
					order: field.order,
					filters: field.filters || {},
					prompts: field.prompts || {},
					enableOther: field.enableOther || false
				}));

				return reply.send(successResponse(transformedFields));
			} catch (error) {
				console.error("Get event form fields error:", error);
				const { response, statusCode } = serverErrorResponse("取得表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default publicEventsRoutes;
