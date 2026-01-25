import type { EventFormField, EventFormFieldCreateRequest, EventFormFieldUpdateRequest } from "@sitcontix/types";
import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { requireEventAccess, requireEventAccessViaFieldId } from "#middleware/auth";
import { Prisma } from "#prisma/generated/prisma/client";
import { adminEventFormFieldSchemas, eventFormFieldSchemas } from "#schemas";
import { logger } from "#utils/logger";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";

const componentLogger = logger.child({ component: "admin/eventFormFields" });

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
			const span = tracer.startSpan("route.admin.event_form_fields.create", {
				attributes: {
					"event.id": request.body.eventId,
					"field.type": request.body.type,
					"field.order": request.body.order,
					"field.required": request.body.required || false
				}
			});

			try {
				await requireEventAccess.call(this, request, reply, () => {});
				const { eventId, order, type, validater, name, description, placeholder, required, values, filters, prompts } = request.body;

				span.addEvent("query.event.start");

				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					span.addEvent("event.not_found");
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("check.order_conflict");

				const existingOrder = await prisma.eventFormFields.findFirst({
					where: {
						eventId,
						order
					}
				});

				if (existingOrder) {
					span.addEvent("validation.failed", { reason: "order_conflict" });
					const { response, statusCode } = conflictResponse("此活動已存在相同排序的欄位");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("field.create.start");

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
					}
				})) as EventFormField;

				span.setAttribute("field.id", formField.id);
				span.setStatus({ code: SpanStatusCode.OK });

				// Normalize filters: convert empty/invalid filters to null
				const normalizedField = {
					...formField,
					filters: formField.filters && typeof formField.filters === "object" && "enabled" in formField.filters ? formField.filters : null
				};

				return reply.code(201).send(successResponse(normalizedField, "表單欄位創建成功"));
			} catch (error) {
				componentLogger.error({ error }, "Create event form field error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to create event form field"
				});
				const { response, statusCode } = serverErrorResponse("創建表單欄位失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
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
			const span = tracer.startSpan("route.admin.event_form_fields.get", {
				attributes: {
					"field.id": request.params.id
				}
			});

			try {
				const { id } = request.params;

				span.addEvent("query.field.start");

				const formField = (await prisma.eventFormFields.findUnique({
					where: { id }
				})) as EventFormField | null;

				if (!formField) {
					span.addEvent("field.not_found");
					const { response, statusCode } = notFoundResponse("表單欄位不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("field.type", formField.type);
				span.setAttribute("field.required", formField.required);
				span.setStatus({ code: SpanStatusCode.OK });

				// Normalize filters: convert empty/invalid filters to null
				const normalizedField = {
					...formField,
					filters: formField.filters && typeof formField.filters === "object" && "enabled" in formField.filters ? formField.filters : null
				};

				return reply.send(successResponse(normalizedField));
			} catch (error) {
				componentLogger.error({ error }, "Get event form field error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get event form field"
				});
				const { response, statusCode } = serverErrorResponse("取得表單欄位資訊失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
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
			const span = tracer.startSpan("route.admin.event_form_fields.update", {
				attributes: {
					"field.id": request.params.id,
					"update.has_order_change": request.body.order !== undefined,
					"update.has_type_change": request.body.type !== undefined
				}
			});

			try {
				const { id } = request.params;
				const updateData = request.body;

				span.addEvent("query.field.start");

				const existingField = await prisma.eventFormFields.findUnique({
					where: { id }
				});

				if (!existingField) {
					span.addEvent("field.not_found");
					const { response, statusCode } = notFoundResponse("表單欄位不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("field.event_id", existingField.eventId);

				if (updateData.order !== undefined && updateData.order !== existingField.order) {
					span.addEvent("check.order_conflict");

					const orderConflict = await prisma.eventFormFields.findFirst({
						where: {
							eventId: existingField.eventId,
							order: updateData.order,
							id: { not: id }
						}
					});

					if (orderConflict) {
						span.addEvent("validation.failed", { reason: "order_conflict" });
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

				span.addEvent("field.update.start");

				const formField = (await prisma.eventFormFields.update({
					where: { id },
					data
				})) as EventFormField;

				span.setStatus({ code: SpanStatusCode.OK });

				// Normalize filters: convert empty/invalid filters to null
				const normalizedField = {
					...formField,
					filters: formField.filters && typeof formField.filters === "object" && "enabled" in formField.filters ? formField.filters : null
				};

				return reply.send(successResponse(normalizedField, "表單欄位更新成功"));
			} catch (error) {
				componentLogger.error({ error }, "Update event form field error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to update event form field"
				});
				const { response, statusCode } = serverErrorResponse("更新表單欄位失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
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
			const span = tracer.startSpan("route.admin.event_form_fields.delete", {
				attributes: {
					"field.id": request.params.id
				}
			});

			try {
				const { id } = request.params;

				span.addEvent("query.field.start");

				const existingField = await prisma.eventFormFields.findUnique({
					where: { id }
				});

				if (!existingField) {
					span.addEvent("field.not_found");
					const { response, statusCode } = notFoundResponse("表單欄位不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("field.event_id", existingField.eventId);
				span.setAttribute("field.type", existingField.type);
				span.addEvent("field.delete.start");

				await prisma.eventFormFields.delete({
					where: { id }
				});

				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(successResponse(null, "表單欄位刪除成功"));
			} catch (error) {
				componentLogger.error({ error }, "Delete event form field error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to delete event form field"
				});
				const { response, statusCode } = serverErrorResponse("刪除表單欄位失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
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
			const span = tracer.startSpan("route.admin.event_form_fields.list", {
				attributes: {
					"filter.has_event_id": !!request.query.eventId
				}
			});

			try {
				const { eventId } = request.query;

				if (eventId) {
					span.setAttribute("filter.event_id", eventId);
					await requireEventAccess.call(this, request, reply, () => {});
				}

				const where: Record<string, unknown> = {};
				if (eventId) {
					span.addEvent("query.event.start");

					const event = await prisma.event.findUnique({
						where: { id: eventId }
					});

					if (!event) {
						span.addEvent("event.not_found");
						const { response, statusCode } = notFoundResponse("活動不存在");
						return reply.code(statusCode).send(response);
					}

					where.eventId = eventId;
				}

				span.addEvent("query.fields.start");

				const formFields = (await prisma.eventFormFields.findMany({
					where,
					orderBy: [{ eventId: "asc" }, { order: "asc" }]
				})) as EventFormField[];

				span.setAttribute("fields.count", formFields.length);
				span.setStatus({ code: SpanStatusCode.OK });

				// Normalize filters: convert empty/invalid filters to null
				const normalizedFields = formFields.map(field => ({
					...field,
					filters: field.filters && typeof field.filters === "object" && "enabled" in field.filters ? field.filters : null
				}));

				return reply.send(successResponse(normalizedFields));
			} catch (error) {
				componentLogger.error({ error }, "List event form fields error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to list event form fields"
				});
				const { response, statusCode } = serverErrorResponse("取得表單欄位列表失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	fastify.put<{
		Params: { eventId: string };
		Body: { fieldOrders: Array<{ id: string; order: number }> };
	}>(
		"/events/:eventId/form-fields/reorder",
		{
			schema: adminEventFormFieldSchemas.reorderEventFormFields
		},
		async function (this: FastifyInstance, request: FastifyRequest<{ Params: { eventId: string }; Body: { fieldOrders: Array<{ id: string; order: number }> } }>, reply: FastifyReply) {
			const span = tracer.startSpan("route.admin.event_form_fields.reorder", {
				attributes: {
					"event.id": request.params.eventId,
					"fields.count": request.body.fieldOrders.length
				}
			});

			try {
				const { eventId } = request.params;

				await requireEventAccess.call(this, request, reply, () => {});

				const { fieldOrders } = request.body;

				span.addEvent("query.event.start");

				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					span.addEvent("event.not_found");
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("query.fields.verify");

				const fieldIds = fieldOrders.map(f => f.id);
				const existingFields = await prisma.eventFormFields.findMany({
					where: {
						id: { in: fieldIds },
						eventId
					}
				});

				if (existingFields.length !== fieldIds.length) {
					span.addEvent("validation.failed", { reason: "fields_not_belong_to_event" });
					const { response, statusCode } = validationErrorResponse("部分表單欄位不屬於此活動");
					return reply.code(statusCode).send(response);
				}

				const orders = fieldOrders.map(f => f.order);
				const uniqueOrders = new Set(orders);
				if (orders.length !== uniqueOrders.size) {
					span.addEvent("validation.failed", { reason: "duplicate_orders" });
					const { response, statusCode } = validationErrorResponse("排序編號不能重複");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("reorder.transaction.start");

				await prisma.$transaction(async prisma => {
					for (const { id, order } of fieldOrders) {
						await prisma.eventFormFields.update({
							where: { id },
							data: { order }
						});
					}
				});

				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(successResponse(null, "表單欄位排序更新成功"));
			} catch (error) {
				componentLogger.error({ error }, "Reorder event form fields error");
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to reorder event form fields"
				});
				const { response, statusCode } = serverErrorResponse("更新表單欄位排序失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);
};

export default adminEventFormFieldsRoutes;
