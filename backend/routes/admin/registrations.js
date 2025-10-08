/**
 * @fileoverview Admin registrations routes with modular types and schemas
 * @typedef {import('#types/database.js').Registration} Registration
 * @typedef {import('#types/api.js').RegistrationCreateRequest} RegistrationCreateRequest
 * @typedef {import('#types/api.js').RegistrationUpdateRequest} RegistrationUpdateRequest
 * @typedef {import('#types/api.js').PaginationQuery} PaginationQuery
 */

import prisma from "#config/database.js";
import { registrationSchemas } from "#schemas/registration.js";
import { createPagination, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
				const { page = 1, limit = 20, eventId, status, userId } = request.query;

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
					orderBy: { createdAt: "desc" },
					skip: (page - 1) * limit,
					take: limit
				});

				const pagination = createPagination(page, limit, total);

				return reply.send(successResponse(registrations, "取得報名列表成功", pagination));
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
			schema: { ...registrationSchemas.getRegistration, tags: ["admin/registrations"] }
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

				return reply.send(successResponse(registration));
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
			schema: { ...registrationSchemas.updateRegistration, tags: ["admin/registrations"] }
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
					type: "object",
					properties: {
						eventId: {
							type: "string",
							description: "活動 ID"
						},
						status: {
							type: "string",
							enum: ["confirmed", "cancelled", "pending"],
							description: "報名狀態"
						},
						format: {
							type: "string",
							enum: ["csv", "excel"],
							default: "csv",
							description: "匯出格式"
						}
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							message: { type: "string" },
							data: {
								type: "object",
								properties: {
									downloadUrl: { type: "string" },
									filename: { type: "string" },
									count: { type: "integer" }
								}
							}
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
				const { eventId, status, format = "csv" } = request.query;

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
					orderBy: { createdAt: "desc" }
				});

				const timestamp = Date.now();
				const filename = `registrations_${timestamp}.${format}`;

				const downloadsDir = path.join(__dirname, "../../downloads");
				if (!fs.existsSync(downloadsDir)) {
					fs.mkdirSync(downloadsDir, { recursive: true });
				}

				const filePath = path.join(downloadsDir, filename);

				if (format === "csv") {
					const csvContent = generateCSV(registrations);
					fs.writeFileSync(filePath, csvContent, "utf8");
				} else if (format === "excel") {
					const excelContent = generateExcel(registrations);
					fs.writeFileSync(filePath, excelContent);
				}

				const downloadUrl = `/downloads/${filename}`;

				return reply.send(
					successResponse(
						{
							downloadUrl,
							filename,
							count: registrations.length
						},
						"匯出準備完成"
					)
				);
			} catch (error) {
				console.error("Export registrations error:", error);
				const { response, statusCode } = serverErrorResponse("匯出失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	function generateCSV(registrations) {
		const headers = ["ID", "Email", "Event", "Ticket", "Price", "Status", "Name", "Phone", "Created At"];

		const rows = registrations.map(reg => {
			const formData = reg.formData ? JSON.parse(reg.formData) : {};
			return [reg.id, reg.email, reg.event?.name || "", reg.ticket?.name || "", reg.ticket?.price || 0, reg.status, formData.name || "", formData.phone || "", new Date(reg.createdAt).toISOString()];
		});

		const csvRows = [headers, ...rows];
		return csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
	}

	function generateExcel(registrations) {
		const headers = ["ID", "Email", "Event", "Ticket", "Price", "Status", "Name", "Phone", "Created At"];

		const rows = registrations.map(reg => {
			const formData = reg.formData ? JSON.parse(reg.formData) : {};
			return [reg.id, reg.email, reg.event?.name || "", reg.ticket?.name || "", reg.ticket?.price || 0, reg.status, formData.name || "", formData.phone || "", new Date(reg.createdAt).toISOString()];
		});

		const csvContent = [headers, ...rows].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");

		return csvContent;
	}
}
