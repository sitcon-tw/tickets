import prisma from "#config/database";
import { auth } from "#lib/auth";
import { addSpanEvent } from "#lib/tracing";
import { requireAuth } from "#middleware/auth.ts";
import { registrationSchemas, userRegistrationsResponse } from "#schemas";
import { sendCancellationEmail, sendRegistrationConfirmation } from "#utils/email.js";
import { safeJsonParse, safeJsonStringify } from "#utils/json";
import { conflictResponse, notFoundResponse, serializeDates, serverErrorResponse, successResponse, unauthorizedResponse, validationErrorResponse } from "#utils/response";
import { sanitizeObject } from "#utils/sanitize";
import { tracePrismaOperation } from "#utils/trace-db";
import { validateRegistrationFormData, type FormField } from "#utils/validation";
import { buildRegistrationCancelledNotification, buildRegistrationConfirmedNotification, dispatchWebhook } from "#utils/webhook";
import type { Event, Registration, Ticket } from "@sitcontix/types";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

interface RegistrationCreateRequest {
	eventId: string;
	ticketId: string;
	invitationCode?: string;
	referralCode?: string;
	formData: Record<string, any>;
}

interface RegistrationUpdateRequest {
	formData: Record<string, any>;
}

interface PrismaError extends Error {
	code?: string;
	meta?: {
		target?: string[];
	};
}

