import type { EventCreateRequest, EventUpdateRequest } from "#types/api";
import type { Event } from "#types/database";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import prisma from "#config/database";
import { requireAdmin, requireEventAccess, requireEventListAccess } from "#middleware/auth";
import { eventSchemas } from "#schemas/event";
import { conflictResponse, notFoundResponse, successResponse, validationErrorResponse } from "#utils/response";
import { sanitizeObject } from "#utils/sanitize";
import { CacheInvalidation } from "#utils/cache-keys";

const adminEventsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	// Create new event - only admin can create events
	fastify.post<{
		Body: EventCreateRequest;
	}>(
		"/events",
		{
			preHandler: requireAdmin,
			schema: { ...eventSchemas.createEvent, tags: ["admin/events"] }
		},
		async (request: FastifyRequest<{ Body: EventCreateRequest }>, reply: FastifyReply) => {
			const rawBody = request.body;

			const sanitizedBody = sanitizeObject(rawBody, true);
			const { name, description, plainDescription, startDate, endDate, location, ogImage } = sanitizedBody;

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

			const event = (await prisma.event.create({
				data: {
					name,
					description,
					plainDescription,
					startDate: start,
					endDate: end,
					location,
					ogImage,
					isActive: true
				},
				// @ts-expect-error - uncache is an extension so it's not properly typed
				uncache: CacheInvalidation.events()
			})) as Event;

			return reply.code(201).send(successResponse(event, "活動創建成功"));
		}
	);

	// Get event by ID - admin and eventAdmin (for their events) can access
	fastify.get<{
		Params: { id: string };
	}>(
		"/events/:id",
		{
			preHandler: requireEventAccess,
			schema: { ...eventSchemas.getEvent, tags: ["admin/events"] }
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			const { id } = request.params;

			const event = (await prisma.event.findUnique({
				where: { id },
				include: {
					tickets: {
						where: { isActive: true },
						orderBy: { createdAt: "asc" }
					},
					_count: {
						select: {
							registrations: true
						}
					}
				}
			})) as Event | null;

			if (!event) {
				const { response, statusCode } = notFoundResponse("活動不存在");
				return reply.code(statusCode).send(response);
			}

			return reply.send(successResponse(event));
		}
	);

	// Update event - admin and eventAdmin (for their events) can update
	fastify.put<{
		Params: { id: string };
		Body: EventUpdateRequest;
	}>(
		"/events/:id",
		{
			preHandler: requireEventAccess,
			schema: eventSchemas.updateEvent
		},
		async (request: FastifyRequest<{ Params: { id: string }; Body: EventUpdateRequest }>, reply: FastifyReply) => {
			const { id } = request.params;
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

			const updatePayload: any = {
				...updateData,
				...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
				...(updateData.endDate && { endDate: new Date(updateData.endDate) }),
				updatedAt: new Date()
			};

			const event = (await prisma.event.update({
				where: { id },
				data: updatePayload,
				// @ts-expect-error - uncache is an extension so it's not properly typed
				uncache: CacheInvalidation.events()
			})) as Event;

			return reply.send(successResponse(event, "活動更新成功"));
		}
	);

	// Delete event - only admin can delete events
	fastify.delete<{
		Params: { id: string };
	}>(
		"/events/:id",
		{
			preHandler: requireAdmin,
			schema: eventSchemas.deleteEvent
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
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
				where: { id },
				// @ts-expect-error - uncache is an extension so it's not properly typed
				uncache: CacheInvalidation.events()
			});

			return reply.send(successResponse(null, "活動刪除成功"));
		}
	);

	// List events - admin sees all, eventAdmin sees only their assigned events
	fastify.get<{
		Querystring: { isActive?: boolean };
	}>(
		"/events",
		{
			preHandler: requireEventListAccess,
			schema: { ...eventSchemas.listEvents, tags: ["admin/events"] }
		},
		async (request: FastifyRequest<{ Querystring: { isActive?: boolean } }>, reply: FastifyReply) => {
			const { isActive } = request.query;

			const whereClause: any = {};
			if (isActive !== undefined) {
				whereClause.isActive = isActive;
			}

			if (request.userEventPermissions && request.userEventPermissions.length > 0) {
				whereClause.id = { in: request.userEventPermissions };
			}

			const events = (await prisma.event.findMany({
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
			})) as Event[];

			return reply.send(successResponse(events));
		}
	);
};

export default adminEventsRoutes;
