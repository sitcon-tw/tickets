import type { Event } from "#types/database";
import type { FastifyPluginAsync } from "fastify";

import prisma from "#config/database";
import { requireAdmin, requireEventAccess, requireEventListAccess } from "#middleware/auth";
import { CacheInvalidation } from "#utils/cache-keys";
import { conflictResponse, notFoundResponse, successResponse, validationErrorResponse } from "#utils/response";
import { sanitizeObject } from "#utils/sanitize";
import { eventCreateSchema, eventUpdateSchema } from "@tickets/shared";

const adminEventsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	// Create new event - only admin can create events
	fastify.post(
		"/events",
		{
			preHandler: requireAdmin,
			schema: {
				description: "Create a new event",
				tags: ["admin/events"],
				body: eventCreateSchema,
			},
		},
		async (request, reply) => {
			const rawBody = request.body as Record<string, any>;

			const sanitizedBody = sanitizeObject(rawBody, true) as {
				name: string | Record<string, string>;
				description?: string | Record<string, string>;
				plainDescription?: string | Record<string, string>;
				startDate: string;
				endDate: string;
				location?: string;
				ogImage?: string;
			};
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
	fastify.get(
		"/events/:id",
		{
			preHandler: requireEventAccess,
			schema: {
				description: "Get event by ID",
				tags: ["admin/events"],
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };

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
	fastify.put(
		"/events/:id",
		{
			preHandler: requireEventAccess,
			schema: {
				description: "Update event",
				tags: ["admin/events"],
				body: eventUpdateSchema,
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const updateData = request.body as {
				slug?: string;
				name?: string | Record<string, string>;
				description?: string | Record<string, string>;
				plainDescription?: string | Record<string, string>;
				startDate?: string;
				endDate?: string;
				location?: string;
				ogImage?: string;
				isActive?: boolean;
				hideEvent?: boolean;
				useOpass?: boolean;
			};

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
	fastify.delete(
		"/events/:id",
		{
			preHandler: requireAdmin,
			schema: {
				description: "Delete event",
				tags: ["admin/events"],
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };

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
	fastify.get(
		"/events",
		{
			preHandler: requireEventListAccess,
			schema: {
				description: "List events",
				tags: ["admin/events"],
			},
		},
		async (request, reply) => {
			const { isActive } = request.query as { isActive?: boolean };

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
