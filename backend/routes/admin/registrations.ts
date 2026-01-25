/**
 * @fileoverview Admin registrations routes with modular types and schemas
 */

import prisma from "#config/database";
import { requireEventAccess, requireEventAccessViaRegistrationId } from "#middleware/auth";
import { adminRegistrationSchemas, registrationSchemas } from "#schemas";
import { exportToGoogleSheets, extractSpreadsheetId, getServiceAccountEmail } from "#utils/google-sheets";
import { logger } from "#utils/logger";
import { createPagination, notFoundResponse, serverErrorResponse, successPaginatedResponse, successResponse, validationErrorResponse } from "#utils/response";
import { LocalizedTextSchema, RegistrationStatusSchema } from "@sitcontix/types";

const componentLogger = logger.child({ component: "admin/registrations" });

import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

/**
 * Admin registrations routes with modular schemas and types
 */
const adminRegistrationsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/registrations",
		{
			preHandler: requireEventAccess,
			schema: registrationSchemas.listRegistrations
		},
		async (request, reply) => {
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
					componentLogger.error({ error, registrationId: reg.id }, "Failed to parse formData for registration");
					componentLogger.error({ rawData: reg.formData }, "Raw formData");
				}

				const status = RegistrationStatusSchema.parse(reg.status);

				const plainReg = {
					id: reg.id,
					userId: reg.userId,
					eventId: reg.eventId,
					ticketId: reg.ticketId,
					email: reg.email,
					status,
					referredBy: reg.referredBy ?? null,
					formData: parsedFormData,
					createdAt: reg.createdAt,
					updatedAt: reg.updatedAt,
					event: reg.event
						? {
								id: reg.event.id,
								name: reg.event.name as Record<string, string>,
								startDate: reg.event.startDate,
								endDate: reg.event.endDate
							}
						: undefined,
					ticket: reg.ticket
						? {
								id: reg.ticket.id,
								name: reg.ticket.name as Record<string, string>,
								price: Number(reg.ticket.price)
							}
						: undefined
				};

				return plainReg;
			});

			const pagination = createPagination(page, limit, total);

			return reply.send(successPaginatedResponse(parsedRegistrations, "取得報名列表成功", pagination));
		}
	);

	// Get registration by ID
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/registrations/:id",
		{
			preHandler: requireEventAccessViaRegistrationId,
			schema: { ...registrationSchemas.getRegistration, tags: ["admin/registrations"] }
		},
		async (request, reply) => {
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
							locationText: true,
							mapLink: true
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
				status: RegistrationStatusSchema.parse(registration.status),
				event: {
					...registration.event,
					name: LocalizedTextSchema.parse(registration.event.name),
					locationText: LocalizedTextSchema.nullable().parse(registration.event.locationText)
				},
				ticket: {
					...registration.ticket,
					name: LocalizedTextSchema.parse(registration.ticket.name),
					description: LocalizedTextSchema.nullable().parse(registration.ticket.description)
				},
				formData: registration.formData ? JSON.parse(registration.formData) : {}
			};

			return reply.send(successResponse(parsedRegistration, "取得報名記錄成功"));
		}
	);

	// Update registration
	fastify.withTypeProvider<ZodTypeProvider>().put(
		"/registrations/:id",
		{
			preHandler: requireEventAccessViaRegistrationId,
			schema: { ...registrationSchemas.updateRegistration, tags: ["admin/registrations"] }
		},
		async (request, reply) => {
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
			const dataToUpdate: Record<string, any> = { ...updateData };
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
					}
				}
			});

			const status = RegistrationStatusSchema.parse(registration.status);

			const parsedRegistration = {
				id: registration.id,
				userId: registration.userId,
				eventId: registration.eventId,
				ticketId: registration.ticketId,
				email: registration.email,
				status,
				referredBy: registration.referredBy ?? null,
				formData: registration.formData ? JSON.parse(registration.formData) : {},
				createdAt: registration.createdAt,
				updatedAt: registration.updatedAt,
				event: registration.event
					? {
							id: registration.event.id,
							name: LocalizedTextSchema.parse(registration.event.name),
							startDate: registration.event.startDate,
							endDate: registration.event.endDate
						}
					: undefined,
				ticket: registration.ticket
					? {
							id: registration.ticket.id,
							name: registration.ticket.name as Record<string, string>,
							price: Number(registration.ticket.price)
						}
					: undefined
			};

			return reply.send(successResponse(parsedRegistration, "報名更新成功"));
		}
	);

	// Export registrations (CSV/Excel)
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/registrations/export",
		{
			schema: adminRegistrationSchemas.exportRegistrations
		},
		async (request, reply) => {
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
	fastify.withTypeProvider<ZodTypeProvider>().delete(
		"/registrations/:id",
		{
			preHandler: requireEventAccessViaRegistrationId,
			schema: adminRegistrationSchemas.deleteRegistration
		},
		async (request, reply) => {
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
					},
					ticket: {
						select: {
							id: true
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

			await prisma.ticket.update({
				where: { id: registration.ticketId },
				data: {
					soldCount: {
						decrement: 1
					}
				}
			});

			return reply.send(successResponse({ id, email: registration.email }, "已刪除報名資料"));
		}
	);

	// Get Google Sheets service account email
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/registrations/google-sheets/service-account",
		{
			schema: adminRegistrationSchemas.getGoogleSheetsServiceAccount
		},
		async (_request, reply) => {
			const email = getServiceAccountEmail();
			return reply.send(successResponse({ email }));
		}
	);

	// Sync registrations to Google Sheets
	fastify.withTypeProvider<ZodTypeProvider>().post<{
		Body: { eventId: string; sheetsUrl: string };
	}>(
		"/registrations/google-sheets/sync",
		{
			preHandler: requireEventAccess,
			schema: adminRegistrationSchemas.syncGoogleSheets
		},
		async (request, reply) => {
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
