import { Prisma } from "@prisma/client";
import type { EventFormField, EventFormFieldCreateRequest, EventFormFieldUpdateRequest } from "@sitcontix/types";
import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import prisma from "#config/database";
import { requireEventAccess, requireEventAccessViaFieldId } from "#middleware/auth";
import { eventFormFieldSchemas } from "#schemas";
import { CacheInvalidation } from "#utils/cache-keys.ts";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";

const adminEventFormFieldsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	// Create new event form field
	fastify.post<{
		Body: EventFormFieldCreateRequest;
	}>(
		"/event-form-fields",
		{
			schema: eventFormFieldSchemas.createEventFormField
		},
		async function (this: FastifyInstance, request: FastifyRequest<{ Body: EventFormFieldCreateRequest }>, reply: FastifyReply) {
			try {
				await requireEventAccess.call(this, request, reply, () => {});
				const { eventId, order, type, validater, name, description, placeholder, required, values, filters, prompts } = request.body;

				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

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

				const formField = (await prisma.eventFormFields.create({
					data: {
						eventId,
						order,
						type,
						validater: validater === "" ? null : (validater ?? null),
						name,
						description: description,
						placeholder: placeholder === "" ? null : (placeholder ?? null),
						required: required || false,
						values: !values || values.length === 0 ? Prisma.DbNull : values,
						filters: !filters || Object.keys(filters).length === 0 ? Prisma.DbNull : filters,
						prompts: !prompts || (Array.isArray(prompts) && prompts.length === 0) ? Prisma.DbNull : prompts
					},
					// @ts-expect-error - uncache is added by prisma-extension-redis
					uncache: CacheInvalidation.eventFormFields()
				})) as EventFormField;

				return reply.code(201).send(successResponse(formField, "表單欄位創建成功"));
			} catch (error) {
				console.error("Create event form field error:", error);
				const { response, statusCode } = serverErrorResponse("創建表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get event form field by ID
	fastify.get<{
		Params: { id: string };
	}>(
		"/event-form-fields/:id",
		{
			preHandler: requireEventAccessViaFieldId,
			schema: eventFormFieldSchemas.getEventFormField
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;

				const formField = (await prisma.eventFormFields.findUnique({
					where: { id }
				})) as EventFormField | null;

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
	fastify.put<{
		Params: { id: string };
		Body: EventFormFieldUpdateRequest;
	}>(
		"/event-form-fields/:id",
		{
			preHandler: requireEventAccessViaFieldId,
			schema: eventFormFieldSchemas.updateEventFormField
		},
		async (request: FastifyRequest<{ Params: { id: string }; Body: EventFormFieldUpdateRequest }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;
				const updateData = request.body;

				const existingField = await prisma.eventFormFields.findUnique({
					where: { id }
				});

				if (!existingField) {
					const { response, statusCode } = notFoundResponse("表單欄位不存在");
					return reply.code(statusCode).send(response);
				}

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

				const data: Record<string, unknown> = { ...updateData };

				delete data.eventId;

				if (updateData.validater === "") data.validater = null;
				if (updateData.placeholder === "") data.placeholder = null;

				if ("name" in updateData) {
					if (updateData.name === null || updateData.name === undefined) {
						delete data.name;
					} else if (typeof updateData.name === "object") {
						data.name = JSON.parse(JSON.stringify(updateData.name));
					}
				}

				if ("description" in updateData) {
					if (updateData.description === null || updateData.description === undefined) {
						data.description = null;
					} else if (typeof updateData.description === "object") {
						data.description = JSON.parse(JSON.stringify(updateData.description));
					}
				}

				if ("values" in updateData) {
					if (updateData.values === null || updateData.values === undefined || (Array.isArray(updateData.values) && updateData.values.length === 0)) {
						data.values = null;
					} else if (Array.isArray(updateData.values)) {
						data.values = JSON.parse(JSON.stringify(updateData.values));
					}
				}

				if ("filters" in updateData) {
					if (updateData.filters === null || updateData.filters === undefined) {
						data.filters = null;
					} else if (typeof updateData.filters === "object") {
						data.filters = JSON.parse(JSON.stringify(updateData.filters));
					}
				}

				if ("prompts" in updateData) {
					if (updateData.prompts === null || updateData.prompts === undefined || (Array.isArray(updateData.prompts) && updateData.prompts.length === 0)) {
						data.prompts = null;
					} else if (Array.isArray(updateData.prompts)) {
						data.prompts = JSON.parse(JSON.stringify(updateData.prompts));
					}
				}

				const formField = (await prisma.eventFormFields.update({
					where: { id },
					data,
					// @ts-expect-error - uncache is added by prisma-extension-redis
					uncache: {
						uncacheKeys: ["prisma:event_form_fields:*"],
						hasPattern: true
					}
				})) as EventFormField;

				return reply.send(successResponse(formField, "表單欄位更新成功"));
			} catch (error) {
				console.error("Update event form field error:", error);
				const { response, statusCode } = serverErrorResponse("更新表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Delete event form field
	fastify.delete<{
		Params: { id: string };
	}>(
		"/event-form-fields/:id",
		{
			preHandler: requireEventAccessViaFieldId,
			schema: eventFormFieldSchemas.deleteEventFormField
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;

				const existingField = await prisma.eventFormFields.findUnique({
					where: { id }
				});

				if (!existingField) {
					const { response, statusCode } = notFoundResponse("表單欄位不存在");
					return reply.code(statusCode).send(response);
				}

				await prisma.eventFormFields.delete({
					where: { id },
					// @ts-expect-error - uncache is added by prisma-extension-redis
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
	fastify.get<{
		Querystring: { eventId?: string };
	}>(
		"/event-form-fields",
		{
			schema: eventFormFieldSchemas.listEventFormFields
		},
		async function (this: FastifyInstance, request: FastifyRequest<{ Querystring: { eventId?: string } }>, reply: FastifyReply) {
			const { eventId } = request.query;

			if (eventId) {
				await requireEventAccess.call(this, request, reply, () => {});
			}

			try {
				const where: Record<string, unknown> = {};
				if (eventId) {
					const event = await prisma.event.findUnique({
						where: { id: eventId }
					});

					if (!event) {
						const { response, statusCode } = notFoundResponse("活動不存在");
						return reply.code(statusCode).send(response);
					}

					where.eventId = eventId;
				}

				const formFields = (await prisma.eventFormFields.findMany({
					where,
					orderBy: [{ eventId: "asc" }, { order: "asc" }]
				})) as EventFormField[];

				return reply.send(successResponse(formFields));
			} catch (error) {
				console.error("List event form fields error:", error);
				const { response, statusCode } = serverErrorResponse("取得表單欄位列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	fastify.put<{
		Params: { eventId: string };
		Body: { fieldOrders: Array<{ id: string; order: number }> };
	}>(
		"/events/:eventId/form-fields/reorder",
		{
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
		async function (this: FastifyInstance, request: FastifyRequest<{ Params: { eventId: string }; Body: { fieldOrders: Array<{ id: string; order: number }> } }>, reply: FastifyReply) {
			const { eventId } = request.params;

			await requireEventAccess.call(this, request, reply, () => {});

			try {
				const { fieldOrders } = request.body;

				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

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

				const orders = fieldOrders.map(f => f.order);
				const uniqueOrders = new Set(orders);
				if (orders.length !== uniqueOrders.size) {
					const { response, statusCode } = validationErrorResponse("排序編號不能重複");
					return reply.code(statusCode).send(response);
				}

				await prisma.$transaction(async prisma => {
					for (const { id, order } of fieldOrders) {
						await prisma.eventFormFields.update({
							where: { id },
							data: { order },
							// @ts-expect-error - uncache is added by prisma-extension-redis
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
};

export default adminEventFormFieldsRoutes;
