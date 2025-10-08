/**
 * @fileoverview Admin ticket form fields routes with modular types and schemas
 * @typedef {import('#types/database.js').TicketFromFields} TicketFromFields
 * @typedef {import('#types/api.js').TicketFormFieldCreateRequest} TicketFormFieldCreateRequest
 * @typedef {import('#types/api.js').TicketFormFieldUpdateRequest} TicketFormFieldUpdateRequest
 */

import prisma from "#config/database.js";
import {
	successResponse,
	validationErrorResponse,
	notFoundResponse,
	serverErrorResponse,
	conflictResponse
} from "#utils/response.js";
import { ticketFormFieldSchemas } from "#schemas/ticketFormFields.js";

/**
 * Admin ticket form fields routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
export default async function adminTicketFormFieldsRoutes(fastify, options) {
	// Create new ticket form field
	fastify.post(
		"/ticket-form-fields",
		{
			schema: ticketFormFieldSchemas.createTicketFormField
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Body: TicketFormFieldCreateRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				/** @type {TicketFormFieldCreateRequest} */
				const { ticketId, order, type, validater, name, description, placeholder, required, values } = request.body;

				// Verify ticket exists
				const ticket = await prisma.ticket.findUnique({
					where: { id: ticketId }
				});

				if (!ticket) {
					const { response, statusCode } = notFoundResponse("票券不存在");
					return reply.code(statusCode).send(response);
				}

				// Check for duplicate order in the same ticket
				const existingOrder = await prisma.ticketFromFields.findFirst({
					where: {
						ticketId,
						order
					}
				});

				if (existingOrder) {
					const { response, statusCode } = conflictResponse("此票券已存在相同排序的欄位");
					return reply.code(statusCode).send(response);
				}

				/** @type {TicketFromFields} */
				const formField = await prisma.ticketFromFields.create({
					data: {
						ticketId,
						order,
						type,
						validater: validater || null,
						name,
						description: description || null,
						placeholder: placeholder || null,
						required: required || false,
						values: values || null
					}
				});

				return reply.code(201).send(successResponse(formField, "表單欄位創建成功"));
			} catch (error) {
				console.error("Create ticket form field error:", error);
				const { response, statusCode } = serverErrorResponse("創建表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get ticket form field by ID
	fastify.get(
		"/ticket-form-fields/:id",
		{
			schema: ticketFormFieldSchemas.getTicketFormField
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				/** @type {TicketFromFields | null} */
				const formField = await prisma.ticketFromFields.findUnique({
					where: { id },
					include: {
						ticket: {
							select: {
								id: true,
								name: true,
								eventId: true
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
				console.error("Get ticket form field error:", error);
				const { response, statusCode } = serverErrorResponse("取得表單欄位資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Update ticket form field
	fastify.put(
		"/ticket-form-fields/:id",
		{
			schema: ticketFormFieldSchemas.updateTicketFormField
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}, Body: TicketFormFieldUpdateRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;
				/** @type {TicketFormFieldUpdateRequest} */
				const updateData = request.body;

				// Check if form field exists
				const existingField = await prisma.ticketFromFields.findUnique({
					where: { id }
				});

				if (!existingField) {
					const { response, statusCode } = notFoundResponse("表單欄位不存在");
					return reply.code(statusCode).send(response);
				}

				// Check for order conflicts in the same ticket
				if (updateData.order !== undefined && updateData.order !== existingField.order) {
					const orderConflict = await prisma.ticketFromFields.findFirst({
						where: {
							ticketId: existingField.ticketId,
							order: updateData.order,
							id: { not: id }
						}
					});

					if (orderConflict) {
						const { response, statusCode } = conflictResponse("此票券已存在相同排序的欄位");
						return reply.code(statusCode).send(response);
					}
				}

				// Prepare update data, handling JSON fields properly
				const data = { ...updateData };

				// Remove fields that shouldn't be updated
				delete data.ticketId; // ticketId is immutable

				// Handle nullable string fields - convert empty strings to null
				if (updateData.validater === '') data.validater = null;
				if (updateData.placeholder === '') data.placeholder = null;
				if (updateData.description === '') data.description = null;

				// Handle JSON fields - ensure proper serialization for PostgreSQL
				if ('name' in updateData) {
					if (updateData.name === '' || updateData.name === null) {
						delete data.name;
					} else if (typeof updateData.name === 'object') {
						data.name = JSON.parse(JSON.stringify(updateData.name));
					}
				}

				if ('values' in updateData) {
					if (updateData.values === '' || updateData.values === null ||
					    (Array.isArray(updateData.values) && updateData.values.length === 0)) {
						data.values = null;
					} else if (Array.isArray(updateData.values)) {
						data.values = JSON.parse(JSON.stringify(updateData.values));
					}
				}

				/** @type {TicketFromFields} */
				const formField = await prisma.ticketFromFields.update({
					where: { id },
					data
				});

				return reply.send(successResponse(formField, "表單欄位更新成功"));
			} catch (error) {
				console.error("Update ticket form field error:", error);
				const { response, statusCode } = serverErrorResponse("更新表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Delete ticket form field
	fastify.delete(
		"/ticket-form-fields/:id",
		{
			schema: ticketFormFieldSchemas.deleteTicketFormField
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				// Check if form field exists
				const existingField = await prisma.ticketFromFields.findUnique({
					where: { id }
				});

				if (!existingField) {
					const { response, statusCode } = notFoundResponse("表單欄位不存在");
					return reply.code(statusCode).send(response);
				}

				await prisma.ticketFromFields.delete({
					where: { id }
				});

				return reply.send(successResponse(null, "表單欄位刪除成功"));
			} catch (error) {
				console.error("Delete ticket form field error:", error);
				const { response, statusCode } = serverErrorResponse("刪除表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// List ticket form fields
	fastify.get(
		"/ticket-form-fields",
		{
			schema: ticketFormFieldSchemas.listTicketFormFields
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Querystring: {ticketId?: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { ticketId } = request.query;

				// Build where clause
				const where = {};
				if (ticketId) {
					// Verify ticket exists
					const ticket = await prisma.ticket.findUnique({
						where: { id: ticketId }
					});

					if (!ticket) {
						const { response, statusCode } = notFoundResponse("票券不存在");
						return reply.code(statusCode).send(response);
					}

					where.ticketId = ticketId;
				}

				/** @type {TicketFromFields[]} */
				const formFields = await prisma.ticketFromFields.findMany({
					where,
					include: {
						ticket: {
							select: {
								id: true,
								name: true,
								eventId: true
							}
						}
					},
					orderBy: [
						{ ticketId: 'asc' },
						{ order: 'asc' }
					]
				});

				return reply.send(successResponse(formFields));
			} catch (error) {
				console.error("List ticket form fields error:", error);
				const { response, statusCode } = serverErrorResponse("取得表單欄位列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Bulk update form field orders for a ticket
	fastify.put(
		"/tickets/:ticketId/form-fields/reorder",
		{
			schema: {
				description: '重新排序票券表單欄位',
				tags: ['admin/tickets'],
				params: {
					type: 'object',
					properties: {
						ticketId: {
							type: 'string',
							description: '票券 ID'
						}
					},
					required: ['ticketId']
				},
				body: {
					type: 'object',
					properties: {
						fieldOrders: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									id: { type: 'string' },
									order: { type: 'integer', minimum: 0 }
								},
								required: ['id', 'order']
							}
						}
					},
					required: ['fieldOrders']
				},
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							message: { type: 'string' },
							data: { type: 'null' }
						},
						required: ['success', 'message']
					},
					400: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							error: {
								type: 'object',
								properties: {
									code: { type: 'string' },
									message: { type: 'string' }
								}
							}
						}
					}
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {ticketId: string}, Body: {fieldOrders: Array<{id: string, order: number}>}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { ticketId } = request.params;
				const { fieldOrders } = request.body;

				// Verify ticket exists
				const ticket = await prisma.ticket.findUnique({
					where: { id: ticketId }
				});

				if (!ticket) {
					const { response, statusCode } = notFoundResponse("票券不存在");
					return reply.code(statusCode).send(response);
				}

				// Verify all form fields belong to this ticket
				const fieldIds = fieldOrders.map(f => f.id);
				const existingFields = await prisma.ticketFromFields.findMany({
					where: {
						id: { in: fieldIds },
						ticketId
					}
				});

				if (existingFields.length !== fieldIds.length) {
					const { response, statusCode } = validationErrorResponse("部分表單欄位不屬於此票券");
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
				await prisma.$transaction(async (prisma) => {
					for (const { id, order } of fieldOrders) {
						await prisma.ticketFromFields.update({
							where: { id },
							data: { order }
						});
					}
				});

				return reply.send(successResponse(null, "表單欄位排序更新成功"));
			} catch (error) {
				console.error("Reorder ticket form fields error:", error);
				const { response, statusCode } = serverErrorResponse("更新表單欄位排序失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}