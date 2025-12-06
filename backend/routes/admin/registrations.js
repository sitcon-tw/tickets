/**
 * @fileoverview Admin registrations routes with modular types and schemas
 * @typedef {import('#types/database.js').Registration} Registration
 * @typedef {import('#types/api.js').RegistrationCreateRequest} RegistrationCreateRequest
 * @typedef {import('#types/api.js').RegistrationUpdateRequest} RegistrationUpdateRequest
 * @typedef {import('#types/api.js').PaginationQuery} PaginationQuery
 */

import prisma from "#config/database.js";
import { requireEventAccess, requireEventAccessViaRegistrationId } from "#middleware/auth.js";
import { registrationSchemas } from "#schemas/registration.js";







import { sendDataDeletionNotification, sendRegistrationCancellationEmail } from "#utils/email.js";
import { createPagination, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response.js";
import { traceEmailOperation, traceSMSOperation } from "#utils/trace-db.js";
import { sendSMS } from "../../lib/sms.js";

const getLocalizedName = nameObj => {
	if (!nameObj) return "";
	if (typeof nameObj === "string") return nameObj;
	if (typeof nameObj === "object") {
		return nameObj["zh-Hant"] || nameObj["zh-Hans"] || nameObj["en"] || Object.values(nameObj)[0] || "";
	}
	return String(nameObj);
};

/**
 * Admin registrations routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
export default async function adminRegistrationsRoutes(fastify, options) {
	fastify.get(
		"/registrations",
		{
			preHandler: requireEventAccess,
			schema: registrationSchemas.listRegistrations
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Querystring: PaginationQuery & {eventId?: string, status?: string, userId?: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { page = 1, limit = 20, eventId, status, userId } = request.query;

				const where = {};
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
			preHandler: requireEventAccessViaRegistrationId,
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

				const parsedRegistration = {
					...registration,
					formData: registration.formData ? JSON.parse(registration.formData) : {}
				};

				return reply.send(successResponse(parsedRegistration));
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
			preHandler: requireEventAccessViaRegistrationId,
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

	// Cancel and delete registration (admin)
	fastify.put(
		"/registrations/:id/cancel",
		{
			preHandler: requireEventAccessViaRegistrationId,
			schema: {
				description: "管理者取消並刪除報名，並通知使用者",
				tags: ["admin/registrations"],
				params: {
					type: "object",
					properties: {
						id: { type: "string", description: "報名記錄 ID" }
					},
					required: ["id"]
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				const registration = await prisma.registration.findUnique({
					where: { id },
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								phoneNumber: true
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
								soldCount: true
							}
						}
					}
				});

				if (!registration) {
					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				if (new Date() >= registration.event.startDate) {
					const { response, statusCode } = validationErrorResponse("活動已開始或已結束，無法取消報名");
					return reply.code(statusCode).send(response);
				}

				// Delete registration and update ticket count inside transaction
				await prisma.$transaction(async tx => {
					await tx.registration.delete({
						where: { id }
					});

					// Adjust sold count but avoid negative numbers
					if ((registration.ticket?.soldCount ?? 0) > 0) {
						await tx.ticket.update({
							where: { id: registration.ticketId },
							data: { soldCount: { decrement: 1 } }
						});
					}
				});

				const eventName = getLocalizedName(registration.event?.name) || "活動";

				// Fire-and-forget notifications; do not block cancellation if they fail
				try {
					await traceEmailOperation(registration.email, `報名取消通知 - ${eventName}`, () =>
						sendRegistrationCancellationEmail(registration, registration.event)
					);
				} catch (emailError) {
					request.log.error("Send cancellation email failed:", emailError);
				}

				if (registration.user?.phoneNumber) {
					const smsContent = `[SITCON] 您的「${eventName}」報名已由管理者取消並刪除，如有疑問請聯絡主辦單位。`;
					try {
						await traceSMSOperation(registration.user.phoneNumber, () => sendSMS(registration.user.phoneNumber, smsContent));
					} catch (smsError) {
						request.log.error("Send cancellation SMS failed:", smsError);
					}
				}

				return reply.send(successResponse({ id, email: registration.email }, "報名已取消並刪除，已嘗試寄送通知"));
			} catch (error) {
				console.error("Admin cancel registration error:", error);
				const { response, statusCode } = serverErrorResponse("取消報名失敗");
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
				const filename = `registrations_${timestamp}.${format === "excel" ? "csv" : format}`;

				const csvContent = generateCSV(registrations);
				reply.header("Content-Type", "text/csv; charset=utf-8");
				reply.header("Content-Disposition", `attachment; filename="${filename}"`);
				return reply.send("\uFEFF" + csvContent);
			} catch (error) {
				console.error("Export registrations error:", error);
				const { response, statusCode } = serverErrorResponse("匯出失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	function generateCSV(registrations) {
		const parsedRegistrations = registrations.map(reg => ({
			...reg,
			formData: reg.formData ? JSON.parse(reg.formData) : {}
		}));

		const formFieldKeys = new Set();
		parsedRegistrations.forEach(reg => {
			Object.keys(reg.formData).forEach(key => formFieldKeys.add(key));
		});

		const sortedFormFields = Array.from(formFieldKeys).sort();

		const baseHeaders = ["ID", "Email", "Event", "Ticket", "Price", "Status", "Created At"];
		const formDataHeaders = sortedFormFields.map(key => `Form: ${key}`);
		const headers = [...baseHeaders, ...formDataHeaders];

		const getLocalizedName = nameObj => {
			if (!nameObj || typeof nameObj !== "object") return "";
			return nameObj["zh-Hant"] || nameObj["zh-Hans"] || nameObj["en"] || Object.values(nameObj)[0] || "";
		};

		const formatFormValue = value => {
			if (value === null || value === undefined) return "";
			if (typeof value === "object") return JSON.stringify(value);
			return String(value);
		};

		const rows = parsedRegistrations.map(reg => {
			const baseValues = [reg.id, reg.email, getLocalizedName(reg.event?.name), getLocalizedName(reg.ticket?.name), reg.ticket?.price || 0, reg.status, new Date(reg.createdAt).toISOString()];

			const formDataValues = sortedFormFields.map(key => formatFormValue(reg.formData[key]));

			return [...baseValues, ...formDataValues];
		});

		const csvRows = [headers, ...rows];
		return csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
	}

	// Delete registration and personal data
	fastify.delete(
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
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
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
					await sendDataDeletionNotification(registration, registration.event);
				} catch (emailError) {
					console.error("Failed to send deletion notification email:", emailError);
				}

				return reply.send(successResponse({ id, email: registration.email }, "個人資料已成功刪除，通知信已發送給活動主辦方"));
			} catch (error) {
				console.error("Delete registration error:", error);
				const { response, statusCode } = serverErrorResponse("刪除報名記錄失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}
