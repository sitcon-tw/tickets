import { LocalizedTextSchema, type Event } from "@sitcontix/types";
import type { FastifyPluginAsync } from "fastify";

import prisma from "#config/database";
import { requireAdmin, requireEventAccess, requireEventListAccess } from "#middleware/auth";
import { eventSchemas } from "#schemas";
import { conflictResponse, notFoundResponse, successResponse, validationErrorResponse } from "#utils/response";
import { sanitizeObject } from "#utils/sanitize";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const adminEventsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	// Create new event - only admin can create events
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/events",
		{
			preHandler: requireAdmin,
			schema: { ...eventSchemas.createEvent, tags: ["admin/events"] }
		},
		async (request, reply) => {
			const rawBody = request.body;

			const sanitizedBody = sanitizeObject(rawBody, true);
			const { name, description, plainDescription, startDate, endDate, editDeadline, locationText, mapLink, ogImage } = sanitizedBody;

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
					locationText,
					mapLink,
					ogImage,
					isActive: true
				}
			});

			const event: Event = {
				...createdEvent,
				name: createdEvent.name as Record<string, string>,
				description: createdEvent.description as Record<string, string> | undefined,
				plainDescription: createdEvent.plainDescription as Record<string, string> | undefined,
				locationText: createdEvent.locationText as Record<string, string> | undefined,
				startDate: createdEvent.startDate,
				endDate: createdEvent.endDate,
				editDeadline: createdEvent.editDeadline ?? null,
				createdAt: createdEvent.createdAt,
				updatedAt: createdEvent.updatedAt
			};

			return reply.code(201).send(successResponse(event, "活動創建成功"));
		}
	);

	// Get event by ID - admin and eventAdmin (for their events) can access
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/events/:id",
		{
			preHandler: requireEventAccess,
			schema: { ...eventSchemas.getEvent, tags: ["admin/events"] }
		},
		async (request, reply) => {
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
	fastify.withTypeProvider<ZodTypeProvider>().put(
		"/events/:id",
		{
			preHandler: requireEventAccess,
			schema: eventSchemas.updateEvent
		},
		async (request, reply) => {
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
				data: updatePayload
			});

			const event: Event = {
				...updatedEvent,
				name: updatedEvent.name as Record<string, string>,
				description: updatedEvent.description as Record<string, string> | undefined,
				plainDescription: updatedEvent.plainDescription as Record<string, string> | undefined,
				locationText: updatedEvent.locationText as Record<string, string> | undefined,
				startDate: updatedEvent.startDate,
				endDate: updatedEvent.endDate,
				editDeadline: updatedEvent.editDeadline ?? null,
				createdAt: updatedEvent.createdAt,
				updatedAt: updatedEvent.updatedAt
			};

			return reply.send(successResponse(event, "活動更新成功"));
		}
	);

	// Delete event - only admin can delete events
	fastify.withTypeProvider<ZodTypeProvider>().delete(
		"/events/:id",
		{
			preHandler: requireAdmin,
			schema: eventSchemas.deleteEvent
		},
		async (request, reply) => {
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
		}
	);

	// List events - admin sees all, eventAdmin sees only their assigned events
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/events",
		{
			preHandler: requireEventListAccess,
			schema: { ...eventSchemas.listEvents, tags: ["admin/events"] }
		},
		async (request, reply) => {
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

			const events = rawEvents.map(event => {
				return {
					...event,
					name: LocalizedTextSchema.parse(event.name),
					description: LocalizedTextSchema.nullable().parse(event.description),
					plainDescription: LocalizedTextSchema.nullable().parse(event.plainDescription),
					locationText: LocalizedTextSchema.nullable().parse(event.locationText),
					startDate: event.startDate,
					endDate: event.endDate,
					editDeadline: event.editDeadline ?? null,
					createdAt: event.createdAt,
					updatedAt: event.updatedAt
				};
			});

			return reply.send(successResponse(events));
		}
	);
};

export default adminEventsRoutes;
