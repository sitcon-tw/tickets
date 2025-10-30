/**
 * @fileoverview Admin event form fields routes with modular types and schemas
 * @typedef {import('#types/database.js').EventFormFields} EventFormFields
 * @typedef {import('#types/api.js').EventFormFieldCreateRequest} EventFormFieldCreateRequest
 * @typedef {import('#types/api.js').EventFormFieldUpdateRequest} EventFormFieldUpdateRequest
 */

import prisma from "#config/database.js";
import { requireEventAccess, requireEventAccessViaFieldId } from "#middleware/auth.js";
import { eventFormFieldSchemas } from "#schemas/eventFormFields.js";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response.js";

/**
 * Admin event form fields routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
export default async function adminEventFormFieldsRoutes(fastify, options) {
	// Create new event form field
	fastify.post(
		"/event-form-fields",
		{
			preHandler: async (request, reply) => {
				await requireEventAccess(request, reply, request.body.eventId);
			},
			schema: eventFormFieldSchemas.createEventFormField
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Body: EventFormFieldCreateRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				/** @type {EventFormFieldCreateRequest} */
				const { eventId, order, type, validater, name, description, placeholder, required, values, filters } = request.body;

				// Verify event exists
				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				// Check for duplicate order in the same event
				const existingOrder = await prisma.eventFormFields.findFirst({
					where: {
						eventId,
						order
					}
				});

				if (existingOrder) {
					const { response, statusCode } = conflictResponse("此活動已存在相同排序的欄位");
					return reply.code(statusCode).send(response);
				}

				/** @type {EventFormFields} */
				const formField = await prisma.eventFormFields.create({
					data: {
						eventId,
						order,
						type,
						validater: validater || null,
						name,
						description: description || null,
						placeholder: placeholder || null,
						required: required || false,
						values: values || null,
						filters: filters || null
					},
					uncache: {
						uncacheKeys: ["prisma:event:*"],
						hasPattern: true
					}
				});

				return reply.code(201).send(successResponse(formField, "表單欄位創建成功"));
			} catch (error) {
				console.error("Create event form field error:", error);
				const { response, statusCode } = serverErrorResponse("創建表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get event form field by ID
	fastify.get(
		"/event-form-fields/:id",
		{
			preHandler: requireEventAccessViaFieldId,
			schema: eventFormFieldSchemas.getEventFormField
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				/** @type {EventFormFields | null} */
				const formField = await prisma.eventFormFields.findUnique({
					where: { id },
					include: {
						event: {
							select: {
								id: true,
								name: true
							}
						}
					}
				});

				if (!formField) {
					const { response, statusCode } = notFoundResponse("表單欄位不存在");
					return reply.code(statusCode).send(response);
				}

				return reply.send(successResponse(formField));
			} catch (error) {
				console.error("Get event form field error:", error);
				const { response, statusCode } = serverErrorResponse("取得表單欄位資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Update event form field
	fastify.put(
		"/event-form-fields/:id",
		{
			preHandler: requireEventAccessViaFieldId,
			schema: eventFormFieldSchemas.updateEventFormField
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}, Body: EventFormFieldUpdateRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;
				/** @type {EventFormFieldUpdateRequest} */
				const updateData = request.body;

				// Check if form field exists
				const existingField = await prisma.eventFormFields.findUnique({
					where: { id }
				});

				if (!existingField) {
					const { response, statusCode } = notFoundResponse("表單欄位不存在");
					return reply.code(statusCode).send(response);
				}

				// Check for order conflicts in the same event
				if (updateData.order !== undefined && updateData.order !== existingField.order) {
					const orderConflict = await prisma.eventFormFields.findFirst({
						where: {
							eventId: existingField.eventId,
							order: updateData.order,
							id: { not: id }
						}
					});

					if (orderConflict) {
						const { response, statusCode } = conflictResponse("此活動已存在相同排序的欄位");
						return reply.code(statusCode).send(response);
					}
				}

				// Prepare update data, handling JSON fields properly
				const data = { ...updateData };

				// Remove fields that shouldn't be updated
				delete data.eventId; // eventId is immutable

				// Handle nullable string fields - convert empty strings to null
				if (updateData.validater === "") data.validater = null;
				if (updateData.placeholder === "") data.placeholder = null;
				if (updateData.description === "") data.description = null;

				// Handle JSON fields - ensure proper serialization for PostgreSQL
				if ("name" in updateData) {
					if (updateData.name === "" || updateData.name === null) {
						delete data.name;
					} else if (typeof updateData.name === "object") {
						data.name = JSON.parse(JSON.stringify(updateData.name));
					}
				}

				if ("values" in updateData) {
					if (updateData.values === "" || updateData.values === null || (Array.isArray(updateData.values) && updateData.values.length === 0)) {
						data.values = null;
					} else if (Array.isArray(updateData.values)) {
						data.values = JSON.parse(JSON.stringify(updateData.values));
					}
				}

				if ("filters" in updateData) {
					if (updateData.filters === "" || updateData.filters === null) {
						data.filters = null;
					} else if (typeof updateData.filters === "object") {
						data.filters = JSON.parse(JSON.stringify(updateData.filters));
					}
				}

				/** @type {EventFormFields} */
				const formField = await prisma.eventFormFields.update({
					where: { id },
					data,
					uncache: {
						uncacheKeys: ["prisma:event_form_fields:*"],
						hasPattern: true
					}
				});

				return reply.send(successResponse(formField, "表單欄位更新成功"));
			} catch (error) {
				console.error("Update event form field error:", error);
				const { response, statusCode } = serverErrorResponse("更新表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Delete event form field
	fastify.delete(
		"/event-form-fields/:id",
		{
			preHandler: requireEventAccessViaFieldId,
			schema: eventFormFieldSchemas.deleteEventFormField
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				// Check if form field exists
				const existingField = await prisma.eventFormFields.findUnique({
					where: { id }
				});

				if (!existingField) {
					const { response, statusCode } = notFoundResponse("表單欄位不存在");
					return reply.code(statusCode).send(response);
				}

				await prisma.eventFormFields.delete({
					where: { id },
					uncache: {
						uncacheKeys: ["prisma:event_form_fields:*"],
						hasPattern: true
					}
				});

				return reply.send(successResponse(null, "表單欄位刪除成功"));
			} catch (error) {
				console.error("Delete event form field error:", error);
				const { response, statusCode } = serverErrorResponse("刪除表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// List event form fields
	fastify.get(
		"/event-form-fields",
		{
			preHandler: async (request, reply) => {
				const { eventId } = request.query;
				if (eventId) {
					await requireEventAccess(request, reply, eventId);
				}
			},
			schema: eventFormFieldSchemas.listEventFormFields
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Querystring: {eventId?: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { eventId } = request.query;

				// Build where clause
				const where = {};
				if (eventId) {
					// Verify event exists
					const event = await prisma.event.findUnique({
						where: { id: eventId }
					});

					if (!event) {
						const { response, statusCode } = notFoundResponse("活動不存在");
						return reply.code(statusCode).send(response);
					}

					where.eventId = eventId;
				}

				/** @type {EventFormFields[]} */
				const formFields = await prisma.eventFormFields.findMany({
					where,
					include: {
						event: {
							select: {
								id: true,
								name: true
							}
						}
					},
					orderBy: [{ eventId: "asc" }, { order: "asc" }]
				});

				return reply.send(successResponse(formFields));
			} catch (error) {
				console.error("List event form fields error:", error);
				const { response, statusCode } = serverErrorResponse("取得表單欄位列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Bulk update form field orders for an event
	fastify.put(
		"/events/:eventId/form-fields/reorder",
		{
			preHandler: async (request, reply) => {
				await requireEventAccess(request, reply, request.params.eventId);
			},
			schema: {
				description: "重新排序活動表單欄位",
				tags: ["admin/events"],
				params: {
					type: "object",
					properties: {
						eventId: {
							type: "string",
							description: "活動 ID"
						}
					},
					required: ["eventId"]
				},
				body: {
					type: "object",
					properties: {
						fieldOrders: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: { type: "string" },
									order: { type: "integer", minimum: 0 }
								},
								required: ["id", "order"]
							}
						}
					},
					required: ["fieldOrders"]
				},
				response: {
					200: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							message: { type: "string" },
							data: { type: "null" }
						},
						required: ["success", "message"]
					},
					400: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							error: {
								type: "object",
								properties: {
									code: { type: "string" },
									message: { type: "string" }
								}
							}
						}
					}
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {eventId: string}, Body: {fieldOrders: Array<{id: string, order: number}>}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { eventId } = request.params;
				const { fieldOrders } = request.body;

				// Verify event exists
				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				// Verify all form fields belong to this event
				const fieldIds = fieldOrders.map(f => f.id);
				const existingFields = await prisma.eventFormFields.findMany({
					where: {
						id: { in: fieldIds },
						eventId
					}
				});

				if (existingFields.length !== fieldIds.length) {
					const { response, statusCode } = validationErrorResponse("部分表單欄位不屬於此活動");
					return reply.code(statusCode).send(response);
				}

				// Check for duplicate orders
				const orders = fieldOrders.map(f => f.order);
				const uniqueOrders = new Set(orders);
				if (orders.length !== uniqueOrders.size) {
					const { response, statusCode } = validationErrorResponse("排序編號不能重複");
					return reply.code(statusCode).send(response);
				}

				// Update field orders in a transaction
				await prisma.$transaction(async prisma => {
					for (const { id, order } of fieldOrders) {
						await prisma.eventFormFields.update({
							where: { id },
							data: { order },
							uncache: {
								uncacheKeys: ["prisma:event_form_fields:*"],
								hasPattern: true
							}
						});
					}
				});

				return reply.send(successResponse(null, "表單欄位排序更新成功"));
			} catch (error) {
				console.error("Reorder event form fields error:", error);
				const { response, statusCode } = serverErrorResponse("更新表單欄位排序失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}
