/**
 * @fileoverview Public events routes with modular types and schemas
 */

import prisma from "#config/database";
import { eventSchemas, eventStatsResponse, eventTicketsResponse, publicEventsListResponse } from "#schemas/event";
import { notFoundResponse, serverErrorResponse, successResponse } from "#utils/response";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

interface EventIdParams {
	id: string;
}

interface UpcomingQuery {
	upcoming?: boolean;
}

/**
 * Public events routes - accessible without authentication
 */
const publicEventsRoutes: FastifyPluginAsync = async fastify => {
	// Get public event information
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
						OR: [
							{ id },
							{ slug: id },
							{ id: { endsWith: id.length === 6 ? id : "" } } // Support last 6 chars of ID
						],
						isActive: true // Only show active events
					},
					select: {
						id: true,
						slug: true,
						name: true,
						description: true,
						plainDescription: true,
						location: true,
						startDate: true,
						endDate: true,
						ogImage: true,
						landingPage: true
					}
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				return reply.send(successResponse(event));
			} catch (error) {
				console.error("Get public event info error:", error);
				const { response, statusCode } = serverErrorResponse("取得活動資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get available tickets for an event
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

				// Verify event exists and is active - support slug, full ID, or last 6 chars
				const event = await prisma.event.findFirst({
					where: {
						OR: [{ id }, { slug: id }, { id: { endsWith: id.length === 6 ? id : "" } }],
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
						requireSmsVerification: true
					},
					orderBy: { createdAt: "asc" }
				});

				// Get form fields for the event (all tickets in the event share the same form)
				const formFieldsRaw = await prisma.eventFormFields.findMany({
					where: {
						eventId: event.id
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
						order: true
					},
					orderBy: { order: "asc" }
				});

				// Transform form fields once for the event
				const formFields = formFieldsRaw.map(field => ({
					id: field.id,
					name: field.name,
					description: field.description,
					type: field.type,
					required: field.required,
					validater: field.validater,
					placeholder: field.placeholder,
					options: field.values || [], // values is already JSON
					order: field.order
				}));

				// Add availability and sale status to each ticket
				const now = new Date();
				const ticketsWithStatus = tickets.map(ticket => {
					const available = ticket.quantity - ticket.soldCount;
					const isOnSale = (!ticket.saleStart || now >= ticket.saleStart) && (!ticket.saleEnd || now <= ticket.saleEnd);
					const isSoldOut = available <= 0;

					return {
						id: ticket.id,
						name: ticket.name,
						description: ticket.description,
						plainDescription: ticket.plainDescription,
						price: ticket.price,
						available,
						quantity: ticket.quantity,
						isOnSale,
						isSoldOut,
						saleStart: ticket.saleStart,
						saleEnd: ticket.saleEnd,
						requireInviteCode: ticket.requireInviteCode,
						requireSmsVerification: ticket.requireSmsVerification,
						formFields // All tickets share the same event form fields
					};
				});

				return reply.send(successResponse(ticketsWithStatus));
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
				description: "獲取所有活動列表",
				querystring: {
					type: "object",
					properties: {
						...eventSchemas.listEvents.querystring.properties,
						upcoming: {
							type: "boolean",
							description: "僅顯示即將開始的活動"
						}
					}
				},
				response: publicEventsListResponse
			}
		},
		async (request: FastifyRequest<{ Querystring: UpcomingQuery }>, reply: FastifyReply) => {
			try {
				const { upcoming } = request.query;

				// Build where clause
				const where: any = {
					isActive: true
				};

				// Filter for upcoming events only
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
						location: true,
						startDate: true,
						endDate: true,
						ogImage: true,
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

				// Add computed properties
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
						location: event.location,
						startDate: event.startDate,
						endDate: event.endDate,
						ogImage: event.ogImage,
						ticketCount: event.tickets.length,
						registrationCount: event._count.registrations,
						hasAvailableTickets: activeTickets.length > 0
					};
				});

				return reply.send(successResponse(eventsWithStatus));
			} catch (error) {
				console.error("List events error:", error);
				const { response, statusCode } = serverErrorResponse("取得活動列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get event registration statistics (public view)
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

				// Get event with registration counts - support slug, full ID, or last 6 chars
				const event = await prisma.event.findFirst({
					where: {
						OR: [{ id }, { slug: id }, { id: { endsWith: id.length === 6 ? id : "" } }],
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

				// Calculate statistics
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

	// Get form fields for an event (via ticket ID for backward compatibility)
	fastify.get<{ Params: { id: string } }>(
		"/tickets/:id/form-fields",
		{
			schema: {
				description: "獲取活動報名表單欄位（透過票券 ID）",
				tags: ["events"],
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
								type: "array",
								items: {
									type: "object",
									properties: {
										id: { type: "string" },
										name: { type: "object", additionalProperties: true },
										description: { type: "string" },
										type: { type: "string" },
										required: { type: "boolean" },
										options: { type: "array" },
										validater: { type: "string" },
										placeholder: { type: "string" },
										order: { type: "integer" },
										filters: { type: "object", additionalProperties: true }
									}
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

				// Verify ticket exists and is active, get its eventId
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
						filters: true
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
					filters: field.filters || {}
				}));

				return reply.send(successResponse(transformedFields));
			} catch (error) {
				console.error("Get event form fields error:", error);
				const { response, statusCode } = serverErrorResponse("取得表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get form fields for an event directly
	fastify.get<{ Params: EventIdParams }>(
		"/events/:id/form-fields",
		{
			schema: {
				description: "獲取活動報名表單欄位",
				tags: ["events"],
				params: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "活動 ID 或 slug"
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
								type: "array",
								items: {
									type: "object",
									properties: {
										id: { type: "string" },
										name: { type: "object", additionalProperties: true },
										description: { type: "string" },
										type: { type: "string" },
										required: { type: "boolean" },
										options: { type: "array" },
										validater: { type: "string" },
										placeholder: { type: "string" },
										order: { type: "integer" }
									}
								}
							}
						}
					}
				}
			}
		},
		async (request: FastifyRequest<{ Params: EventIdParams }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;

				// Verify event exists and is active - support slug, full ID, or last 6 chars
				const event = await prisma.event.findFirst({
					where: {
						OR: [{ id }, { slug: id }, { id: { endsWith: id.length === 6 ? id : "" } }],
						isActive: true
					}
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				// Get form fields for this event
				const formFields = await prisma.eventFormFields.findMany({
					where: {
						eventId: event.id
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
						order: true
					},
					orderBy: { order: "asc" }
				});

				// Transform the data to match the expected format
				const transformedFields = formFields.map(field => ({
					id: field.id,
					name: field.name,
					description: field.description,
					type: field.type,
					required: field.required,
					validater: field.validater,
					placeholder: field.placeholder,
					options: field.values || [], // values is already JSON
					order: field.order
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
