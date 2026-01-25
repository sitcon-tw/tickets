/**
 * @fileoverview Admin registrations routes with modular types and schemas
 */

import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { requireEventAccess, requireEventAccessViaRegistrationId } from "#middleware/auth";
import { adminRegistrationSchemas, registrationSchemas } from "#schemas";
import { exportToGoogleSheets, extractSpreadsheetId, getServiceAccountEmail } from "#utils/google-sheets";
import { logger } from "#utils/logger";
import { createPagination, notFoundResponse, serverErrorResponse, successPaginatedResponse, successResponse, validationErrorResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";
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

			const span = tracer.startSpan("route.admin.registrations.list", {
				attributes: {
					"registrations.page": page,
					"registrations.limit": limit,
					"registrations.filter.eventId": eventId || "",
					"registrations.filter.status": status || "",
					"registrations.filter.userId": userId || ""
				}
			});

			try {
				const where: any = {};
				if (eventId) where.eventId = eventId;
				if (status) where.status = status;
				if (userId) where.userId = userId;

				span.addEvent("database.query.count");
				const total = await prisma.registration.count({ where });

				span.setAttribute("registrations.total", total);
				span.addEvent("database.query.findMany");

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

				span.setAttribute("registrations.found", registrations.length);

				span.addEvent("registrations.parse");

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

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successPaginatedResponse(parsedRegistrations, "取得報名列表成功", pagination));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to list registrations"
				});
				throw error;
			} finally {
				span.end();
			}
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

			const span = tracer.startSpan("route.admin.registrations.get", {
				attributes: {
					"registration.id": id
				}
			});

			try {
				span.addEvent("database.query.findUnique");

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
					span.addEvent("registration.not_found");
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("user.id", registration.userId);
				if (registration.event?.id) span.setAttribute("event.id", registration.event.id);
				if (registration.ticket?.id) span.setAttribute("ticket.id", registration.ticket.id);
				span.setAttribute("registration.status", registration.status);
				span.addEvent("registration.parse");

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

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(parsedRegistration, "取得報名記錄成功"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get registration"
				});
				throw error;
			} finally {
				span.end();
			}
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

			const span = tracer.startSpan("route.admin.registrations.update", {
				attributes: {
					"registration.id": id
				}
			});

			try {
				span.addEvent("database.query.findUnique");

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
					span.addEvent("registration.not_found");
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("user.id", existingRegistration.userId);
				span.setAttribute("event.id", existingRegistration.eventId);
				span.setAttribute("ticket.id", existingRegistration.ticketId);
				span.setAttribute("registration.status.old", existingRegistration.status);

				if (updateData.status && new Date() > existingRegistration.event.endDate) {
					span.addEvent("registration.update.event_ended");
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = validationErrorResponse("活動已結束，無法修改報名狀態");
					return reply.code(statusCode).send(response);
				}

				// Convert formData object to JSON string if present
				const dataToUpdate: Record<string, any> = { ...updateData };
				if (dataToUpdate.formData && typeof dataToUpdate.formData === "object") {
					dataToUpdate.formData = JSON.stringify(dataToUpdate.formData);
				}

				if (updateData.status) {
					span.setAttribute("registration.status.new", updateData.status);
				}

				span.addEvent("database.query.update");

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

				span.addEvent("registration.updated");

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

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(parsedRegistration, "報名更新成功"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to update registration"
				});
				throw error;
			} finally {
				span.end();
			}
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

			const span = tracer.startSpan("route.admin.registrations.export", {
				attributes: {
					"export.format": format,
					"export.filter.eventId": eventId || "",
					"export.filter.status": status || ""
				}
			});

			try {
				const where: any = {};
				if (eventId) where.eventId = eventId;
				if (status) where.status = status;

				span.addEvent("database.query.findMany");

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

				span.setAttribute("export.count", registrations.length);
				span.addEvent("export.generate_csv");

				const timestamp = Date.now();
				const filename = `registrations_${timestamp}.${format === "excel" ? "csv" : format}`;

				const csvContent = generateCSV(registrations);

				span.setAttribute("export.filename", filename);
				span.setAttribute("export.size", csvContent.length);
				span.setStatus({ code: SpanStatusCode.OK });

				reply.header("Content-Type", "text/csv; charset=utf-8");
				reply.header("Content-Disposition", `attachment; filename="${filename}"`);
				return reply.send("\uFEFF" + csvContent);
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to export registrations"
				});
				throw error;
			} finally {
				span.end();
			}
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

			const span = tracer.startSpan("route.admin.registrations.delete", {
				attributes: {
					"registration.id": id
				}
			});

			try {
				span.addEvent("database.query.findUnique");

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
					span.addEvent("registration.not_found");
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("user.id", registration.userId);
				if (registration.event?.id) span.setAttribute("event.id", registration.event.id);
				if (registration.ticket?.id) span.setAttribute("ticket.id", registration.ticket.id);
				span.setAttribute("registration.ticketId", registration.ticketId);

				span.addEvent("database.query.delete");
				await prisma.registration.delete({
					where: { id }
				});

				span.addEvent("database.query.update_ticket_count");
				await prisma.ticket.update({
					where: { id: registration.ticketId },
					data: {
						soldCount: {
							decrement: 1
						}
					}
				});

				span.addEvent("registration.deleted");
				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(successResponse({ id, email: registration.email }, "已刪除報名資料"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to delete registration"
				});
				throw error;
			} finally {
				span.end();
			}
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

			const span = tracer.startSpan("route.admin.registrations.google_sheets_sync", {
				attributes: {
					"googlesheets.eventId": eventId,
					"googlesheets.url.masked": sheetsUrl ? "https://docs.google.com/spreadsheets/***" : ""
				}
			});

			try {
				const spreadsheetId = extractSpreadsheetId(sheetsUrl);
				if (!spreadsheetId) {
					span.addEvent("googlesheets.invalid_url");
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = validationErrorResponse("無效的 Google Sheets URL");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("googlesheets.spreadsheetId", spreadsheetId);

				span.addEvent("database.query.findUnique");
				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					span.addEvent("event.not_found");
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("event.id", event.id);
				span.addEvent("database.query.findMany");
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

				span.setAttribute("googlesheets.registrations.count", registrations.length);
				span.addEvent("googlesheets.export.start");

				const result = await exportToGoogleSheets(spreadsheetId, registrations);

				if (!result.success) {
					span.addEvent("googlesheets.export.failed", {
						"error.message": result.message
					});
					span.setStatus({ code: SpanStatusCode.OK });
					span.end();

					const { response, statusCode } = serverErrorResponse(result.message);
					return reply.code(statusCode).send(response);
				}

				span.addEvent("googlesheets.export.success");
				span.addEvent("database.query.update");

				await prisma.event.update({
					where: { id: eventId },
					data: { googleSheetsUrl: sheetsUrl }
				});

				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(
					successResponse(
						{
							count: registrations.length,
							sheetsUrl
						},
						result.message
					)
				);
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to sync to Google Sheets"
				});
				throw error;
			} finally {
				span.end();
			}
		}
	);
};

export default adminRegistrationsRoutes;
