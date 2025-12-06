/**
 * @fileoverview Admin registrations routes with modular types and schemas
 */

import prisma from "#config/database";
import { requireEventAccess, requireEventAccessViaRegistrationId } from "#middleware/auth";
import { registrationSchemas } from "#schemas/registration";
import { sendDataDeletionNotification } from "#utils/email";
import { exportToGoogleSheets, extractSpreadsheetId, getServiceAccountEmail } from "#utils/google-sheets";
import { createPagination, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";

import type { PaginationQuery, RegistrationUpdateRequest } from "#types/api";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

/**
 * Admin registrations routes with modular schemas and types
 */
const adminRegistrationsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	fastify.get<{
		Querystring: PaginationQuery & { eventId?: string; status?: string; userId?: string };
	}>(
		"/registrations",
		{
			preHandler: requireEventAccess,
			schema: registrationSchemas.listRegistrations
		},
		async (request: FastifyRequest<{ Querystring: PaginationQuery & { eventId?: string; status?: string; userId?: string } }>, reply: FastifyReply) => {
			const { page = 1, limit = 20, eventId, status, userId } = request.query;

			const where: any = {};
			if (eventId) where.eventId = eventId;
			if (status) where.status = status;
			if (userId) where.userId = userId;

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
			const parsedRegistrations = registrations.map(reg => {
				let parsedFormData = {};
				try {
					if (reg.formData) {
						parsedFormData = JSON.parse(reg.formData);
					}
				} catch (error) {
					console.error(`Failed to parse formData for registration ${reg.id}:`, error);
					console.error(`Raw formData was:`, reg.formData);
				}

				const plainReg = {
					id: reg.id,
					eventId: reg.eventId,
					ticketId: reg.ticketId,
					email: reg.email,
					status: reg.status,
					referredBy: reg.referredBy || "",
					formData: parsedFormData,
					createdAt: reg.createdAt,
					updatedAt: reg.updatedAt,
					user: reg.user,
					event: reg.event,
					ticket: reg.ticket,
					referral: reg.referral
				};

				return plainReg;
			});

			const pagination = createPagination(page, limit, total);

			return reply.send(successResponse(parsedRegistrations, "取得報名列表成功", pagination));
		}
	);

	// Get registration by ID
	fastify.get<{
		Params: { id: string };
	}>(
		"/registrations/:id",
		{
			preHandler: requireEventAccessViaRegistrationId,
			schema: { ...registrationSchemas.getRegistration, tags: ["admin/registrations"] }
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
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

			const parsedRegistration = {
				...registration,
				formData: registration.formData ? JSON.parse(registration.formData) : {}
			};

			return reply.send(successResponse(parsedRegistration));
		}
	);

	// Update registration
	fastify.put<{
		Params: { id: string };
		Body: RegistrationUpdateRequest;
	}>(
		"/registrations/:id",
		{
			preHandler: requireEventAccessViaRegistrationId,
			schema: { ...registrationSchemas.updateRegistration, tags: ["admin/registrations"] }
		},
		async (request: FastifyRequest<{ Params: { id: string }; Body: RegistrationUpdateRequest }>, reply: FastifyReply) => {
			const { id } = request.params;
			const updateData = request.body;

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

			if (updateData.status && new Date() > existingRegistration.event.endDate) {
				const { response, statusCode } = validationErrorResponse("活動已結束，無法修改報名狀態");
				return reply.code(statusCode).send(response);
			}

			// Convert formData object to JSON string if present
			const dataToUpdate = { ...updateData };
			if (dataToUpdate.formData && typeof dataToUpdate.formData === "object") {
				dataToUpdate.formData = JSON.stringify(dataToUpdate.formData);
			}

			/** @type {Registration} */
			const registration = await prisma.registration.update({
				where: { id },
				data: {
					...dataToUpdate,
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

			const parsedRegistration = {
				...registration,
				formData: registration.formData ? JSON.parse(registration.formData) : {}
			};

			return reply.send(successResponse(parsedRegistration, "報名更新成功"));
		}
	);

	// Export registrations (CSV/Excel)
	fastify.get<{
		Querystring: { eventId?: string; status?: string; format?: "csv" | "excel" };
	}>(
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
				}
			}
		},
		async (request: FastifyRequest<{ Querystring: { eventId?: string; status?: string; format?: "csv" | "excel" } }>, reply: FastifyReply) => {
			const { eventId, status, format = "csv" } = request.query;

			const where: any = {};
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
			const filename = `registrations_${timestamp}.${format === "excel" ? "csv" : format}`;

			const csvContent = generateCSV(registrations);
			reply.header("Content-Type", "text/csv; charset=utf-8");
			reply.header("Content-Disposition", `attachment; filename="${filename}"`);
			return reply.send("\uFEFF" + csvContent);
		}
	);

	function generateCSV(registrations: any) {
		const parsedRegistrations = registrations.map((reg: any) => ({
			...reg,
			formData: reg.formData ? JSON.parse(reg.formData) : {}
		}));

		const formFieldKeys = new Set<string>();
		parsedRegistrations.forEach((reg: any) => {
			Object.keys(reg.formData).forEach(key => formFieldKeys.add(key));
		});

		const sortedFormFields = Array.from(formFieldKeys).sort();

		const baseHeaders = ["ID", "Email", "Event", "Ticket", "Price", "Status", "Created At"];
		const formDataHeaders = sortedFormFields.map(key => `Form: ${key}`);
		const headers = [...baseHeaders, ...formDataHeaders];

		const getLocalizedName = (nameObj: any) => {
			if (!nameObj || typeof nameObj !== "object") return "";
			return nameObj["zh-Hant"] || nameObj["zh-Hans"] || nameObj["en"] || Object.values(nameObj)[0] || "";
		};

		const formatFormValue = (value: any) => {
			if (value === null || value === undefined) return "";
			if (typeof value === "object") return JSON.stringify(value);
			return String(value);
		};

		const rows = parsedRegistrations.map((reg: any) => {
			const baseValues = [reg.id, reg.email, getLocalizedName(reg.event?.name), getLocalizedName(reg.ticket?.name), reg.ticket?.price || 0, reg.status, new Date(reg.createdAt).toISOString()];

			const formDataValues = sortedFormFields.map((key: string) => formatFormValue(reg.formData[key]));

			return [...baseValues, ...formDataValues];
		});

		const csvRows = [headers, ...rows];
		return csvRows.map((row: any) => row.map((field: any) => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
	}

	// Delete registration and personal data
	fastify.delete<{
		Params: { id: string };
	}>(
		"/registrations/:id",
		{
			preHandler: requireEventAccessViaRegistrationId,
			schema: {
				description: "刪除報名記錄與個人資料 (符合個人資料保護法)",
				tags: ["admin/registrations"],
				params: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "報名記錄 ID"
						}
					},
					required: ["id"]
				},
				response: {
					200: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							message: { type: "string" },
							data: { type: "object" }
						}
					}
				}
			}
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			const { id } = request.params;

			const registration = await prisma.registration.findUnique({
				where: { id },
				include: {
					event: {
						select: {
							id: true,
							name: true,
							startDate: true,
							endDate: true
						}
					}
				}
			});

			if (!registration) {
				const { response, statusCode } = notFoundResponse("報名記錄不存在");
				return reply.code(statusCode).send(response);
			}

			await prisma.registration.delete({
				where: { id }
			});

			try {
				await sendDataDeletionNotification({ id: registration.id, email: registration.email }, { name: String(registration.event.name) });
			} catch (emailError) {
				console.error("Failed to send deletion notification email:", emailError);
			}

			return reply.send(successResponse({ id, email: registration.email }, "個人資料已成功刪除，通知信已發送給活動主辦方"));
		}
	);

	// Get Google Sheets service account email
	fastify.get(
		"/registrations/google-sheets/service-account",
		{
			schema: {
				description: "取得 Google Sheets 服務帳號 Email",
				tags: ["admin/registrations"],
				response: {
					200: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							data: {
								type: "object",
								properties: {
									email: { type: "string" }
								}
							}
						}
					}
				}
			}
		},
		async (_request: FastifyRequest, reply: FastifyReply) => {
			const email = getServiceAccountEmail();
			return reply.send(successResponse({ email }));
		}
	);

	// Sync registrations to Google Sheets
	fastify.post<{
		Body: { eventId: string; sheetsUrl: string };
	}>(
		"/registrations/google-sheets/sync",
		{
			preHandler: requireEventAccess,
			schema: {
				description: "同步報名資料到 Google Sheets",
				tags: ["admin/registrations"],
				body: {
					type: "object",
					properties: {
						eventId: {
							type: "string",
							description: "活動 ID"
						},
						sheetsUrl: {
							type: "string",
							description: "Google Sheets URL"
						}
					},
					required: ["eventId", "sheetsUrl"]
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
									count: { type: "number" },
									sheetsUrl: { type: "string" }
								}
							}
						}
					}
				}
			}
		},
		async (request: FastifyRequest<{ Body: { eventId: string; sheetsUrl: string } }>, reply: FastifyReply) => {
			const { eventId, sheetsUrl } = request.body;

			const spreadsheetId = extractSpreadsheetId(sheetsUrl);
			if (!spreadsheetId) {
				const { response, statusCode } = validationErrorResponse("無效的 Google Sheets URL");
				return reply.code(statusCode).send(response);
			}

			const event = await prisma.event.findUnique({
				where: { id: eventId }
			});

			if (!event) {
				const { response, statusCode } = notFoundResponse("活動不存在");
				return reply.code(statusCode).send(response);
			}

			const registrations = await prisma.registration.findMany({
				where: { eventId },
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
			const result = await exportToGoogleSheets(spreadsheetId, registrations);

			if (!result.success) {
				const { response, statusCode } = serverErrorResponse(result.message);
				return reply.code(statusCode).send(response);
			}

			await prisma.event.update({
				where: { id: eventId },
				data: { googleSheetsUrl: sheetsUrl }
			});

			return reply.send(
				successResponse(
					{
						count: registrations.length,
						sheetsUrl
					},
					result.message
				)
			);
		}
	);
};

export default adminRegistrationsRoutes;
