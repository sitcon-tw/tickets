/**
 * @fileoverview Admin form fields routes with modular types and schemas
 * @typedef {import('../../types/database.js').FormField} FormField
 * @typedef {import('../../types/api.js').FormFieldCreateRequest} FormFieldCreateRequest
 * @typedef {import('../../types/api.js').ValidationRules} ValidationRules
 */

import prisma from "#config/database.js";
import { 
	successResponse, 
	validationErrorResponse, 
	notFoundResponse, 
	serverErrorResponse,
	conflictResponse
} from "#utils/response.js";
import { formFieldSchemas } from "../../schemas/formField.js";

/**
 * Admin form fields routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {Object} options 
 */
export default async function adminFormFieldsRoutes(fastify, options) {
	// Create new form field
	fastify.post(
		"/form-fields",
		{
			schema: formFieldSchemas.createFormField
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Body: FormFieldCreateRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				/** @type {FormFieldCreateRequest} */
				const { eventId, name, label, type, isRequired, options, validation, order } = request.body;

				// Verify event exists
				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				// Check for duplicate field names in the same event
				const existingField = await prisma.formField.findFirst({
					where: { 
						eventId,
						name 
					}
				});

				if (existingField) {
					const { response, statusCode } = conflictResponse("此活動已存在同名欄位");
					return reply.code(statusCode).send(response);
				}

				// Validate field type specific requirements
				if (['select', 'radio', 'checkbox'].includes(type) && (!options || options.length === 0)) {
					const { response, statusCode } = validationErrorResponse("選項欄位必須提供選項");
					return reply.code(statusCode).send(response);
				}

				/** @type {FormField} */
				const formField = await prisma.formField.create({
					data: {
						eventId,
						name,
						label,
						type,
						isRequired: isRequired || false,
						options: options ? JSON.stringify(options) : null,
						validation: validation ? JSON.stringify(validation) : null,
						order: order || 0,
						isActive: true
					}
				});

				return reply.code(201).send(successResponse(formField, "表單欄位創建成功"));
			} catch (error) {
				console.error("Create form field error:", error);
				const { response, statusCode } = serverErrorResponse("創建表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get form field by ID
	fastify.get(
		"/form-fields/:id",
		{
			schema: formFieldSchemas.getFormField
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				/** @type {FormField | null} */
				const formField = await prisma.formField.findUnique({
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

				// Parse JSON fields
				const fieldWithParsedData = {
					...formField,
					options: formField.options ? JSON.parse(formField.options) : null,
					validation: formField.validation ? JSON.parse(formField.validation) : null
				};

				return reply.send(successResponse(fieldWithParsedData));
			} catch (error) {
				console.error("Get form field error:", error);
				const { response, statusCode } = serverErrorResponse("取得表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Update form field
	fastify.put(
		"/form-fields/:id",
		{
			schema: formFieldSchemas.updateFormField
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}, Body: Partial<FormFieldCreateRequest>}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;
				const updateData = request.body;

				// Check if form field exists
				const existingField = await prisma.formField.findUnique({
					where: { id }
				});

				if (!existingField) {
					const { response, statusCode } = notFoundResponse("表單欄位不存在");
					return reply.code(statusCode).send(response);
				}

				// Check for name conflicts in the same event
				if (updateData.name && updateData.name !== existingField.name) {
					const nameConflict = await prisma.formField.findFirst({
						where: { 
							eventId: existingField.eventId,
							name: updateData.name,
							id: { not: id }
						}
					});

					if (nameConflict) {
						const { response, statusCode } = conflictResponse("此活動已存在同名欄位");
						return reply.code(statusCode).send(response);
					}
				}

				// Validate field type specific requirements
				const fieldType = updateData.type || existingField.type;
				if (['select', 'radio', 'checkbox'].includes(fieldType)) {
					const options = updateData.options || JSON.parse(existingField.options || '[]');
					if (!options || options.length === 0) {
						const { response, statusCode } = validationErrorResponse("選項欄位必須提供選項");
						return reply.code(statusCode).send(response);
					}
				}

				// Prepare update data
				const updatePayload = {
					...updateData,
					...(updateData.options && { options: JSON.stringify(updateData.options) }),
					...(updateData.validation && { validation: JSON.stringify(updateData.validation) }),
					updatedAt: new Date()
				};

				/** @type {FormField} */
				const formField = await prisma.formField.update({
					where: { id },
					data: updatePayload
				});

				// Parse JSON fields for response
				const fieldWithParsedData = {
					...formField,
					options: formField.options ? JSON.parse(formField.options) : null,
					validation: formField.validation ? JSON.parse(formField.validation) : null
				};

				return reply.send(successResponse(fieldWithParsedData, "表單欄位更新成功"));
			} catch (error) {
				console.error("Update form field error:", error);
				const { response, statusCode } = serverErrorResponse("更新表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Delete form field
	fastify.delete(
		"/form-fields/:id",
		{
			schema: formFieldSchemas.deleteFormField
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				// Check if form field exists
				const existingField = await prisma.formField.findUnique({
					where: { id }
				});

				if (!existingField) {
					const { response, statusCode } = notFoundResponse("表單欄位不存在");
					return reply.code(statusCode).send(response);
				}

				// Check if field is being used in registrations
				const registrationCount = await prisma.registration.count({
					where: {
						eventId: existingField.eventId,
						formData: {
							path: ['$.' + existingField.name],
							not: null
						}
					}
				});

				if (registrationCount > 0) {
					const { response, statusCode } = conflictResponse("無法刪除已被使用的表單欄位");
					return reply.code(statusCode).send(response);
				}

				await prisma.formField.delete({
					where: { id }
				});

				return reply.send(successResponse(null, "表單欄位刪除成功"));
			} catch (error) {
				console.error("Delete form field error:", error);
				const { response, statusCode } = serverErrorResponse("刪除表單欄位失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// List form fields
	fastify.get(
		"/form-fields",
		{
			schema: formFieldSchemas.listFormFields
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Querystring: {eventId?: string, isActive?: boolean}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { eventId, isActive } = request.query;

				// Build where clause
				const where = {};
				if (eventId) where.eventId = eventId;
				if (isActive !== undefined) where.isActive = isActive;

				/** @type {FormField[]} */
				const formFields = await prisma.formField.findMany({
					where,
					include: {
						event: {
							select: {
								id: true,
								name: true
							}
						}
					},
					orderBy: [
						{ eventId: 'asc' },
						{ order: 'asc' },
						{ createdAt: 'asc' }
					]
				});

				// Parse JSON fields for each form field
				const fieldsWithParsedData = formFields.map(field => ({
					...field,
					options: field.options ? JSON.parse(field.options) : null,
					validation: field.validation ? JSON.parse(field.validation) : null
				}));

				return reply.send(successResponse(fieldsWithParsedData));
			} catch (error) {
				console.error("List form fields error:", error);
				const { response, statusCode } = serverErrorResponse("取得表單欄位列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Reorder form fields
	fastify.put(
		"/form-fields/reorder",
		{
			schema: {
				description: "重新排序表單欄位",
				tags: ["admin/form-fields"],
				body: {
					type: 'object',
					properties: {
						eventId: {
							type: 'string',
							description: '活動 ID'
						},
						fieldOrders: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									fieldId: { type: 'string' },
									order: { type: 'integer', minimum: 0 }
								},
								required: ['fieldId', 'order']
							},
							description: '欄位排序'
						}
					},
					required: ['eventId', 'fieldOrders']
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Body: {eventId: string, fieldOrders: {fieldId: string, order: number}[]}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { eventId, fieldOrders } = request.body;

				// Verify event exists
				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				// Verify all field IDs belong to the event
				const fieldIds = fieldOrders.map(item => item.fieldId);
				const existingFields = await prisma.formField.findMany({
					where: {
						id: { in: fieldIds },
						eventId
					}
				});

				if (existingFields.length !== fieldIds.length) {
					const { response, statusCode } = validationErrorResponse("部分欄位不存在或不屬於此活動");
					return reply.code(statusCode).send(response);
				}

				// Update field orders in a transaction
				await prisma.$transaction(
					fieldOrders.map(item =>
						prisma.formField.update({
							where: { id: item.fieldId },
							data: { order: item.order }
						})
					)
				);

				return reply.send(successResponse(null, "欄位排序更新成功"));
			} catch (error) {
				console.error("Reorder form fields error:", error);
				const { response, statusCode } = serverErrorResponse("欄位排序更新失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}