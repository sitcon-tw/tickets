import prisma from "#config/database";
import { auth } from "#lib/auth";
import { tracer } from "#lib/tracing";
import { requireAuth } from "#middleware/auth";
import { Prisma } from "#prisma/generated/prisma";
import { registrationSchemas } from "#schemas";
import { sendCancellationEmail, sendRegistrationConfirmation } from "#utils/email.js";
import { safeJsonParse, safeJsonStringify } from "#utils/json";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, unauthorizedResponse, validationErrorResponse } from "#utils/response";
import { sanitizeObject } from "#utils/sanitize";
import { validateRegistrationFormData, type FormField } from "#utils/validation";
import { buildRegistrationCancelledNotification, buildRegistrationConfirmedNotification, dispatchWebhook } from "#utils/webhook";
import { SpanStatusCode } from "@opentelemetry/api";
import { LocalizedTextSchema, RegistrationStatusSchema, type Event, type Registration, type Ticket } from "@sitcontix/types";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const publicRegistrationsRoutes: FastifyPluginAsync = async fastify => {
	fastify.addHook("preHandler", requireAuth);

	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/registrations",
		{
			schema: registrationSchemas.createRegistration
		},
		async (request, reply) => {
			// Mask email for security
			const session = await auth.api.getSession({
				headers: request.headers as unknown as Headers
			});
			const user = session!.user;
			const maskedEmail = user.email.length > 4 ? `****${user.email.slice(-4)}` : "****";

			const span = tracer.startSpan("route.public.registrations.create", {
				attributes: {
					"registration.email.masked": maskedEmail,
					"event.id": request.body.eventId,
					"ticket.id": request.body.ticketId
				}
			});

			try {
				const { eventId, ticketId, invitationCode, referralCode, formData } = request.body;

				const sanitizedFormData = sanitizeObject(formData, false);

				span.addEvent("checking_existing_registration");
				const existingRegistration = await prisma.registration.findFirst({
					where: {
						email: user.email,
						eventId,
						status: { not: "cancelled" }
					}
				});
				span.setAttribute("user.id", user.id);

				if (existingRegistration) {
					span.addEvent("user_already_registered");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "User already registered" });
					const { response, statusCode } = conflictResponse("您已經報名此活動");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("fetching_event_and_ticket");
				const [event, ticket, formFields] = await Promise.all([
					prisma.event.findUnique({
						where: {
							id: eventId,
							isActive: true
						}
					}),
					prisma.ticket.findUnique({
						where: {
							id: ticketId,
							eventId,
							isActive: true,
							hidden: false
						}
					}),
					prisma.eventFormFields.findMany({
						where: { eventId },
						orderBy: { order: "asc" }
					})
				]);

				if (!event) {
					span.addEvent("event.not_found");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Event not found" });
					const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				if (!ticket) {
					span.addEvent("ticket.not_found");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Ticket not found" });
					const { response, statusCode } = notFoundResponse("票券不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("event.id", event.id);
				span.setAttribute("ticket.id", ticket.id);
				span.setAttribute("ticket.sold_count", ticket.soldCount);
				span.setAttribute("ticket.quantity", ticket.quantity);

				if (ticket.soldCount >= ticket.quantity) {
					span.addEvent("ticket.sold_out");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Ticket sold out" });
					const { response, statusCode } = conflictResponse("票券已售完");
					return reply.code(statusCode).send(response);
				}

				const now = new Date();
				if (ticket.saleStart && now < ticket.saleStart) {
					span.addEvent("ticket.not_yet_on_sale", {
						"ticket.saleStart": ticket.saleStart.toISOString()
					});
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Ticket not yet on sale" });
					const { response, statusCode } = validationErrorResponse("票券尚未開始販售");
					return reply.code(statusCode).send(response);
				}

				if (ticket.saleEnd && now > ticket.saleEnd) {
					span.addEvent("ticket.sale_ended", {
						"ticket.saleEnd": ticket.saleEnd.toISOString()
					});
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Ticket sale ended" });
					const { response, statusCode } = validationErrorResponse("票券販售已結束");
					return reply.code(statusCode).send(response);
				}

				let invitationCodeId: string | null = null;
				if (ticket.requireInviteCode) {
					span.addEvent("validating_required_invitation_code");
					if (!invitationCode) {
						span.addEvent("invitation_code.missing");
						span.setStatus({ code: SpanStatusCode.ERROR, message: "Invitation code required but not provided" });
						const { response, statusCode } = unauthorizedResponse("此票券需要邀請碼");
						return reply.code(statusCode).send(response);
					}

					const code = await prisma.invitationCode.findFirst({
						where: {
							code: invitationCode,
							ticketId,
							isActive: true
						}
					});

					if (!code) {
						span.addEvent("invitation_code.invalid");
						span.setStatus({ code: SpanStatusCode.ERROR, message: "Invalid invitation code" });
						const { response, statusCode } = validationErrorResponse("無效的邀請碼");
						return reply.code(statusCode).send(response);
					}

					span.setAttribute("invitation_code.id", code.id);
					span.setAttribute("invitation_code.used_count", code.usedCount);

					if (code.validUntil && now > code.validUntil) {
						span.addEvent("invitation_code.expired");
						span.setStatus({ code: SpanStatusCode.ERROR, message: "Invitation code expired" });
						const { response, statusCode } = validationErrorResponse("邀請碼已過期");
						return reply.code(statusCode).send(response);
					}

					if (code.validFrom && now < code.validFrom) {
						span.addEvent("invitation_code.not_yet_valid");
						span.setStatus({ code: SpanStatusCode.ERROR, message: "Invitation code not yet valid" });
						const { response, statusCode } = validationErrorResponse("邀請碼尚未生效");
						return reply.code(statusCode).send(response);
					}

					if (code.usageLimit && code.usedCount >= code.usageLimit) {
						span.addEvent("invitation_code.usage_limit_exceeded");
						span.setStatus({ code: SpanStatusCode.ERROR, message: "Invitation code usage limit exceeded" });
						const { response, statusCode } = validationErrorResponse("邀請碼已達使用上限");
						return reply.code(statusCode).send(response);
					}

					if (ticket.id != code.ticketId) {
						span.addEvent("invitation_code.wrong_ticket");
						span.setStatus({ code: SpanStatusCode.ERROR, message: "Invitation code not for this ticket" });
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
						span.setAttribute("invitation_code.id", code.id);
					}
				}

				if (ticket.requireSmsVerification) {
					span.addEvent("checking_sms_verification");
					const verifiedUser = await prisma.user.findUnique({
						where: { id: user.id },
						select: { phoneVerified: true }
					});

					if (!verifiedUser?.phoneVerified) {
						span.addEvent("sms_verification.not_verified");
						span.setStatus({ code: SpanStatusCode.ERROR, message: "SMS verification required" });
						const { response, statusCode } = validationErrorResponse("此票券需要驗證手機號碼");
						return reply.code(statusCode).send(response);
					}
				}

				let referralCodeId: string | null = null;
				if (referralCode) {
					span.addEvent("validating_referral_code");
					const referral = await prisma.referral.findFirst({
						where: {
							code: referralCode,
							eventId,
							isActive: true
						}
					});

					if (!referral) {
						span.addEvent("referral_code.invalid");
						span.setStatus({ code: SpanStatusCode.ERROR, message: "Invalid referral code" });
						const { response, statusCode } = validationErrorResponse("無效的推薦碼");
						return reply.code(statusCode).send(response);
					}

					span.setAttribute("referral_code.id", referral.id);
					referralCodeId = referral.id;
				}

				span.addEvent("validating_form_data");
				const formErrors = validateRegistrationFormData(sanitizedFormData, formFields as unknown as FormField[], ticketId);
				if (formErrors) {
					span.addEvent("form_validation.failed");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Form validation failed" });
					const { response, statusCode } = validationErrorResponse("表單驗證失敗", formErrors);
					return reply.code(statusCode).send(response);
				}

				span.addEvent("starting_registration_transaction");
				// start registration transaction
				const result = await prisma.$transaction(
					async tx => {
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

						// Re-check ticket availability
						const currentTicket = await tx.ticket.findUnique({
							where: { id: ticketId },
							select: { soldCount: true, quantity: true }
						});

						if (!currentTicket || currentTicket.soldCount >= currentTicket.quantity) {
							throw new Error("TICKET_SOLD_OUT");
						}

						// Re-check invitation code
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

						await tx.ticket.update({
							where: { id: ticketId },
							data: { soldCount: { increment: 1 } }
						});

						if (invitationCodeId) {
							await tx.invitationCode.update({
								where: { id: invitationCodeId },
								data: { usedCount: { increment: 1 } }
							});
						}

						if (referralCodeId) {
							await tx.referralUsage.create({
								data: {
									referralId: referralCodeId,
									registrationId: registration.id,
									eventId
								}
							});
						}

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

				span.addEvent("registration_transaction.success", {
					"registration.id": result.id
				});
				span.setAttribute("registration.id", result.id);

				const frontendUrl = process.env.FRONTEND_URI || "http://localhost:3000";
				const ticketUrl = `${frontendUrl}/${event.slug}/success`;

				span.addEvent("sending_confirmation_email");
				await sendRegistrationConfirmation(result as unknown as Registration, event as unknown as Event, ticket as unknown as Ticket, ticketUrl).catch(error => {
					request.log.error({ error }, "Failed to send registration confirmation email");
					span.addEvent("confirmation_email.failed");
				});

				span.addEvent("dispatching_webhook");
				const webhookNotification = buildRegistrationConfirmedNotification(
					{ name: event.name, slug: event.slug },
					{ id: result.id, status: result.status, createdAt: result.createdAt, email: result.email, formData: result.formData ? safeJsonStringify(result.formData, "{}", "webhook formData") : null },
					{ id: ticket.id, name: ticket.name, price: ticket.price }
				);
				dispatchWebhook(eventId, "registration_confirmed", webhookNotification).catch(error => {
					request.log.error({ error }, "Failed to dispatch registration webhook");
					span.addEvent("webhook.failed");
				});

				const responseData = {
					...result,
					status: RegistrationStatusSchema.parse(result.status),
					event: {
						...result.event,
						name: LocalizedTextSchema.parse(result.event.name),
						locationText: LocalizedTextSchema.nullable().parse(result.event.locationText)
					},
					ticket: {
						...result.ticket,
						name: LocalizedTextSchema.parse(result.ticket.name)
					}
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.code(201).send(successResponse(responseData, "報名成功"));
			} catch (error) {
				request.log.error({ error }, "Create registration error");
				span.recordException(error as Error);

				const errorMessage = (error as Error).message;

				if (errorMessage === "TICKET_SOLD_OUT") {
					span.addEvent("transaction_error.ticket_sold_out");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Ticket sold out in transaction" });
					const { response, statusCode } = conflictResponse("票券已售完");
					return reply.code(statusCode).send(response);
				}

				if (errorMessage === "ALREADY_REGISTERED") {
					span.addEvent("transaction_error.already_registered");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Already registered in transaction" });
					const { response, statusCode } = conflictResponse("您已經報名此活動");
					return reply.code(statusCode).send(response);
				}

				if (errorMessage === "INVITATION_CODE_INVALID") {
					span.addEvent("transaction_error.invitation_code_invalid");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Invitation code invalid in transaction" });
					const { response, statusCode } = validationErrorResponse("邀請碼已失效");
					return reply.code(statusCode).send(response);
				}

				if (errorMessage === "INVITATION_CODE_LIMIT_REACHED") {
					span.addEvent("transaction_error.invitation_code_limit");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Invitation code limit reached in transaction" });
					const { response, statusCode } = validationErrorResponse("邀請碼已達使用上限");
					return reply.code(statusCode).send(response);
				}

				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					const prismaError = error as Prisma.PrismaClientKnownRequestError;

					if (prismaError.code === "P2034") {
						request.log.warn({ error }, "Transaction conflict detected");
						span.addEvent("transaction_error.conflict", {
							"prisma.error_code": prismaError.code
						});
						span.setStatus({ code: SpanStatusCode.ERROR, message: "Transaction conflict" });
						const { response, statusCode } = conflictResponse("報名系統繁忙，請稍後再試");
						return reply.code(statusCode).send(response);
					}

					if (prismaError.code === "P2002" && (prismaError.meta?.target as string[])?.includes("email")) {
						span.addEvent("transaction_error.duplicate_email");
						span.setStatus({ code: SpanStatusCode.ERROR, message: "Duplicate email" });
						const { response, statusCode } = conflictResponse("此信箱已經報名過此活動");
						return reply.code(statusCode).send(response);
					}
				}

				const standardError = error as Error;
				if (standardError.name === "ValidationError" || standardError.message?.includes("必填") || standardError.message?.includes("驗證失敗") || standardError.message?.includes("required")) {
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Validation error" });
					const { response, statusCode } = validationErrorResponse((error as Error).message || "表單驗證失敗");
					return reply.code(statusCode).send(response);
				}

				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to create registration" });
				const { response, statusCode } = serverErrorResponse("報名失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/registrations",
		{
			schema: registrationSchemas.getUserRegistrations
		},
		async (request, reply) => {
			const session = await auth.api.getSession({
				headers: request.headers as unknown as Headers
			});
			const userId = session?.user?.id;

			const span = tracer.startSpan("route.public.registrations.list", {
				attributes: {
					"user.id": userId
				}
			});

			try {
				span.addEvent("fetching_user_registrations");
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

				span.setAttribute("registrations.count", registrations.length);
				span.addEvent("processing_registrations");

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
						status: RegistrationStatusSchema.parse(reg.status),
						referredBy: reg.referredBy ?? null,
						formData: parsedFormData,
						createdAt: reg.createdAt,
						updatedAt: reg.updatedAt,
						event: {
							id: reg.event.id,
							name: LocalizedTextSchema.parse(reg.event.name),
							description: LocalizedTextSchema.nullable().parse(reg.event.description),
							locationText: LocalizedTextSchema.nullable().parse(reg.event.locationText),
							mapLink: reg.event.mapLink ?? null,
							startDate: reg.event.startDate,
							endDate: reg.event.endDate,
							ogImage: reg.event.ogImage ?? null
						},
						ticket: {
							id: reg.ticket.id,
							name: LocalizedTextSchema.parse(reg.ticket.name),
							description: LocalizedTextSchema.nullable().parse(reg.ticket.description),
							price: Number(reg.ticket.price),
							saleEnd: reg.ticket.saleEnd ?? null
						},
						isUpcoming: reg.event.startDate > now,
						isPast: reg.event.endDate < now,
						canEdit: reg.status === "confirmed" && reg.event.startDate > now && (reg.event.editDeadline ? reg.event.editDeadline > now : !reg.ticket.saleEnd || reg.ticket.saleEnd > now),
						canCancel: reg.status === "confirmed" && reg.event.startDate > now
					};
				});

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(registrationsWithStatus));
			} catch (error) {
				request.log.error({ error }, "Get user registrations error");
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to get user registrations" });
				const { response, statusCode } = serverErrorResponse("取得報名記錄失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/registrations/:id",
		{
			schema: registrationSchemas.getRegistration
		},
		async (request, reply) => {
			const session = await auth.api.getSession({
				headers: request.headers as unknown as Headers
			});
			const userId = session?.user?.id;
			const { id } = request.params;

			const span = tracer.startSpan("route.public.registrations.get", {
				attributes: {
					"user.id": userId,
					"registration.id": id
				}
			});

			try {
				span.addEvent("fetching_registration");
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
					span.addEvent("registration.not_found");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Registration not found" });
					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("registration.status", registration.status);
				span.setAttribute("event.id", registration.event.id);
				span.setAttribute("ticket.id", registration.ticket.id);

				const now = new Date();
				const parsedFormData = safeJsonParse(registration.formData, {}, `single registration ${registration.id}`);

				const registrationWithStatus = {
					...registration,
					formData: parsedFormData,
					isUpcoming: registration.event.startDate > now,
					isPast: registration.event.endDate < now,
					status: RegistrationStatusSchema.parse(registration.status),
					event: {
						...registration.event,
						name: LocalizedTextSchema.parse(registration.event.name),
						description: LocalizedTextSchema.nullable().parse(registration.event.description),
						locationText: LocalizedTextSchema.nullable().parse(registration.event.locationText)
					},
					ticket: {
						...registration.ticket,
						name: LocalizedTextSchema.parse(registration.ticket.name),
						description: LocalizedTextSchema.nullable().parse(registration.ticket.description)
					},
					canEdit:
						registration.status === "confirmed" &&
						registration.event.startDate > now &&
						(registration.event.editDeadline ? registration.event.editDeadline > now : !registration.ticket.saleEnd || registration.ticket.saleEnd > now),
					canCancel: registration.status === "confirmed" && registration.event.startDate > now
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(registrationWithStatus));
			} catch (error) {
				request.log.error({ error }, "Get registration error");
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to get registration" });
				const { response, statusCode } = serverErrorResponse("取得報名記錄失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	fastify.withTypeProvider<ZodTypeProvider>().put(
		"/registrations/:id",
		{
			schema: registrationSchemas.updateRegistration
		},
		async (request, reply) => {
			const session = await auth.api.getSession({
				headers: request.headers
			});
			const userId = session?.user?.id;
			const id = request.params.id;

			const span = tracer.startSpan("route.public.registrations.update", {
				attributes: {
					"user.id": userId,
					"registration.id": id
				}
			});

			try {
				const { formData } = request.body;

				const sanitizedFormData = sanitizeObject(formData, false);
				if (!sanitizedFormData) {
					span.addEvent("form_data.invalid");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Invalid form data" });
					const { response, statusCode } = validationErrorResponse("表單資料無效");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("fetching_registration_and_form_fields");
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
					span.addEvent("registration.not_found");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Registration not found" });
					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("registration.status", registration.status);
				span.setAttribute("event.id", registration.event.id);
				span.setAttribute("ticket.id", registration.ticket.id);

				if (registration.status !== "confirmed") {
					span.addEvent("registration.not_confirmed");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Registration not confirmed" });
					const { response, statusCode } = validationErrorResponse("只能編輯已確認的報名");
					return reply.code(statusCode).send(response);
				}

				if (new Date() >= registration.event.startDate) {
					span.addEvent("event.already_started");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Event already started" });
					const { response, statusCode } = validationErrorResponse("活動已開始，無法編輯報名");
					return reply.code(statusCode).send(response);
				}

				const now = new Date();
				if (registration.event.editDeadline) {
					if (now >= registration.event.editDeadline) {
						span.addEvent("edit_deadline.passed");
						span.setStatus({ code: SpanStatusCode.ERROR, message: "Edit deadline passed" });
						const { response, statusCode } = validationErrorResponse("編輯截止時間已過，無法編輯報名");
						return reply.code(statusCode).send(response);
					}
				} else if (registration.ticket.saleEnd && now >= registration.ticket.saleEnd) {
					span.addEvent("ticket_sale.ended");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Ticket sale ended" });
					const { response, statusCode } = validationErrorResponse("票券已截止，無法編輯報名");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("validating_form_data");
				const formErrors = validateRegistrationFormData(sanitizedFormData, formFields as unknown as FormField[], registration.ticketId);
				if (formErrors) {
					span.addEvent("form_validation.failed");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Form validation failed" });
					const { response, statusCode } = validationErrorResponse("表單驗證失敗", formErrors);
					return reply.code(statusCode).send(response);
				}

				span.addEvent("updating_registration");
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

				span.setAttribute("event.id", updatedRegistration.event.id);
				span.setAttribute("ticket.id", updatedRegistration.ticket.id);

				const parsedFormData = safeJsonParse(updatedRegistration.formData, {}, "updated registration response");

				const responseData = {
					...updatedRegistration,
					formData: parsedFormData,
					status: RegistrationStatusSchema.parse(updatedRegistration.status),
					event: {
						...updatedRegistration.event,
						name: LocalizedTextSchema.parse(updatedRegistration.event.name),
						description: LocalizedTextSchema.nullable().parse(updatedRegistration.event.description),
						locationText: LocalizedTextSchema.nullable().parse(updatedRegistration.event.locationText)
					},
					ticket: {
						...updatedRegistration.ticket,
						name: LocalizedTextSchema.parse(updatedRegistration.ticket.name),
						description: LocalizedTextSchema.nullable().parse(updatedRegistration.ticket.description)
					}
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(responseData, "報名資料已更新"));
			} catch (error) {
				request.log.error({ error }, "Edit registration error");
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to update registration" });
				const { response, statusCode } = serverErrorResponse("更新報名資料失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	fastify.withTypeProvider<ZodTypeProvider>().put(
		"/registrations/:id/cancel",
		{
			schema: registrationSchemas.cancelRegistration
		},
		async (request, reply) => {
			const session = await auth.api.getSession({
				headers: request.headers as unknown as Headers
			});
			const userId = session?.user?.id;
			const id = request.params.id;

			const span = tracer.startSpan("route.public.registrations.cancel", {
				attributes: {
					"user.id": userId,
					"registration.id": id
				}
			});

			try {
				span.addEvent("fetching_registration");
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
					span.addEvent("registration.not_found");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Registration not found" });
					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("registration.status", registration.status);
				span.setAttribute("event.id", registration.eventId);
				span.setAttribute("ticket.id", registration.ticketId);

				if (registration.status !== "confirmed") {
					span.addEvent("registration.not_confirmed");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Registration not confirmed" });
					const { response, statusCode } = validationErrorResponse("只能取消已確認的報名");
					return reply.code(statusCode).send(response);
				}

				if (new Date() >= registration.event.startDate) {
					span.addEvent("event.already_started");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Event already started" });
					const { response, statusCode } = validationErrorResponse("活動已開始，無法取消報名");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("starting_cancellation_transaction");
				await prisma.$transaction(
					async tx => {
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

				span.addEvent("cancellation_transaction.success");

				const frontendUrl = process.env.FRONTEND_URI || "http://localhost:3000";
				const buttonUrl = `${frontendUrl}/zh-Hant/my-registration/${registration.id}`;

				span.addEvent("sending_cancellation_email");
				await sendCancellationEmail(registration.email, registration.event.name, buttonUrl).catch(error => {
					request.log.error({ error }, "Failed to send cancellation email");
					span.addEvent("cancellation_email.failed");
				});

				span.addEvent("dispatching_webhook");
				const cancelledNotification = buildRegistrationCancelledNotification(
					{ name: registration.event.name, slug: registration.event.slug },
					{ id: registration.id, createdAt: registration.createdAt, updatedAt: new Date() }
				);
				dispatchWebhook(registration.eventId, "registration_cancelled", cancelledNotification).catch(error => {
					request.log.error({ error }, "Failed to dispatch cancellation webhook");
					span.addEvent("webhook.failed");
				});

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(null, "報名已取消"));
			} catch (error) {
				request.log.error({ error }, "Cancel registration error");
				span.recordException(error as Error);

				if ((error as Error).message === "ALREADY_CANCELLED") {
					span.addEvent("transaction_error.already_cancelled");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Already cancelled" });
					const { response, statusCode } = conflictResponse("報名已被取消");
					return reply.code(statusCode).send(response);
				}

				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					const prismaError = error as Prisma.PrismaClientKnownRequestError;
					if (prismaError.code === "P2034") {
						request.log.warn({ error }, "Cancellation conflict detected");
						span.addEvent("transaction_error.conflict", {
							"prisma.error_code": prismaError.code
						});
						span.setStatus({ code: SpanStatusCode.ERROR, message: "Transaction conflict" });
						const { response, statusCode } = conflictResponse("取消系統繁忙，請稍後再試");
						return reply.code(statusCode).send(response);
					}
				}

				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to cancel registration" });
				const { response, statusCode } = serverErrorResponse("取消報名失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);
};

export default publicRegistrationsRoutes;
