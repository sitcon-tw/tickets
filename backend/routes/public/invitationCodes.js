/**
 * @fileoverview Public invitation codes routes with modular types and schemas
 * @typedef {import('../../types/database.js').InvitationCode} InvitationCode
 * @typedef {import('../../types/database.js').Ticket} Ticket
 * @typedef {import('../../types/api.js').InvitationCodeVerifyRequest} InvitationCodeVerifyRequest
 */

import prisma from "#config/database.js";
import { 
	successResponse, 
	validationErrorResponse,
	notFoundResponse, 
	serverErrorResponse 
} from "#utils/response.js";
import { invitationCodeSchemas, invitationCodeVerifyResponse } from "../../schemas/invitationCode.js";

// Custom param schemas for invitation code routes
const codeParam = {
	type: 'object',
	properties: {
		code: {
			type: 'string',
			description: '邀請碼'
		}
	},
	required: ['code']
};

const eventIdQuery = {
	type: 'object',
	properties: {
		eventId: {
			type: 'string',
			description: '活動 ID'
		}
	},
	required: ['eventId']
};


/**
 * Public invitation codes routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {Object} options 
 */
export default async function invitationCodesRoutes(fastify, options) {
	// Verify invitation code
	fastify.post(
		"/invitation-codes/verify",
		{
			schema: {
				...invitationCodeSchemas.validateInvitationCode,
				description: "驗證邀請碼並返回可用票種",
				tags: ["invitation-codes"],
				response: invitationCodeVerifyResponse
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Body: InvitationCodeVerifyRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				/** @type {InvitationCodeVerifyRequest} */
				const { code, eventId } = request.body;

				if (!code || !eventId) {
					const { response, statusCode } = validationErrorResponse("邀請碼和活動ID為必填");
					return reply.code(statusCode).send(response);
				}

				// Verify event exists and is active
				const event = await prisma.event.findUnique({
					where: { 
						id: eventId,
						isActive: true 
					}
				});

				if (!event) {
					return reply.send(successResponse({
						valid: false,
						message: "活動不存在或已關閉"
					}));
				}

				// Find invitation code
				/** @type {InvitationCode | null} */
				const invitationCode = await prisma.invitationCode.findFirst({
					where: {
						code,
						eventId,
						isActive: true
					}
				});

				if (!invitationCode) {
					return reply.send(successResponse({
						valid: false,
						message: "邀請碼不存在"
					}));
				}

				// Check if code is expired
				const now = new Date();
				if (invitationCode.expiresAt && now > invitationCode.expiresAt) {
					return reply.send(successResponse({
						valid: false,
						message: "邀請碼已過期"
					}));
				}

				// Check if code has remaining uses
				if (invitationCode.usageLimit && invitationCode.usageCount >= invitationCode.usageLimit) {
					return reply.send(successResponse({
						valid: false,
						message: "邀請碼已達使用上限"
					}));
				}

				// Get available tickets for the event
				/** @type {Ticket[]} */
				const tickets = await prisma.ticket.findMany({
					where: {
						eventId,
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

				// Filter and add availability info to tickets
				const availableTickets = tickets.map(ticket => {
					const available = ticket.quantity - ticket.sold;
					const isOnSale = (!ticket.saleStart || now >= ticket.saleStart) &&
						(!ticket.saleEnd || now <= ticket.saleEnd) &&
						ticket.isActive && available > 0;

					return {
						...ticket,
						available,
						isOnSale
					};
				}).filter(ticket => ticket.isOnSale);

				return reply.send(successResponse({
					valid: true,
					invitationCode: {
						id: invitationCode.id,
						code: invitationCode.code,
						description: invitationCode.description,
						usageCount: invitationCode.usageCount,
						usageLimit: invitationCode.usageLimit,
						expiresAt: invitationCode.expiresAt
					},
					availableTickets
				}));
			} catch (error) {
				console.error("Verify invitation code error:", error);
				const { response, statusCode } = serverErrorResponse("驗證邀請碼失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get invitation code info by code
	fastify.get(
		"/invitation-codes/:code/info",
		{
			schema: {
				description: "獲取邀請碼資訊",
				tags: ["invitation-codes"],
				params: codeParam,
				querystring: eventIdQuery
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {code: string}, Querystring: {eventId: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { code } = request.params;
				const { eventId } = request.query;

				/** @type {InvitationCode | null} */
				const invitationCode = await prisma.invitationCode.findFirst({
					where: {
						code,
						eventId,
						isActive: true
					},
					select: {
						id: true,
						code: true,
						description: true,
						usageCount: true,
						usageLimit: true,
						expiresAt: true,
						event: {
							select: {
								name: true,
								startDate: true,
								endDate: true
							}
						}
					}
				});

				if (!invitationCode) {
					const { response, statusCode } = notFoundResponse("邀請碼不存在");
					return reply.code(statusCode).send(response);
				}

				// Check validity
				const now = new Date();
				const isExpired = invitationCode.expiresAt && now > invitationCode.expiresAt;
				const isUsageExceeded = invitationCode.usageLimit && 
					invitationCode.usageCount >= invitationCode.usageLimit;

				return reply.send(successResponse({
					...invitationCode,
					isValid: !isExpired && !isUsageExceeded,
					isExpired,
					isUsageExceeded,
					remainingUses: invitationCode.usageLimit ? 
						Math.max(0, invitationCode.usageLimit - invitationCode.usageCount) : null
				}));
			} catch (error) {
				console.error("Get invitation code info error:", error);
				const { response, statusCode } = serverErrorResponse("取得邀請碼資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}
