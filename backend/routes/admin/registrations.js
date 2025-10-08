/**
 * @fileoverview Admin registrations routes with modular types and schemas
 * @typedef {import('#types/database.js').Registration} Registration
 * @typedef {import('#types/api.js').RegistrationCreateRequest} RegistrationCreateRequest
 * @typedef {import('#types/api.js').RegistrationUpdateRequest} RegistrationUpdateRequest
 * @typedef {import('#types/api.js').PaginationQuery} PaginationQuery
 */

import prisma from "#config/database.js";
import { 
	successResponse, 
	validationErrorResponse, 
	notFoundResponse, 
	serverErrorResponse,
	conflictResponse,
	createPagination
} from "#utils/response.js";
import { registrationSchemas } from "#schemas/registration.js";
import { safeJsonParse } from "#utils/json.js";

/**
 * Admin registrations routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {Object} options 
 */
export default async function adminRegistrationsRoutes(fastify, options) {
	// List registrations with pagination and filters
	fastify.get(
		"/registrations",
		{
			schema: registrationSchemas.listRegistrations
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Querystring: PaginationQuery & {eventId?: string, status?: string, userId?: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { 
					page = 1, 
					limit = 20, 
					eventId, 
					status, 
					userId
				} = request.query;

				// Build where clause
				const where = {};
				if (eventId) where.eventId = eventId;
				if (status) where.status = status;
				if (userId) where.userId = userId;

				// Get total count for pagination
				const total = await prisma.registration.count({ where });

				/** @type {Registration[]} */
				const registrations = await prisma.registration.findMany({
					where,
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true
							}
						},
						event: {
							select: {
								id: true,
								name: true,
								startDate: true,
								endDate: true
							}
						},
						ticket: {
							select: {
								id: true,
								name: true,
								price: true
							}
						},
						referral: {
							select: {
								id: true,
								code: true
							}
						}
					},
					orderBy: { createdAt: 'desc' },
					skip: (page - 1) * limit,
					take: limit
				});

				// Parse formData from JSON string to object for each registration
				const registrationsWithParsedFormData = registrations.map(reg => ({
					...reg,
					formData: safeJsonParse(reg.formData, {}, 'admin-registrations-list')
				}));

				const pagination = createPagination(page, limit, total);

				return reply.send(successResponse(registrationsWithParsedFormData, "取得報名列表成功", pagination));
			} catch (error) {
				console.error("List registrations error:", error);
				const { response, statusCode } = serverErrorResponse("取得報名列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get registration by ID
	fastify.get(
		"/registrations/:id",
		{
			schema: {...registrationSchemas.getRegistration, tags: ["admin/registrations"]}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				/** @type {Registration | null} */
				const registration = await prisma.registration.findUnique({
					where: { id },
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								role: true
							}
						},
						event: {
							select: {
								id: true,
								name: true,
								startDate: true,
								endDate: true,
								location: true
							}
						},
						ticket: {
							select: {
								id: true,
								name: true,
								description: true,
								price: true
							}
						},
						referral: {
							select: {
								id: true,
								code: true
							}
						}
					}
				});

				if (!registration) {
					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				// Parse formData from JSON string to object
				const registrationWithParsedFormData = {
					...registration,
					formData: safeJsonParse(registration.formData, {}, 'admin-registrations-get')
				};

				return reply.send(successResponse(registrationWithParsedFormData));
			} catch (error) {
				console.error("Get registration error:", error);
				const { response, statusCode } = serverErrorResponse("取得報名詳情失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Update registration
	fastify.put(
		"/registrations/:id",
		{
			schema: {...registrationSchemas.updateRegistration, tags: ["admin/registrations"]}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}, Body: RegistrationUpdateRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;
				/** @type {RegistrationUpdateRequest} */
				const updateData = request.body;

				// Check if registration exists
				const existingRegistration = await prisma.registration.findUnique({
					where: { id },
					include: {
						event: {
							select: {
								startDate: true,
								endDate: true
							}
						}
					}
				});

				if (!existingRegistration) {
					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				// Prevent status changes for past events
				if (updateData.status && new Date() > existingRegistration.event.endDate) {
					const { response, statusCode } = validationErrorResponse("活動已結束，無法修改報名狀態");
					return reply.code(statusCode).send(response);
				}

				/** @type {Registration} */
				const registration = await prisma.registration.update({
					where: { id },
					data: {
						...updateData,
						updatedAt: new Date()
					},
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true
							}
						},
						event: {
							select: {
								id: true,
								name: true
							}
						},
						ticket: {
							select: {
								id: true,
								name: true,
								price: true
							}
						}
					}
				});

				return reply.send(successResponse(registration, "報名更新成功"));
			} catch (error) {
				console.error("Update registration error:", error);
				const { response, statusCode } = serverErrorResponse("更新報名失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Export registrations (CSV/Excel)
	fastify.get(
		"/registrations/export",
		{
			schema: {
				description: "匯出報名資料",
				tags: ["admin/registrations"],
				querystring: {
					type: 'object',
					properties: {
						eventId: {
							type: 'string',
							description: '活動 ID'
						},
						status: {
							type: 'string',
							enum: ['confirmed', 'cancelled', 'pending'],
							description: '報名狀態'
						},
						format: {
							type: 'string',
							enum: ['csv', 'excel'],
							default: 'csv',
							description: '匯出格式'
						}
					}
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Querystring: {eventId?: string, status?: string, format?: 'csv'|'excel'}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { eventId, status, format = 'csv' } = request.query;

				// Build where clause
				const where = {};
				if (eventId) where.eventId = eventId;
				if (status) where.status = status;

				/** @type {Registration[]} */
				const registrations = await prisma.registration.findMany({
					where,
					include: {
						user: {
							select: {
								name: true,
								email: true
							}
						},
						event: {
							select: {
								name: true
							}
						},
						ticket: {
							select: {
								name: true,
								price: true
							}
						}
					},
					orderBy: { createdAt: 'desc' }
				});

				const timestamp = Date.now();
				const filename = `registrations_${timestamp}.${format === 'excel' ? 'csv' : format}`;
				
				let fileContent;
				if (format === 'csv' || format === 'excel') {
					fileContent = generateCSV(registrations);
				}
				
				// Set headers for file download
				reply.header('Content-Type', 'text/csv; charset=utf-8');
				reply.header('Content-Disposition', `attachment; filename="${filename}"`);
				
				// Add BOM for Excel UTF-8 support
				const BOM = '\uFEFF';
				return reply.send(BOM + fileContent);
			} catch (error) {
				console.error("Export registrations error:", error);
				const { response, statusCode } = serverErrorResponse("匯出失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	function generateCSV(registrations) {
		const headers = [
			'ID',
			'Email',
			'Event',
			'Ticket',
			'Price',
			'Status',
			'Name',
			'Phone',
			'Created At'
		];
		
		const rows = registrations.map(reg => {
			// formData is already parsed as an object by safeJsonParse or could be a string
			const formData = typeof reg.formData === 'string' ? safeJsonParse(reg.formData, {}) : (reg.formData || {});
			// Handle localized fields - get first available locale or empty string
			const eventName = typeof reg.event?.name === 'object' ? Object.values(reg.event.name)[0] : (reg.event?.name || '');
			const ticketName = typeof reg.ticket?.name === 'object' ? Object.values(reg.ticket.name)[0] : (reg.ticket?.name || '');
			
			return [
				reg.id,
				reg.email,
				eventName,
				ticketName,
				reg.ticket?.price || 0,
				reg.status,
				formData.name || '',
				formData.phone || '',
				new Date(reg.createdAt).toISOString()
			];
		});
		
		const csvRows = [headers, ...rows];
		return csvRows.map(row => 
			row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
		).join('\n');
	}
}