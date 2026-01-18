import type { Event, EventCreateRequest, EventUpdateRequest } from "@sitcontix/types";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import prisma from "#config/database";
import { requireAdmin, requireEventAccess, requireEventListAccess } from "#middleware/auth";
import { eventSchemas } from "#schemas";
import { CacheInvalidation } from "#utils/cache-keys";
import { conflictResponse, notFoundResponse, successResponse, validationErrorResponse } from "#utils/response";
import { sanitizeObject } from "#utils/sanitize";

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
			const { name, description, plainDescription, startDate, endDate, editDeadline, location, ogImage } = sanitizedBody;

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

			let editDeadlineDate: Date | null = null;
			if (editDeadline) {
				editDeadlineDate = new Date(editDeadline);
				if (isNaN(editDeadlineDate.getTime())) {
					const { response, statusCode } = validationErrorResponse("無效的編輯截止日期格式");
					return reply.code(statusCode).send(response);
				}
				if (editDeadlineDate >= start) {
					const { response, statusCode } = validationErrorResponse("編輯截止時間必須早於活動開始時間");
					return reply.code(statusCode).send(response);
				}
			}

			const createdEvent = await prisma.event.create({
				data: {
					name,
					description,
					plainDescription,
					startDate: start,
					endDate: end,
					editDeadline: editDeadlineDate,
					location,
					ogImage,
					isActive: true
				},
				// @ts-expect-error - uncache is an extension so it's not properly typed
				uncache: CacheInvalidation.events()
			});

			const event: Event = {
				...createdEvent,
				name: createdEvent.name as Record<string, string>,
				description: createdEvent.description as Record<string, string> | undefined,
				plainDescription: createdEvent.plainDescription as Record<string, string> | undefined,
				startDate: createdEvent.startDate.toISOString(),
				endDate: createdEvent.endDate.toISOString(),
				editDeadline: createdEvent.editDeadline?.toISOString() ?? null,
				createdAt: createdEvent.createdAt.toISOString(),
				updatedAt: createdEvent.updatedAt.toISOString()
			};

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

			// Validate editDeadline if provided (must be before startDate)
			if (updateData.editDeadline !== undefined) {
				if (updateData.editDeadline !== null) {
					const editDeadlineDate = new Date(updateData.editDeadline);
					if (isNaN(editDeadlineDate.getTime())) {
						const { response, statusCode } = validationErrorResponse("無效的編輯截止日期格式");
						return reply.code(statusCode).send(response);
					}
					const startDate = updateData.startDate ? new Date(updateData.startDate) : existingEvent.startDate;
					if (editDeadlineDate >= startDate) {
						const { response, statusCode } = validationErrorResponse("編輯截止時間必須早於活動開始時間");
						return reply.code(statusCode).send(response);
					}
				}
			}

			const updatePayload: any = {
				...updateData,
				...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
				...(updateData.endDate && { endDate: new Date(updateData.endDate) }),
				...(updateData.editDeadline !== undefined && {
					editDeadline: updateData.editDeadline ? new Date(updateData.editDeadline) : null
				}),
				updatedAt: new Date()
			};

			const updatedEvent = await prisma.event.update({
				where: { id },
				data: updatePayload,
				// @ts-expect-error - uncache is an extension so it's not properly typed
				uncache: CacheInvalidation.events()
			});

			const event: Event = {
				...updatedEvent,
				name: updatedEvent.name as Record<string, string>,
				description: updatedEvent.description as Record<string, string> | undefined,
				plainDescription: updatedEvent.plainDescription as Record<string, string> | undefined,
				startDate: updatedEvent.startDate.toISOString(),
				endDate: updatedEvent.endDate.toISOString(),
				editDeadline: updatedEvent.editDeadline?.toISOString() ?? null,
				createdAt: updatedEvent.createdAt.toISOString(),
				updatedAt: updatedEvent.updatedAt.toISOString()
			};

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

			const rawEvents = await prisma.event.findMany({
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

			const events: Event[] = rawEvents.map(event => ({
				...event,
				name: event.name as Record<string, string>,
				description: event.description as Record<string, string> | undefined,
				plainDescription: event.plainDescription as Record<string, string> | undefined,
				startDate: event.startDate instanceof Date ? event.startDate.toISOString() : event.startDate,
				endDate: event.endDate instanceof Date ? event.endDate.toISOString() : event.endDate,
				editDeadline: event.editDeadline instanceof Date ? event.editDeadline.toISOString() : event.editDeadline ?? null,
				createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
				updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : event.updatedAt
			}));

			return reply.send(successResponse(events));
		}
	);
};

export default adminEventsRoutes;
