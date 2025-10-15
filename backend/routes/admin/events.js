/**
 * @fileoverview Admin events routes with modular types and schemas
 * @typedef {import('#types/database.js').Event} Event
 * @typedef {import('#types/api.js').EventCreateRequest} EventCreateRequest
 * @typedef {import('#types/api.js').EventUpdateRequest} EventUpdateRequest
 */

import prisma from "#config/database.js";
import { requireAdmin, requireEventAccess, requireEventListAccess } from "#middleware/auth.js";
import { eventSchemas } from "#schemas/event.js";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response.js";
import { sanitizeObject } from "#utils/sanitize.js";

/**
 * Admin events routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
export default async function adminEventsRoutes(fastify, options) {
	// Create new event - only admin can create events
	fastify.post(
		"/events",
		{
			preHandler: requireAdmin,
			schema: { ...eventSchemas.createEvent, tags: ["admin/events"] }
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Body: EventCreateRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				/** @type {EventCreateRequest} */
				const rawBody = request.body;

				const sanitizedBody = sanitizeObject(rawBody, true);
				const { name, description, startDate, endDate, location } = sanitizedBody;

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
				request.log.error("Create event error:", error);
				const { response, statusCode } = serverErrorResponse("創建活動失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get event by ID - admin and eventAdmin (for their events) can access
	fastify.get(
		"/events/:id",
		{
			preHandler: requireEventAccess,
			schema: { ...eventSchemas.getEvent, tags: ["admin/events"] }
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
						tickets: {
							where: { isActive: true },
							orderBy: { createdAt: "asc" }
						},
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
				request.log.error("Get event error:", error);
				const { response, statusCode } = serverErrorResponse("取得活動資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Update event - admin and eventAdmin (for their events) can update
	fastify.put(
		"/events/:id",
		{
			preHandler: requireEventAccess,
			schema: eventSchemas.updateEvent
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}, Body: EventUpdateRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;
				/** @type {EventUpdateRequest} */
				const updateData = request.body;

				const existingEvent = await prisma.event.findUnique({
					where: { id }
				});

				if (!existingEvent) {
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				if (updateData.startDate || updateData.endDate) {
					const startDate = updateData.startDate ? new Date(updateData.startDate) : existingEvent.startDate;
					const endDate = updateData.endDate ? new Date(updateData.endDate) : existingEvent.endDate;

					if (updateData.startDate && isNaN(new Date(updateData.startDate).getTime())) {
						const { response, statusCode } = validationErrorResponse("無效的開始日期格式");
						return reply.code(statusCode).send(response);
					}

					if (updateData.endDate && isNaN(new Date(updateData.endDate).getTime())) {
						const { response, statusCode } = validationErrorResponse("無效的結束日期格式");
						return reply.code(statusCode).send(response);
					}

					if (startDate >= endDate) {
						const { response, statusCode } = validationErrorResponse("開始時間必須早於結束時間");
						return reply.code(statusCode).send(response);
					}
				}

				const updatePayload = {
					...updateData,
					...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
					...(updateData.endDate && { endDate: new Date(updateData.endDate) }),
					updatedAt: new Date()
				};

				/** @type {Event} */
				const event = await prisma.event.update({
					where: { id },
					data: updatePayload
				});

				return reply.send(successResponse(event, "活動更新成功"));
			} catch (error) {
				request.log.error("Update event error:", error);
				const { response, statusCode } = serverErrorResponse("更新活動失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Delete event - only admin can delete events
	fastify.delete(
		"/events/:id",
		{
			preHandler: requireAdmin,
			schema: eventSchemas.deleteEvent
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				const existingEvent = await prisma.event.findUnique({
					where: { id },
					include: {
						_count: {
							select: { registrations: true }
						}
					}
				});

				if (!existingEvent) {
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				if (existingEvent._count.registrations > 0) {
					const { response, statusCode } = conflictResponse("無法刪除已有報名的活動");
					return reply.code(statusCode).send(response);
				}

				await prisma.event.delete({
					where: { id }
				});

				return reply.send(successResponse(null, "活動刪除成功"));
			} catch (error) {
				request.log.error("Delete event error:", error);
				const { response, statusCode } = serverErrorResponse("刪除活動失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// List events - admin sees all, eventAdmin sees only their assigned events
	fastify.get(
		"/events",
		{
			preHandler: requireEventListAccess,
			schema: { ...eventSchemas.listEvents, tags: ["admin/events"] }
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Querystring: {isActive?: boolean}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { isActive } = request.query;

				const whereClause = {};
				if (isActive !== undefined) {
					whereClause.isActive = isActive;
				}

				if (request.userEventPermissions && request.userEventPermissions.length > 0) {
					whereClause.id = { in: request.userEventPermissions };
				}

				/** @type {Event[]} */
				const events = await prisma.event.findMany({
					where: whereClause,
					include: {
						_count: {
							select: {
								registrations: true,
								tickets: true
							}
						}
					},
					orderBy: { createdAt: "desc" }
				});

				return reply.send(successResponse(events));
			} catch (error) {
				request.log.error("List events error:", error);
				const { response, statusCode } = serverErrorResponse("取得活動列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}
