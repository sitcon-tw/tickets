/**
 * @fileoverview Example demonstrating modular types and schemas usage
 * This shows how to use the new type system in route handlers
 */

/**
 * @typedef {import('../types/database.js').Event} Event
 * @typedef {import('../types/api.js').EventCreateRequest} EventCreateRequest
 * @typedef {import('../types/api.js').ApiResponse} ApiResponse
 */

import prisma from "#config/database.js";
import { 
	successResponse, 
	validationErrorResponse, 
	notFoundResponse, 
	serverErrorResponse 
} from "#utils/response.js";
import { eventSchemas } from "../schemas/event.js";

/**
 * Example route handler using modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {Object} options 
 */
export default async function exampleRoutes(fastify, options) {
	// Create Event - Using modular schema
	fastify.post(
		"/events",
		{
			schema: eventSchemas.createEvent // Using reusable schema
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Body: EventCreateRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { name, description, startDate, endDate, location } = request.body;

				// Type-aware validation
				const start = new Date(startDate);
				const end = new Date(endDate);

				if (isNaN(start.getTime()) || isNaN(end.getTime())) {
					const { response, statusCode } = validationErrorResponse("無效的日期格式");
					return reply.code(statusCode).send(response);
				}

				if (start >= end) {
					const { response, statusCode } = validationErrorResponse("開始時間必須早於結束時間");
					return reply.code(statusCode).send(response);
				}

				/** @type {Event} */
				const event = await prisma.event.create({
					data: {
						name,
						description,
						startDate: start,
						endDate: end,
						location,
						isActive: true
					}
				});

				return reply.code(201).send(successResponse(event, "活動創建成功"));
			} catch (error) {
				console.error("Create event error:", error);
				const { response, statusCode } = serverErrorResponse("創建活動失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get Event - Using modular schema
	fastify.get(
		"/events/:id",
		{
			schema: eventSchemas.getEvent // Using reusable schema
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
					where: { id },
					include: {
						tickets: true,
						_count: {
							select: {
								registrations: true,
								invitationCodes: true
							}
						}
					}
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				return reply.send(successResponse(event));
			} catch (error) {
				console.error("Get event error:", error);
				const { response, statusCode } = serverErrorResponse("取得活動資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// List Events - Using modular schema
	fastify.get(
		"/events",
		{
			schema: eventSchemas.listEvents // Using reusable schema
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Querystring: {isActive?: boolean}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { isActive } = request.query;

				/** @type {Event[]} */
				const events = await prisma.event.findMany({
					where: isActive !== undefined ? { isActive } : {},
					orderBy: { createdAt: 'desc' }
				});

				return reply.send(successResponse(events));
			} catch (error) {
				console.error("List events error:", error);
				const { response, statusCode } = serverErrorResponse("取得活動列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}