const publicRegistrationsRoutes: FastifyPluginAsync = async fastify => {
	fastify.addHook("preHandler", requireAuth);

	fastify.post(
		"/registrations",
		{
			schema: registrationSchemas.createRegistration
		},
		async (request: FastifyRequest<{ Body: RegistrationCreateRequest }>, reply: FastifyReply) => {
			try {
				const { eventId, ticketId, invitationCode, referralCode, formData } = request.body;

				const sanitizedFormData = sanitizeObject(formData, false);

				const session = await auth.api.getSession({
					headers: request.headers as unknown as Headers
				});

				const user = session!.user;
				addSpanEvent("checking_existing_registration");
				const existingRegistration = await tracePrismaOperation(
					"Registration",
					"findFirst",
					async () => {
						return prisma.registration.findFirst({
							where: {
								email: user.email,
								eventId,
								status: { not: "cancelled" }
							}
						});
					},
					{ where: { email: user.email, eventId, status: { not: "cancelled" } } }
				);

				if (existingRegistration) {
					addSpanEvent("user_already_registered");
					const { response, statusCode } = conflictResponse("您已經報名此活動");
					return reply.code(statusCode).send(response);
				}

				addSpanEvent("fetching_event_and_ticket");
				const [event, ticket, formFields] = await Promise.all([
					tracePrismaOperation(
						"Event",
						"findUnique",
						async () => {
							return prisma.event.findUnique({
								where: {
									id: eventId,
									isActive: true
								}
							});
						},
						{ where: { id: eventId, isActive: true } }
					),
					tracePrismaOperation(
						"Ticket",
						"findUnique",
						async () => {
							return prisma.ticket.findUnique({
								where: {
									id: ticketId,
									eventId,
									isActive: true,
									hidden: false
								}
							});
						},
						{
							where: { id: ticketId, eventId, isActive: true, hidden: false }
						}
					),
					tracePrismaOperation(
						"EventFormFields",
						"findMany",
						async () => {
							return prisma.eventFormFields.findMany({
								where: { eventId },
								orderBy: { order: "asc" }
							});
						},
						{ where: { eventId }, orderBy: { order: "asc" } }
					)
				]);

				if (!event) {
					const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				if (!ticket) {
					const { response, statusCode } = notFoundResponse("票券不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				if (ticket.soldCount >= ticket.quantity) {
					const { response, statusCode } = conflictResponse("票券已售完");
					return reply.code(statusCode).send(response);
				}

				const now = new Date();
				if (ticket.saleStart && now < ticket.saleStart) {
					const { response, statusCode } = validationErrorResponse("票券尚未開始販售");
					return reply.code(statusCode).send(response);
				}

				if (ticket.saleEnd && now > ticket.saleEnd) {
					const { response, statusCode } = validationErrorResponse("票券販售已結束");
					return reply.code(statusCode).send(response);
				}

				let invitationCodeId: string | null = null;
				if (ticket.requireInviteCode) {
					addSpanEvent("validating_required_invitation_code");
					if (!invitationCode) {
						const { response, statusCode } = unauthorizedResponse("此票券需要邀請碼");
						return reply.code(statusCode).send(response);
					}

					const code = await tracePrismaOperation(
						"InvitationCode",
						"findFirst",
						async () => {
							return prisma.invitationCode.findFirst({
								where: {
									code: invitationCode,
									ticketId,
									isActive: true
								}
							});
						},
						{ where: { code: invitationCode, ticketId, isActive: true } }
					);

					if (!code) {
						const { response, statusCode } = validationErrorResponse("無效的邀請碼");
						return reply.code(statusCode).send(response);
					}

					// Check if code is expired (based on validFrom/validUntil)
					if (code.validUntil && now > code.validUntil) {
						const { response, statusCode } = validationErrorResponse("邀請碼已過期");
						return reply.code(statusCode).send(response);
					}

					// Check if code is not yet valid
					if (code.validFrom && now < code.validFrom) {
						const { response, statusCode } = validationErrorResponse("邀請碼尚未生效");
						return reply.code(statusCode).send(response);
					}

					// Check if code has remaining uses
					if (code.usageLimit && code.usedCount >= code.usageLimit) {
						const { response, statusCode } = validationErrorResponse("邀請碼已達使用上限");
						return reply.code(statusCode).send(response);
					}

					if (ticket.id != code.ticketId) {
						const { response, statusCode } = validationErrorResponse("邀請碼不適用於此票券");
						return reply.code(statusCode).send(response);
					}

					invitationCodeId = code.id;
				} else if (invitationCode) {
					// Ticket doesn't require invitation code but one was provided - validate it anyway for consistency
					const code = await prisma.invitationCode.findFirst({
						where: {
							code: invitationCode,
							ticketId,
							isActive: true
						}
					});

					if (code && (!code.validUntil || now <= code.validUntil) && (!code.validFrom || now >= code.validFrom) && (!code.usageLimit || code.usedCount < code.usageLimit)) {
						invitationCodeId = code.id;
					}
				}

				if (ticket.requireSmsVerification) {
					// Ticket requires SMS verification - check if user has verified phone
					const verifiedUser = await prisma.user.findUnique({
						where: { id: user.id },
						select: { phoneVerified: true }
					});

					if (!verifiedUser?.phoneVerified) {
						const { response, statusCode } = validationErrorResponse("此票券需要驗證手機號碼");
						return reply.code(statusCode).send(response);
					}
				}

				// Validate referral code if provided
				let referralCodeId: string | null = null;
				if (referralCode) {
					const referral = await prisma.referral.findFirst({
						where: {
							code: referralCode,
							eventId,
							isActive: true
						}
					});

					if (!referral) {
						const { response, statusCode } = validationErrorResponse("無效的推薦碼");
						return reply.code(statusCode).send(response);
					}

					referralCodeId = referral.id;
				}

				// Validate form data with dynamic fields from database
				// Pass ticketId to enable filter-aware validation (skip hidden fields)
				const formErrors = validateRegistrationFormData(sanitizedFormData, formFields as unknown as FormField[], ticketId);
				if (formErrors) {
					const { response, statusCode } = validationErrorResponse("表單驗證失敗", formErrors);
					return reply.code(statusCode).send(response);
				}

				// Create registration in transaction
				// Use Serializable isolation level to prevent race conditions
				// This ensures reads are consistent within the transaction and conflicts cause retries
				const result = await prisma.$transaction(
					async tx => {
						// Re-check for existing registration within transaction to prevent race conditions
						const existingInTx = await tx.registration.findFirst({
							where: {
								email: user.email,
								eventId,
								status: { not: "cancelled" }
							}
						});

						if (existingInTx) {
							throw new Error("ALREADY_REGISTERED");
						}

						// Re-check ticket availability within transaction
						const currentTicket = await tx.ticket.findUnique({
							where: { id: ticketId },
							select: { soldCount: true, quantity: true }
						});

						if (!currentTicket || currentTicket.soldCount >= currentTicket.quantity) {
							throw new Error("TICKET_SOLD_OUT");
						}

						// Re-check invitation code usage limit within transaction
						if (invitationCodeId) {
							const currentCode = await tx.invitationCode.findUnique({
								where: { id: invitationCodeId },
								select: { usedCount: true, usageLimit: true, isActive: true }
							});

							if (!currentCode || !currentCode.isActive) {
								throw new Error("INVITATION_CODE_INVALID");
							}

							if (currentCode.usageLimit && currentCode.usedCount >= currentCode.usageLimit) {
								throw new Error("INVITATION_CODE_LIMIT_REACHED");
							}
						}

						// Create registration with sanitized form data as JSON
						const registration = await tx.registration.create({
							data: {
								userId: user.id,
								eventId,
								ticketId,
								email: user.email,
								formData: safeJsonStringify(sanitizedFormData, "{}", "registration creation"),
								status: "confirmed"
							},
							include: {
								event: {
									select: {
										id: true,
										name: true,
										startDate: true,
										endDate: true,
										locationText: true,
										mapLink: true,
										slug: true
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

						// Update ticket sold count
						await tx.ticket.update({
							where: { id: ticketId },
							data: { soldCount: { increment: 1 } }
						});

						// Update invitation code usage if used
						if (invitationCodeId) {
							await tx.invitationCode.update({
								where: { id: invitationCodeId },
								data: { usedCount: { increment: 1 } }
							});
						}

						// Create referral usage record if used
						if (referralCodeId) {
							await tx.referralUsage.create({
								data: {
									referralId: referralCodeId,
									registrationId: registration.id,
									eventId
								}
							});
						}

						// Add parsed form data to response with error handling
						const parsedFormData = safeJsonParse(registration.formData, {}, "registration response");

						return {
							...registration,
							formData: parsedFormData
						};
					},
					{
						isolationLevel: "Serializable"
					}
				);

				const frontendUrl = process.env.FRONTEND_URI || "http://localhost:3000";
				const ticketUrl = `${frontendUrl}/${event.slug}/success`;

				await sendRegistrationConfirmation(result as unknown as Registration, event as unknown as Event, ticket as unknown as Ticket, ticketUrl).catch(error => {
					request.log.error({ err: error }, "Failed to send registration confirmation email");
				});

				// Dispatch webhook for registration confirmed (fire-and-forget)
				const webhookNotification = buildRegistrationConfirmedNotification(
					{ name: event.name, slug: event.slug },
					{ id: result.id, status: result.status, createdAt: result.createdAt, email: result.email, formData: result.formData ? safeJsonStringify(result.formData, "{}", "webhook formData") : null },
					{ id: ticket.id, name: ticket.name, price: ticket.price }
				);
				dispatchWebhook(eventId, "registration_confirmed", webhookNotification).catch(error => {
					request.log.error({ err: error }, "Failed to dispatch registration webhook");
				});

				// Convert Date objects to ISO strings for schema compliance
				const responseData = {
					...result,
					createdAt: result.createdAt.toISOString(),
					updatedAt: result.updatedAt.toISOString(),
					event: {
						...result.event,
						startDate: result.event.startDate.toISOString(),
						endDate: result.event.endDate.toISOString()
					}
				};

				return reply.code(201).send(successResponse(responseData, "報名成功"));
			} catch (error) {
				request.log.error({ err: error }, "Create registration error");

				const errorMessage = (error as Error).message;

				if (errorMessage === "TICKET_SOLD_OUT") {
					const { response, statusCode } = conflictResponse("票券已售完");
					return reply.code(statusCode).send(response);
				}

				if (errorMessage === "ALREADY_REGISTERED") {
					const { response, statusCode } = conflictResponse("您已經報名此活動");
					return reply.code(statusCode).send(response);
				}

				if (errorMessage === "INVITATION_CODE_INVALID") {
					const { response, statusCode } = validationErrorResponse("邀請碼已失效");
					return reply.code(statusCode).send(response);
				}

				if (errorMessage === "INVITATION_CODE_LIMIT_REACHED") {
					const { response, statusCode } = validationErrorResponse("邀請碼已達使用上限");
					return reply.code(statusCode).send(response);
				}

				const prismaError = error as PrismaError;
				if (prismaError.code === "P2002" && prismaError.meta?.target?.includes("email")) {
					const { response, statusCode } = conflictResponse("此信箱已經報名過此活動");
					return reply.code(statusCode).send(response);
				}
				const standardError = error as Error;
				if (standardError.name === "ValidationError" || standardError.message?.includes("必填") || standardError.message?.includes("驗證失敗") || standardError.message?.includes("required")) {
					const { response, statusCode } = validationErrorResponse((error as Error).message || "表單驗證失敗");
					return reply.code(statusCode).send(response);
				}

				const { response, statusCode } = serverErrorResponse("報名失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	fastify.get(
		"/registrations",
		{
			schema: {
				description: "取得用戶的報名記錄",
				tags: ["registrations"],
				response: userRegistrationsResponse
			}
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				const session = await auth.api.getSession({
					headers: request.headers as unknown as Headers
				});
				const userId = session?.user?.id;

				const registrations = await prisma.registration.findMany({
					where: { userId },
					include: {
						event: {
							select: {
								id: true,
								name: true,
								description: true,
								locationText: true,
								mapLink: true,
								startDate: true,
								endDate: true,
								editDeadline: true,
								ogImage: true
							}
						},
						ticket: {
							select: {
								id: true,
								name: true,
								description: true,
								price: true,
								saleEnd: true
							}
						}
					},
					orderBy: { createdAt: "desc" }
				});

				// Parse form data and add status indicators
				const registrationsWithStatus = registrations.map(reg => {
					const now = new Date();
					const parsedFormData = safeJsonParse(reg.formData, {}, `user registrations for ${reg.id}`);

					return {
						id: reg.id,
						userId: reg.userId,
						eventId: reg.eventId,
						ticketId: reg.ticketId,
						email: reg.email,
						status: reg.status,
						referredBy: reg.referredBy ?? null,
						formData: parsedFormData,
						createdAt: reg.createdAt.toISOString(),
						updatedAt: reg.updatedAt.toISOString(),
						event: {
							id: reg.event.id,
							name: reg.event.name,
							description: reg.event.description ?? null,
							locationText: reg.event.locationText ?? null,
							mapLink: reg.event.mapLink ?? null,
							startDate: reg.event.startDate.toISOString(),
							endDate: reg.event.endDate.toISOString(),
							ogImage: reg.event.ogImage ?? null
						},
						ticket: {
							id: reg.ticket.id,
							name: reg.ticket.name,
							description: reg.ticket.description ?? null,
							price: Number(reg.ticket.price),
							saleEnd: reg.ticket.saleEnd?.toISOString() ?? null
						},
						isUpcoming: reg.event.startDate > now,
						isPast: reg.event.endDate < now,
						canEdit: reg.status === "confirmed" && reg.event.startDate > now && (reg.event.editDeadline ? reg.event.editDeadline > now : !reg.ticket.saleEnd || reg.ticket.saleEnd > now),
						canCancel: reg.status === "confirmed" && reg.event.startDate > now
					};
				});

				return reply.send(successResponse(registrationsWithStatus));
			} catch (error) {
				request.log.error({ err: error }, "Get user registrations error");
				const { response, statusCode } = serverErrorResponse("取得報名記錄失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	fastify.get(
		"/registrations/:id",
		{
			schema: {
				description: "取得特定報名記錄",
				tags: ["registrations"]
			}
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			try {
				const session = await auth.api.getSession({
					headers: request.headers as unknown as Headers
				});
				const userId = session?.user?.id;
				const { id } = request.params;

				const registration = await prisma.registration.findFirst({
					where: {
						id,
						userId // Ensure user can only access their own registrations
					},
					include: {
						event: {
							select: {
								id: true,
								name: true,
								description: true,
								locationText: true,
								mapLink: true,
								startDate: true,
								endDate: true,
								editDeadline: true,
								slug: true
							}
						},
						ticket: {
							select: {
								id: true,
								name: true,
								description: true,
								price: true,
								saleEnd: true
							}
						}
					}
				});

				if (!registration) {
					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				// Parse form data and add status indicators
				const now = new Date();
				const parsedFormData = safeJsonParse(registration.formData, {}, `single registration ${registration.id}`);

				const registrationWithStatus = {
					...registration,
					formData: parsedFormData,
					isUpcoming: registration.event.startDate > now,
					isPast: registration.event.endDate < now,
					canEdit:
						registration.status === "confirmed" &&
						registration.event.startDate > now &&
						(registration.event.editDeadline ? registration.event.editDeadline > now : !registration.ticket.saleEnd || registration.ticket.saleEnd > now),
					canCancel: registration.status === "confirmed" && registration.event.startDate > now
				};

				return reply.send(successResponse(registrationWithStatus));
			} catch (error) {
				request.log.error({ err: error }, "Get registration error");
				const { response, statusCode } = serverErrorResponse("取得報名記錄失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	fastify.put(
		"/registrations/:id",
		{
			schema: {
				description: "編輯報名記錄（僅限表單資料）",
				tags: ["registrations"],
				body: registrationSchemas.updateRegistration.body,
				response: registrationSchemas.updateRegistration.response
			}
		},
		async (request: FastifyRequest<{ Params: { id: string }; Body: RegistrationUpdateRequest }>, reply: FastifyReply) => {
			try {
				const session = await auth.api.getSession({
					headers: request.headers as unknown as Headers
				});
				const userId = session?.user?.id;
				const id = request.params.id;
				const { formData } = request.body;

				const sanitizedFormData = sanitizeObject(formData, false);

				// Check if registration exists and belongs to user
				const [registration, formFields] = await Promise.all([
					prisma.registration.findFirst({
						where: {
							id,
							userId
						},
						include: {
							ticket: true,
							event: {
								select: {
									id: true,
									startDate: true,
									editDeadline: true
								}
							}
						}
					}),
					// Fetch form fields separately based on the registration's eventId
					prisma.registration
						.findFirst({
							where: { id, userId },
							select: { eventId: true }
						})
						.then(reg => {
							if (!reg) return [];
							return prisma.eventFormFields.findMany({
								where: { eventId: reg.eventId },
								orderBy: { order: "asc" }
							});
						})
				]);

				if (!registration) {
					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				// Check if registration can be edited
				if (registration.status !== "confirmed") {
					const { response, statusCode } = validationErrorResponse("只能編輯已確認的報名");
					return reply.code(statusCode).send(response);
				}

				if (new Date() >= registration.event.startDate) {
					const { response, statusCode } = validationErrorResponse("活動已開始，無法編輯報名");
					return reply.code(statusCode).send(response);
				}

				// Check edit deadline: if editDeadline is set, use it; otherwise fall back to ticket saleEnd
				const now = new Date();
				if (registration.event.editDeadline) {
					if (now >= registration.event.editDeadline) {
						const { response, statusCode } = validationErrorResponse("編輯截止時間已過，無法編輯報名");
						return reply.code(statusCode).send(response);
					}
				} else if (registration.ticket.saleEnd && now >= registration.ticket.saleEnd) {
					const { response, statusCode } = validationErrorResponse("票券已截止，無法編輯報名");
					return reply.code(statusCode).send(response);
				}

				// Validate form data with dynamic fields from database
				// Pass ticketId to enable filter-aware validation (skip hidden fields)
				const formErrors = validateRegistrationFormData(sanitizedFormData, formFields as unknown as FormField[], registration.ticketId);
				if (formErrors) {
					const { response, statusCode } = validationErrorResponse("表單驗證失敗", formErrors);
					return reply.code(statusCode).send(response);
				}

				// Update registration form data with sanitized data
				const updatedRegistration = await prisma.registration.update({
					where: { id },
					data: {
						formData: safeJsonStringify(sanitizedFormData, "{}", "registration update"),
						updatedAt: new Date()
					},
					include: {
						event: {
							select: {
								id: true,
								name: true,
								description: true,
								locationText: true,
								mapLink: true,
								startDate: true,
								endDate: true,
								ogImage: true
							}
						},
						ticket: {
							select: {
								id: true,
								name: true,
								description: true,
								price: true
							}
						}
					}
				});

				// Parse form data for response
				const parsedFormData = safeJsonParse(updatedRegistration.formData, {}, "updated registration response");

				return reply.send(
					successResponse(
						serializeDates({
							...updatedRegistration,
							formData: parsedFormData
						}),
						"報名資料已更新"
					)
				);
			} catch (error) {
				request.log.error({ err: error }, "Edit registration error");
				const { response, statusCode } = serverErrorResponse("更新報名資料失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	fastify.put(
		"/registrations/:id/cancel",
		{
			schema: {
				description: "取消報名",
				tags: ["registrations"]
			}
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			try {
				const session = await auth.api.getSession({
					headers: request.headers as unknown as Headers
				});
				const userId = session?.user?.id;
				const id = request.params.id;

				const registration = await prisma.registration.findFirst({
					where: {
						id,
						userId
					},
					include: {
						event: {
							select: {
								name: true,
								slug: true,
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

				if (registration.status !== "confirmed") {
					const { response, statusCode } = validationErrorResponse("只能取消已確認的報名");
					return reply.code(statusCode).send(response);
				}

				if (new Date() >= registration.event.startDate) {
					const { response, statusCode } = validationErrorResponse("活動已開始，無法取消報名");
					return reply.code(statusCode).send(response);
				}

				await prisma.$transaction(
					async tx => {
						// Re-check registration status within transaction to prevent double-cancellation
						const currentReg = await tx.registration.findUnique({
							where: { id },
							select: { status: true }
						});

						if (!currentReg || currentReg.status !== "confirmed") {
							throw new Error("ALREADY_CANCELLED");
						}

						await tx.registration.update({
							where: { id },
							data: {
								status: "cancelled",
								updatedAt: new Date()
							}
						});

						await tx.ticket.update({
							where: { id: registration.ticketId },
							data: { soldCount: { decrement: 1 } }
						});
					},
					{
						isolationLevel: "Serializable"
					}
				);

				const frontendUrl = process.env.FRONTEND_URI || "http://localhost:3000";
				const buttonUrl = `${frontendUrl}/zh-Hant/my-registration/${registration.id}`;

				await sendCancellationEmail(registration.email, registration.event.name, buttonUrl).catch(error => {
					request.log.error({ err: error }, "Failed to send cancellation email");
				});

				// Dispatch webhook for registration cancelled (fire-and-forget)
				const cancelledNotification = buildRegistrationCancelledNotification(
					{ name: registration.event.name, slug: registration.event.slug },
					{ id: registration.id, createdAt: registration.createdAt, updatedAt: new Date() }
				);
				dispatchWebhook(registration.eventId, "registration_cancelled", cancelledNotification).catch(error => {
					request.log.error({ err: error }, "Failed to dispatch cancellation webhook");
				});

				return reply.send(successResponse(null, "報名已取消"));
			} catch (error) {
				request.log.error({ err: error }, "Cancel registration error");

				if ((error as Error).message === "ALREADY_CANCELLED") {
					const { response, statusCode } = conflictResponse("報名已被取消");
					return reply.code(statusCode).send(response);
				}

				const { response, statusCode } = serverErrorResponse("取消報名失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default publicRegistrationsRoutes;
