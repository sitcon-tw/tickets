/**
 * @fileoverview Public tickets routes
 * @typedef {import('#types/database.js').Ticket} Ticket
 * @typedef {import('#types/database.js').TicketFormField} TicketFormField
 */

import prisma from "#config/database.js";
import {
	successResponse,
	notFoundResponse,
	serverErrorResponse
} from "#utils/response.js";

/**
 * Public tickets routes - accessible without authentication
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
export default async function publicTicketsRoutes(fastify, options) {
	// Get single ticket information (public)
	fastify.get(
		"/tickets/:id",
		{
			schema: {
				description: "獲取票券公開資訊",
				tags: ["tickets"],
				params: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							description: '票券 ID'
						}
					},
					required: ['id']
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							message: { type: 'string' },
							data: {
								type: 'object',
								properties: {
									id: { type: 'string' },
									name: { type: 'object' },
									description: { type: 'object' },
									price: { type: 'number' },
									quantity: { type: 'integer' },
									soldCount: { type: 'integer' },
									available: { type: 'integer' },
									saleStart: { type: 'string' },
									saleEnd: { type: 'string' },
									isOnSale: { type: 'boolean' },
									isSoldOut: { type: 'boolean' },
									requireInviteCode: { type: 'boolean' }
								}
							}
						}
					},
					404: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							error: {
								type: 'object',
								properties: {
									code: { type: 'string' },
									message: { type: 'string' }
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

				/** @type {Ticket | null} */
				const ticket = await prisma.ticket.findUnique({
					where: {
						id,
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
						requireInviteCode: true
					}
				});

				if (!ticket) {
					const { response, statusCode } = notFoundResponse("票券不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				// Add availability and sale status
				const now = new Date();
				const available = ticket.quantity - ticket.soldCount;
				const isOnSale = (!ticket.saleStart || now >= ticket.saleStart) &&
					(!ticket.saleEnd || now <= ticket.saleEnd);
				const isSoldOut = available <= 0;

				const ticketWithStatus = {
					...ticket,
					available,
					isOnSale,
					isSoldOut
				};

				return reply.send(successResponse(ticketWithStatus));
			} catch (error) {
				console.error("Get public ticket info error:", error);
				const { response, statusCode } = serverErrorResponse("取得票券資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}
