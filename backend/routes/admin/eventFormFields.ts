import type { EventFormFields } from "#types/database";
import { Prisma } from "@prisma/client";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";

import prisma from "#config/database";
import { requireEventAccess, requireEventAccessViaFieldId } from "#middleware/auth";
import { CacheInvalidation } from "#utils/cache-keys.ts";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";
import { eventFormFieldCreateSchema, eventFormFieldUpdateSchema, eventFormFieldReorderSchema } from "@tickets/shared";

const adminEventFormFieldsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	// Create new event form field
	fastify.post(
		"/event-form-fields",
		{
			schema: {
				description: "Create event form field",
				tags: ["admin/event-form-fields"],
				body: eventFormFieldCreateSchema,
			},
		},
		async function (this: FastifyInstance, request, reply) {
			try {
				await requireEventAccess.call(this, request, reply, () => {});
				const { eventId, order, type, validater, name, description, placeholder, required, values, filters, prompts } = request.body as {
					eventId: string;
					order: number;
					type: string;
					validater?: string;
					name: string | Record<string, string>;
					description: string | Record<string, string>;
					placeholder?: string | Record<string, string>;
					required?: boolean;
					values?: string;
					filters?: string;
					prompts?: string;
				};

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
						description: description && typeof description === "object" ? description : {},
						placeholder: typeof placeholder === "string" ? placeholder : (placeholder && typeof placeholder === "object" ? null : null),
						required: required || false,
						values: values === "" ? Prisma.DbNull : (values ?? Prisma.DbNull),
						filters: filters === "" ? Prisma.DbNull : (filters ?? Prisma.DbNull),
						prompts: prompts === "" ? Prisma.DbNull : (prompts ?? Prisma.DbNull)
					},
					// @ts-expect-error - uncache is added by prisma-extension-redis
					uncache: CacheInvalidation.eventFormFields()
				})) as EventFormFields;

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
			schema: {
				description: "Get event form field by ID",
				tags: ["admin/event-form-fields"],
			},
		},
		async (request, reply) => {
			try {
				const { id } = request.params as { id: string };

				const formField = (await prisma.eventFormFields.findUnique({
					where: { id },
					include: {
						event: {
							select: {
								id: true,
								name: true
							}
						}
					}
				})) as EventFormFields | null;

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
			schema: {
				description: "Update event form field",
				tags: ["admin/event-form-fields"],
				body: eventFormFieldUpdateSchema,
			},
		},
		async (request, reply) => {
			try {
				const { id } = request.params as { id: string };
				const updateData = request.body as {
					order?: number;
					type?: string;
					validater?: string;
					name?: string | Record<string, string>;
					description?: string | Record<string, string>;
					placeholder?: string | Record<string, string>;
					required?: boolean;
					values?: string;
					filters?: string;
					prompts?: string;
				};

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
					if (updateData.name === "" || updateData.name === null) {
						delete data.name;
					} else if (typeof updateData.name === "object") {
						data.name = JSON.parse(JSON.stringify(updateData.name));
					}
				}

				if ("description" in updateData) {
					if (updateData.description === "" || updateData.description === null) {
						data.description = null;
					} else if (typeof updateData.description === "object") {
						data.description = JSON.parse(JSON.stringify(updateData.description));
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

				if ("prompts" in updateData) {
					if (updateData.prompts === "" || updateData.prompts === null || (Array.isArray(updateData.prompts) && updateData.prompts.length === 0)) {
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
				})) as EventFormFields;

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
			schema: {
				description: "Delete event form field",
				tags: ["admin/event-form-fields"],
			},
		},
		async (request, reply) => {
			try {
				const { id } = request.params as { id: string };

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
	fastify.get(
		"/event-form-fields",
		{
			schema: {
				description: "List event form fields",
				tags: ["admin/event-form-fields"],
			},
		},
		async function (this: FastifyInstance, request, reply) {
			const { eventId } = request.query as { eventId?: string };

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
					include: {
						event: {
							select: {
								id: true,
								name: true
							}
						}
					},
					orderBy: [{ eventId: "asc" }, { order: "asc" }]
				})) as EventFormFields[];

				return reply.send(successResponse(formFields));
			} catch (error) {
				console.error("List event form fields error:", error);
				const { response, statusCode } = serverErrorResponse("取得表單欄位列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	fastify.put(
		"/events/:eventId/form-fields/reorder",
		{
			schema: {
				description: "Reorder event form fields",
				tags: ["admin/events"],
				body: eventFormFieldReorderSchema,
			}
		},
		async function (this: FastifyInstance, request, reply) {
			const { eventId } = request.params as { eventId: string };

			await requireEventAccess.call(this, request, reply, () => {});

			try {
				const { fieldOrders } = request.body as { fieldOrders: Array<{ id: string; order: number }> };

				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				const fieldIds = fieldOrders.map((f: { id: string; order: number }) => f.id);
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

				const orders = fieldOrders.map((f: { id: string; order: number }) => f.order);
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
