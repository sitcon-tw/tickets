/**
 * @fileoverview Admin registrations routes with modular types and schemas
 */

import prisma from "#config/database";
import type { Prisma } from "#prisma/generated/prisma/client";
import { tracer } from "#lib/tracing";
import { requireEventAccess, requireEventAccessViaEventBody, requireEventAccessViaRegistrationId, requirePermission } from "#middleware/auth";
import { adminRegistrationSchemas, registrationSchemas } from "#schemas";
import { extractSpreadsheetId, getServiceAccountEmail, resetSheetsSyncBackoff, spreadsheetUrl, syncRegistrationsToSheet } from "#utils/google-sheets";
import { buildRegistrationExportTable, type ExportTable } from "#utils/registration-export";
import { parseJsonObject } from "#utils/json";
import { createPagination, notFoundResponse, serverErrorResponse, successPaginatedResponse, successResponse, validationErrorResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";
import { LocalizedTextSchema, RegistrationStatusSchema, type AdminRegistration, type GoogleSheetsSettings } from "@sitcontix/types";

import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

/**
 * Admin registrations routes with modular schemas and types
 */
const adminRegistrationsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/registrations",
		{
			preHandler: requireEventAccess("registrations:view"),
			schema: registrationSchemas.listRegistrations
		},
		async (request, reply) => {
			const { page, limit, eventId, status, userId } = request.query;

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
				const where: Prisma.RegistrationWhereInput = {};
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
						},
						referrer: {
							select: { id: true, email: true }
						},
						// Older registrations may only record the referral through its usage row
						referralUsage: {
							select: {
								referral: {
									select: {
										registration: {
											select: { id: true, email: true }
										}
									}
								}
							}
						}
					},
					orderBy: { createdAt: "desc" },
					skip: (page - 1) * limit,
					take: limit
				});

				span.setAttribute("registrations.found", registrations.length);

				span.addEvent("registrations.parse");

				const parsedRegistrations = registrations.map((reg): AdminRegistration => {
					const status = RegistrationStatusSchema.parse(reg.status);
					const referrer = reg.referrer ?? reg.referralUsage[0]?.referral?.registration ?? null;

					return {
						id: reg.id,
						userId: reg.userId,
						eventId: reg.eventId,
						ticketId: reg.ticketId,
						email: reg.email,
						status,
						// Registration id of the referrer, like everywhere else; the email is in `referrer`
						referredBy: reg.referredBy ?? referrer?.id ?? null,
						referrer: referrer ? { id: referrer.id, email: referrer.email } : null,
						checkedIn: reg.checkedIn,
						checkedInAt: reg.checkedInAt,
						formData: parseJsonObject(reg.formData, `admin registration list ${reg.id}`),
						createdAt: reg.createdAt,
						updatedAt: reg.updatedAt,
						event: reg.event
							? {
									id: reg.event.id,
									name: LocalizedTextSchema.parse(reg.event.name),
									startDate: reg.event.startDate,
									endDate: reg.event.endDate
								}
							: undefined,
						ticket: reg.ticket
							? {
									id: reg.ticket.id,
									name: LocalizedTextSchema.parse(reg.ticket.name),
									price: reg.ticket.price
								}
							: undefined
					};
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
			preHandler: requireEventAccessViaRegistrationId("registrations:view"),
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
					formData: parseJsonObject(registration.formData, `admin registration ${registration.id}`)
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
			preHandler: requireEventAccessViaRegistrationId("registrations:update"),
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
				const dataToUpdate: Prisma.RegistrationUpdateInput = {
					...(updateData.status && { status: updateData.status }),
					...(updateData.formData && { formData: JSON.stringify(updateData.formData) })
				};

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
					checkedIn: registration.checkedIn,
					checkedInAt: registration.checkedInAt,
					formData: parseJsonObject(registration.formData, `admin registration ${registration.id}`),
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
								name: LocalizedTextSchema.parse(registration.ticket.name),
								price: registration.ticket.price
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
			preHandler: requireEventAccess("registrations:export"),
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
				const where: Prisma.RegistrationWhereInput = {};
				if (eventId) where.eventId = eventId;
				if (status) where.status = status;

				span.addEvent("database.query.findMany");
				const table = await buildRegistrationExportTable(where);

				span.setAttribute("export.count", table.rows.length);
				span.addEvent("export.generate_csv");

				const timestamp = Date.now();
				const filename = `registrations_${timestamp}.${format === "excel" ? "csv" : format}`;

				const csvContent = generateCSV(table);

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

	// Spreadsheet apps run cells starting with = + - @ (or tab/CR) as formulas, so user-submitted values could execute in the admin's Excel.
	// Plain numbers and phone-number-like values (e.g. +886 912-345-678) are left untouched.
	function neutralizeFormula(value: string) {
		if (!/^[=+\-@\t\r]/.test(value) || /^[+-]?[\d\s().-]+$/.test(value)) return value;
		return `'${value}`;
	}

	function generateCSV({ headers, rows }: ExportTable) {
		return [headers, ...rows].map(row => row.map(field => `"${neutralizeFormula(String(field)).replace(/"/g, '""')}"`).join(",")).join("\n");
	}

	// Delete registration and personal data
	fastify.withTypeProvider<ZodTypeProvider>().delete(
		"/registrations/:id",
		{
			preHandler: requireEventAccessViaRegistrationId("registrations:delete"),
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
			preHandler: requirePermission("registrations:export"),
			schema: adminRegistrationSchemas.getGoogleSheetsServiceAccount
		},
		async (_request, reply) => {
			const email = getServiceAccountEmail();
			return reply.send(successResponse({ email }));
		}
	);

	const sheetsSettingsSelect = { googleSheetsUrl: true, googleSheetsAutoSync: true, googleSheetsSyncedAt: true, googleSheetsSyncError: true } as const;
	type SheetsSettingsRow = { googleSheetsUrl: string | null; googleSheetsAutoSync: boolean; googleSheetsSyncedAt: Date | null; googleSheetsSyncError: string | null };
	const toSheetsSettings = (event: SheetsSettingsRow): GoogleSheetsSettings => ({
		sheetsUrl: event.googleSheetsUrl,
		autoSync: event.googleSheetsAutoSync,
		lastSyncedAt: event.googleSheetsSyncedAt,
		lastSyncError: event.googleSheetsSyncError
	});

	// Get an event's Google Sheets sync settings and last sync status
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/registrations/google-sheets/settings",
		{
			preHandler: requireEventAccess("registrations:export"),
			schema: adminRegistrationSchemas.getGoogleSheetsSettings
		},
		async (request, reply) => {
			const event = await prisma.event.findUnique({ where: { id: request.query.eventId }, select: sheetsSettingsSelect });
			if (!event) {
				const { response, statusCode } = notFoundResponse("活動不存在");
				return reply.code(statusCode).send(response);
			}
			return reply.send(successResponse(toSheetsSettings(event)));
		}
	);

	// Turn Google Sheets auto-sync on or off
	fastify.withTypeProvider<ZodTypeProvider>().put(
		"/registrations/google-sheets/settings",
		{
			preHandler: requireEventAccessViaEventBody("registrations:export"),
			schema: adminRegistrationSchemas.updateGoogleSheetsSettings
		},
		async (request, reply) => {
			const { eventId, autoSync } = request.body;

			const event = await prisma.event.findUnique({ where: { id: eventId }, select: sheetsSettingsSelect });
			if (!event) {
				const { response, statusCode } = notFoundResponse("活動不存在");
				return reply.code(statusCode).send(response);
			}
			if (autoSync && !event.googleSheetsUrl) {
				const { response, statusCode } = validationErrorResponse("請先完成一次匯出以設定 Google Sheets 網址");
				return reply.code(statusCode).send(response);
			}

			const updated = await prisma.event.update({ where: { id: eventId }, data: { googleSheetsAutoSync: autoSync }, select: sheetsSettingsSelect });
			resetSheetsSyncBackoff(eventId);
			return reply.send(successResponse(toSheetsSettings(updated), autoSync ? "已開啟自動同步" : "已關閉自動同步"));
		}
	);

	// Export registrations to Google Sheets now, saving the sheet (and optionally auto-sync) for the event
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/registrations/google-sheets/sync",
		{
			preHandler: requireEventAccessViaEventBody("registrations:export"),
			schema: adminRegistrationSchemas.syncGoogleSheets
		},
		async (request, reply) => {
			const { eventId, sheetsUrl, autoSync } = request.body;

			const span = tracer.startSpan("route.admin.registrations.google_sheets_sync", {
				attributes: { "event.id": eventId }
			});

			try {
				const spreadsheetId = extractSpreadsheetId(sheetsUrl);
				if (!spreadsheetId) {
					span.addEvent("googlesheets.invalid_url");
					const { response, statusCode } = validationErrorResponse("無效的 Google Sheets URL");
					return reply.code(statusCode).send(response);
				}

				const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
				if (!event) {
					span.addEvent("event.not_found");
					const { response, statusCode } = notFoundResponse("活動不存在");
					return reply.code(statusCode).send(response);
				}

				const result = await syncRegistrationsToSheet(eventId, spreadsheetId);
				if (!result.success) {
					span.addEvent("googlesheets.export.failed", { "error.message": result.message });
					const { response, statusCode } = serverErrorResponse(result.message);
					return reply.code(statusCode).send(response);
				}

				// Saved only after a successful export, so auto-sync never targets a sheet we can't write to.
				// The fingerprint is cleared so the next auto-sync sweep re-checks against fresh data.
				const updated = await prisma.event.update({
					where: { id: eventId },
					data: {
						googleSheetsUrl: spreadsheetUrl(spreadsheetId),
						googleSheetsSyncedAt: new Date(),
						googleSheetsSyncError: null,
						googleSheetsSyncFingerprint: null,
						...(autoSync !== undefined && { googleSheetsAutoSync: autoSync })
					},
					select: sheetsSettingsSelect
				});
				resetSheetsSyncBackoff(eventId);

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse({ ...toSheetsSettings(updated), count: result.count ?? 0 }, result.message));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to sync to Google Sheets" });
				throw error;
			} finally {
				span.end();
			}
		}
	);
};

export default adminRegistrationsRoutes;
