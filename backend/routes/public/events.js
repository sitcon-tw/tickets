/**
 * @fileoverview Public events routes with modular types and schemas
 * @typedef {import('../../types/database.js').Event} Event
 * @typedef {import('../../types/database.js').Ticket} Ticket
 * @typedef {import('../../types/database.js').Registration} Registration
 */

import prisma from "#config/database.js";
import { 
	successResponse, 
	notFoundResponse, 
	serverErrorResponse
} from "#utils/response.js";
import { eventSchemas, eventTicketsResponse, publicEventsListResponse, eventStatsResponse } from "../../schemas/event.js";
import { ticketSchemas } from "../../schemas/ticket.js";


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

				// Return hard-coded form fields
				const formFields = [
					{
						id: 'acceptTerms',
						name: 'acceptTerms',
						label: '接受條款',
						type: 'checkbox',
						required: true,
						placeholder: null,
						helpText: '請詳閱並接受活動條款與條件',
						order: 1
					},
					{
						id: 'nickname',
						name: 'nickname',
						label: '暱稱',
						type: 'text',
						required: true,
						placeholder: '請輸入您的暱稱',
						helpText: '2-20個字元',
						order: 2
					},
					{
						id: 'phoneNumber',
						name: 'phoneNumber',
						label: '電話號碼',
						type: 'phone',
						required: true,
						placeholder: '09xxxxxxxx',
						helpText: '請輸入有效的台灣手機號碼',
						order: 3
					},
					{
						id: 'sex',
						name: 'sex',
						label: '性別',
						type: 'radio',
						required: true,
						options: [
							{ value: 'male', label: '男' },
							{ value: 'female', label: '女' },
							{ value: 'other', label: '其他' }
						],
						order: 4
					},
					{
						id: 'foodHabits',
						name: 'foodHabits',
						label: '飲食習慣',
						type: 'select',
						required: true,
						options: [
							{ value: 'normal', label: '一般' },
							{ value: 'no-beef', label: '不吃牛肉' },
							{ value: 'no-pork', label: '不吃豬肉' },
							{ value: 'vegetarian', label: '素食' }
						],
						order: 5
					},
					{
						id: 'livingArea',
						name: 'livingArea',
						label: '居住地區',
						type: 'select',
						required: true,
						options: [
							{ value: 'north', label: '北部' },
							{ value: 'middle', label: '中部' },
							{ value: 'south', label: '南部' },
							{ value: 'east', label: '東部' }
						],
						order: 6
					},
					{
						id: 'workingAt',
						name: 'workingAt',
						label: '工作地點',
						type: 'text',
						required: true,
						placeholder: '請輸入您的工作地點',
						helpText: '最多100個字元',
						order: 7
					},
					{
						id: 'jobTitle',
						name: 'jobTitle',
						label: '職位',
						type: 'text',
						required: true,
						placeholder: '請輸入您的職位',
						helpText: '最多50個字元',
						order: 8
					},
					{
						id: 'grade',
						name: 'grade',
						label: '年級',
						type: 'text',
						required: true,
						placeholder: '請輸入您的年級',
						helpText: '最多20個字元',
						order: 9
					},
					{
						id: 'haveEverBeenHere',
						name: 'haveEverBeenHere',
						label: '是否曾經來過',
						type: 'radio',
						required: true,
						options: [
							{ value: true, label: '是' },
							{ value: false, label: '否' }
						],
						order: 10
					},
					{
						id: 'whereYouGotThis',
						name: 'whereYouGotThis',
						label: '從哪裡得知此活動',
						type: 'select',
						required: true,
						options: [
							{ value: 'google', label: 'Google搜尋' },
							{ value: 'social_media', label: '社群媒體' },
							{ value: 'friend', label: '朋友介紹' },
							{ value: 'family', label: '家人介紹' }
						],
						order: 11
					}
				];

				return reply.send(successResponse(formFields));
			} catch (error) {
				console.error("Get event form fields error:", error);
				const { response, statusCode } = serverErrorResponse("取得表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}