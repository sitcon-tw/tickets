/**
 * @fileoverview Public events routes with modular types and schemas
 * @typedef {import('#types/database.js').Event} Event
 * @typedef {import('#types/database.js').Ticket} Ticket
 * @typedef {import('#types/database.js').Registration} Registration
 */

import prisma from "#config/database.js";
import { 
	successResponse, 
	notFoundResponse, 
	serverErrorResponse
} from "#utils/response.js";
import { eventSchemas, eventTicketsResponse, publicEventsListResponse, eventStatsResponse } from "#schemas/event.js";
import { ticketSchemas } from "#schemas/ticket.js";
import { formFields } from "#schemas/formFieldData.js";


/**
 * Public events routes - accessible without authentication
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {Object} options 
 */
export default async function publicEventsRoutes(fastify, options) {
	// Get public event information
	fastify.get(
		"/events/:id/info",
		{
			schema: {
				...eventSchemas.getEvent,
				description: "獲取活動公開資訊"
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				/** @type {Event | null} */
				const event = await prisma.event.findUnique({
					where: { 
						id,
						isActive: true // Only show active events
					},
					select: {
						id: true,
						name: true,
						description: true,
						location: true,
						startDate: true,
						endDate: true,
						ogImage: true,
						landingPage: true,
						isActive: true
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
	fastify.get(
		"/events/:id/tickets",
		{
			schema: {
				description: "獲取活動可購買票券",
				tags: ["events"],
				params: eventSchemas.getEvent.params,
				response: eventTicketsResponse
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				// Verify event exists and is active
				const event = await prisma.event.findUnique({
					where: { 
						id,
						isActive: true 
					}
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				/** @type {Ticket[]} */
				const tickets = await prisma.ticket.findMany({
					where: {
						eventId: id,
						isActive: true
					},
					select: {
						id: true,
						name: true,
						description: true,
						price: true,
						quantity: true,
						soldCount: true,
						saleStart: true,
						saleEnd: true,
						isActive: true
					},
					orderBy: { createdAt: 'asc' }
				});

				// Add availability and sale status to each ticket
				const now = new Date();
				const ticketsWithStatus = tickets.map(ticket => {
					const available = ticket.quantity - ticket.soldCount;
					const isOnSale = (!ticket.saleStart || now >= ticket.saleStart) &&
						(!ticket.saleEnd || now <= ticket.saleEnd) &&
						ticket.isActive;
					const isSoldOut = available <= 0;

					return {
						...ticket,
						available,
						isOnSale,
						isSoldOut
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
	fastify.get(
		"/events",
		{
			schema: {
				...eventSchemas.listEvents,
				description: "獲取所有活動列表",
				querystring: {
					type: 'object',
					properties: {
						...eventSchemas.listEvents.querystring.properties,
						upcoming: {
							type: 'boolean',
							description: '僅顯示即將開始的活動'
						}
					}
				},
				response: publicEventsListResponse
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Querystring: {upcoming?: boolean}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { upcoming } = request.query;

				// Build where clause
				const where = {
					isActive: true
				};

				// Filter for upcoming events only
				if (upcoming) {
					where.startDate = {
						gt: new Date()
					};
				}

				/** @type {Event[]} */
				const events = await prisma.event.findMany({
					where,
					select: {
						id: true,
						name: true,
						description: true,
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
								isActive: true
							}
						},
						_count: {
							select: {
								registrations: true
							}
						}
					},
					orderBy: { startDate: 'asc' }
				});

				// Add computed properties
				const eventsWithStatus = events.map(event => {
					const now = new Date();
					const activeTickets = event.tickets.filter(ticket => {
						const isOnSale = (!ticket.saleStart || now >= ticket.saleStart) &&
							(!ticket.saleEnd || now <= ticket.saleEnd);
						const hasAvailable = ticket.quantity > ticket.soldCount;
						return ticket.isActive && isOnSale && hasAvailable;
					});

					return {
						id: event.id,
						name: event.name,
						description: event.description,
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
	fastify.get(
		"/events/:id/stats",
		{
			schema: {
				description: "獲取活動公開統計資訊",
				tags: ["events"],
				params: eventSchemas.getEvent.params,
				response: eventStatsResponse
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				// Get event with registration counts
				const event = await prisma.event.findUnique({
					where: { 
						id,
						isActive: true 
					},
					select: {
						name: true,
						tickets: {
							select: {
								quantity: true,
								soldCount: true,
								isActive: true
							}
						},
						_count: {
							select: {
								registrations: {
									where: { status: 'confirmed' }
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
				const registrationRate = totalTickets > 0 ? (soldTickets / totalTickets) : 0;

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

	// Get form fields for an event
	fastify.get(
		"/events/:id/form-fields",
		{
			schema: {
				description: "獲取活動報名表單欄位",
				tags: ["events"],
				params: eventSchemas.getEvent.params,
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
										required: { type: 'boolean' },
										options: { type: 'array', items: { type: 'string' } },
										validation: { type: 'object' },
										placeholder: { type: 'string' },
										helpText: { type: 'string' },
										order: { type: 'integer' }
									}
								}
							}
						}
					}
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				// Verify event exists and is active
				const event = await prisma.event.findUnique({
					where: { 
						id,
						isActive: true 
					}
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				return reply.send(successResponse(formFields));
			} catch (error) {
				console.error("Get event form fields error:", error);
				const { response, statusCode } = serverErrorResponse("取得表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}