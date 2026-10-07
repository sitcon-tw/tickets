import prisma from "#config/database";
import { auth } from "#lib/auth";
import { tracer } from "#lib/tracing";
import { requireAuth } from "#middleware/auth";
import { Prisma } from "#prisma/generated/prisma";
import { registrationSchemas } from "#schemas";
import { sendCancellationEmail, sendRegistrationConfirmation } from "#utils/email.js";
import { safeJsonParse, safeJsonStringify } from "#utils/json";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, unauthorizedResponse, validationErrorResponse } from "#utils/response";
import { PurchaseError, REGISTRATION_HOLD_MS, releaseExpiredHolds, releaseHold, resolveTicketPurchase } from "#utils/registration-hold";
import { sanitizeObject } from "#utils/sanitize";
import { resolveRegistrationAnswers } from "#utils/validation";
import { buildRegistrationCancelledNotification, buildRegistrationConfirmedNotification, dispatchWebhook } from "#utils/webhook";
import { SpanStatusCode } from "@opentelemetry/api";
import { LocalizedTextSchema, RegistrationStatusSchema } from "@sitcontix/types";
import type { Event, Ticket } from "#prisma/generated/prisma/client";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { fromNodeHeaders } from "better-auth/node";

const registrationInclude = {
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
} as const;

const publicRegistrationsRoutes: FastifyPluginAsync = async fastify => {
	fastify.addHook("preHandler", requireAuth);

	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/registrations",
		{
			schema: registrationSchemas.createRegistration
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.public.registrations.create", {
				attributes: {
					"event.id": request.body.eventId,
					"ticket.id": request.body.ticketId
				}
			});

			try {
				// Mask email for security
				const session = await auth.api.getSession({
					headers: fromNodeHeaders(request.headers)
				});
				const user = session?.user;

				if (!user) {
					const { response, statusCode } = unauthorizedResponse("請先登入");
					return reply.code(statusCode).send(response);
				}

				const maskedEmail = user?.email.length > 4 ? `****${user.email.slice(-4)}` : "****";
				span.setAttribute("registration.email.masked", maskedEmail);

				const { eventId, ticketId, invitationCode, referralCode, formData } = request.body;

				const sanitizedFormData = sanitizeObject(formData, false);

				// Free seats from lapsed holds so they don't block this user or count against stock
				await releaseExpiredHolds();

				span.addEvent("checking_existing_registration");
				const existingRegistration = await prisma.registration.findFirst({
					where: {
						email: user.email,
						eventId,
						status: { not: "cancelled" }
					}
				});
				span.setAttribute("user.id", user.id);

				// A pending registration on this ticket is the user's own seat hold; submitting the form completes it
				const hold = existingRegistration?.status === "pending" && existingRegistration.ticketId === ticketId ? existingRegistration : null;

				if (existingRegistration && !hold) {
					span.addEvent("user_already_registered");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "User already registered" });
					const { response, statusCode } = conflictResponse("您已經報名此活動");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("fetching_event_and_ticket");
				let invitationCodeId: string | null;
				let event: Event;
				let ticket: Ticket;
				if (hold) {
					// The hold already passed these checks and reserved the seat, so they are not repeated
					[event, ticket] = await Promise.all([prisma.event.findUniqueOrThrow({ where: { id: eventId } }), prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } })]);
					invitationCodeId = hold.invitationCodeId;
				} else {
					({ event, ticket, invitationCodeId } = await resolveTicketPurchase({ userId: user.id, eventId, ticketId, invitationCode }));
				}
				const formFields = await prisma.eventFormFields.findMany({
					where: { eventId },
					orderBy: { order: "asc" }
				});

				span.setAttribute("event.id", event.id);
				span.setAttribute("ticket.id", ticket.id);
				span.setAttribute("ticket.sold_count", ticket.soldCount);
				span.setAttribute("ticket.quantity", ticket.quantity);
				if (invitationCodeId) span.setAttribute("invitation_code.id", invitationCodeId);

				let referralCodeId: string | null = null;
				let referrerRegistrationId: string | null = null;
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
					referrerRegistrationId = referral.registrationId;
				}

				span.addEvent("validating_form_data");
				const { errors: formErrors, answers: registrationAnswers } = resolveRegistrationAnswers(formFields, ticketId, sanitizedFormData);
				if (formErrors) {
					span.addEvent("form_validation.failed");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Form validation failed" });
					const { response, statusCode } = validationErrorResponse("表單驗證失敗", formErrors);
					return reply.code(statusCode).send(response);
				}

				span.addEvent("starting_registration_transaction");
				// start registration transaction
				const result = hold
					? await prisma.$transaction(async tx => {
							const claimed = await tx.registration.updateMany({
								where: { id: hold.id, status: "pending", holdExpiresAt: { gt: new Date() } },
								data: {
									status: "confirmed",
									holdExpiresAt: null,
									formData: safeJsonStringify(registrationAnswers, "{}", "registration creation"),
									...(referrerRegistrationId && { referredBy: referrerRegistrationId })
								}
							});

							if (claimed.count === 0) {
								throw new Error("HOLD_EXPIRED");
							}

							if (referralCodeId) {
								await tx.referralUsage.create({
									data: {
										referralId: referralCodeId,
										registrationId: hold.id,
										eventId
									}
								});
							}

							const registration = await tx.registration.findUniqueOrThrow({
								where: { id: hold.id },
								include: registrationInclude
							});

							return {
								...registration,
								formData: safeJsonParse<Record<string, unknown>>(registration.formData, {}, "registration response")
							};
						})
					: await prisma.$transaction(
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
										invitationCodeId,
										email: user.email,
										formData: safeJsonStringify(registrationAnswers, "{}", "registration creation"),
										status: "confirmed",
										...(referrerRegistrationId && { referredBy: referrerRegistrationId })
									},
									include: registrationInclude
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

								const parsedFormData = safeJsonParse<Record<string, unknown>>(registration.formData, {}, "registration response");

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
				await sendRegistrationConfirmation(result, event, ticket, ticketUrl).catch(error => {
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

				if (error instanceof PurchaseError) {
					span.addEvent("purchase_check.failed", { "purchase.error_kind": error.kind });
					span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
					const { response, statusCode } =
						error.kind === "unauthorized"
							? unauthorizedResponse(error.message)
							: error.kind === "notFound"
								? notFoundResponse(error.message)
								: error.kind === "conflict"
									? conflictResponse(error.message)
									: validationErrorResponse(error.message);
					return reply.code(statusCode).send(response);
				}

				if (errorMessage === "HOLD_EXPIRED") {
					span.addEvent("transaction_error.hold_expired");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Seat hold expired" });
					const { response, statusCode } = conflictResponse("保留時間已過，請重新選擇票券");
					return reply.code(statusCode).send(response);
				}

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

	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/registrations/hold",
		{
			schema: registrationSchemas.holdRegistration
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.public.registrations.hold", {
				attributes: {
					"event.id": request.body.eventId,
					"ticket.id": request.body.ticketId
				}
			});

			try {
				const session = await auth.api.getSession({
					headers: fromNodeHeaders(request.headers)
				});
				const user = session?.user;

				if (!user) {
					const { response, statusCode } = unauthorizedResponse("請先登入");
					return reply.code(statusCode).send(response);
				}

				const { eventId, ticketId, invitationCode } = request.body;
				span.setAttribute("user.id", user.id);

				// Free seats from lapsed holds so they don't count against stock
				await releaseExpiredHolds();

				const existing = await prisma.registration.findFirst({
					where: { email: user.email, eventId, status: { not: "cancelled" } }
				});

				if (existing?.status === "pending" && existing.ticketId === ticketId && existing.holdExpiresAt) {
					// Same seat as before (page reload, back button): keep the original deadline
					span.addEvent("hold.reused");
					span.setStatus({ code: SpanStatusCode.OK });
					return reply.code(200).send(successResponse({ id: existing.id, eventId, ticketId, holdExpiresAt: existing.holdExpiresAt }, "座位已保留"));
				}

				if (existing?.status === "pending") {
					// The user picked a different ticket: give the previous seat back first
					span.addEvent("hold.switching_ticket");
					await releaseHold(existing.id, { onlyExpired: false });
				} else if (existing) {
					span.addEvent("user_already_registered");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "User already registered" });
					const { response, statusCode } = conflictResponse("您已經報名此活動");
					return reply.code(statusCode).send(response);
				}

				const { invitationCodeId } = await resolveTicketPurchase({ userId: user.id, eventId, ticketId, invitationCode });

				const holdExpiresAt = new Date(Date.now() + REGISTRATION_HOLD_MS);
				const hold = await prisma.$transaction(
					async tx => {
						const existingInTx = await tx.registration.findFirst({
							where: { email: user.email, eventId, status: { not: "cancelled" } }
						});
						if (existingInTx) {
							throw new Error("ALREADY_REGISTERED");
						}

						const currentTicket = await tx.ticket.findUnique({
							where: { id: ticketId },
							select: { soldCount: true, quantity: true }
						});
						if (!currentTicket || currentTicket.soldCount >= currentTicket.quantity) {
							throw new Error("TICKET_SOLD_OUT");
						}

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

						const created = await tx.registration.create({
							data: {
								userId: user.id,
								eventId,
								ticketId,
								invitationCodeId,
								email: user.email,
								formData: "{}",
								status: "pending",
								holdExpiresAt
							}
						});

						await tx.ticket.update({ where: { id: ticketId }, data: { soldCount: { increment: 1 } } });
						if (invitationCodeId) {
							await tx.invitationCode.update({ where: { id: invitationCodeId }, data: { usedCount: { increment: 1 } } });
						}

						return created;
					},
					{ isolationLevel: "Serializable" }
				);

				span.setAttribute("registration.id", hold.id);
				span.setStatus({ code: SpanStatusCode.OK });
				return reply.code(201).send(successResponse({ id: hold.id, eventId, ticketId, holdExpiresAt }, "座位已保留"));
			} catch (error) {
				request.log.error({ error }, "Hold registration error");
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to hold seat" });

				if (error instanceof PurchaseError) {
					const { response, statusCode } =
						error.kind === "unauthorized"
							? unauthorizedResponse(error.message)
							: error.kind === "notFound"
								? notFoundResponse(error.message)
								: error.kind === "conflict"
									? conflictResponse(error.message)
									: validationErrorResponse(error.message);
					return reply.code(statusCode).send(response);
				}

				const errorMessage = (error as Error).message;
				const conflictMessages: Record<string, string> = {
					TICKET_SOLD_OUT: "票券已售完",
					ALREADY_REGISTERED: "您已經報名此活動"
				};
				if (conflictMessages[errorMessage]) {
					const { response, statusCode } = conflictResponse(conflictMessages[errorMessage]);
					return reply.code(statusCode).send(response);
				}
				if (errorMessage === "INVITATION_CODE_INVALID" || errorMessage === "INVITATION_CODE_LIMIT_REACHED") {
					const { response, statusCode } = validationErrorResponse(errorMessage === "INVITATION_CODE_INVALID" ? "邀請碼已失效" : "邀請碼已達使用上限");
					return reply.code(statusCode).send(response);
				}

				if (error instanceof Prisma.PrismaClientKnownRequestError && (error as Prisma.PrismaClientKnownRequestError).code === "P2034") {
					const { response, statusCode } = conflictResponse("報名系統繁忙，請稍後再試");
					return reply.code(statusCode).send(response);
				}

				const { response, statusCode } = serverErrorResponse("保留座位失敗");
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
				headers: fromNodeHeaders(request.headers)
			});
			const userId = session?.user?.id;

			const span = tracer.startSpan("route.public.registrations.list", {
				attributes: {
					"user.id": userId
				}
			});

			try {
				await releaseExpiredHolds();
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
					const parsedFormData = safeJsonParse<Record<string, unknown>>(reg.formData, {}, `user registrations for ${reg.id}`);

					return {
						id: reg.id,
						userId: reg.userId,
						eventId: reg.eventId,
						ticketId: reg.ticketId,
						email: reg.email,
						status: RegistrationStatusSchema.parse(reg.status),
						referredBy: reg.referredBy ?? null,
						holdExpiresAt: reg.holdExpiresAt,
						checkedIn: reg.checkedIn,
						checkedInAt: reg.checkedInAt,
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
							price: reg.ticket.price,
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
				headers: fromNodeHeaders(request.headers)
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
				await releaseExpiredHolds();
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
				const parsedFormData = safeJsonParse<Record<string, unknown>>(registration.formData, {}, `single registration ${registration.id}`);

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
				const previousAnswers = safeJsonParse<Record<string, unknown>>(registration.formData, {}, "registration edit baseline");
				const { errors: formErrors, answers: registrationAnswers } = resolveRegistrationAnswers(formFields, registration.ticketId, sanitizedFormData, previousAnswers);
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
						formData: safeJsonStringify(registrationAnswers, "{}", "registration update"),
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

				const parsedFormData = safeJsonParse<Record<string, unknown>>(updatedRegistration.formData, {}, "updated registration response");

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
				headers: fromNodeHeaders(request.headers)
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

				if (registration.status !== "confirmed" && registration.status !== "pending") {
					span.addEvent("registration.not_cancellable");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Registration not cancellable" });
					const { response, statusCode } = validationErrorResponse("只能取消已確認或保留中的報名");
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
							select: { status: true, invitationCodeId: true }
						});

						if (!currentReg || (currentReg.status !== "confirmed" && currentReg.status !== "pending")) {
							throw new Error("ALREADY_CANCELLED");
						}

						await tx.registration.update({
							where: { id },
							data: {
								status: "cancelled",
								holdExpiresAt: null,
								updatedAt: new Date()
							}
						});

						await tx.ticket.update({
							where: { id: registration.ticketId },
							data: { soldCount: { decrement: 1 } }
						});

						if (currentReg.invitationCodeId) {
							await tx.invitationCode.update({
								where: { id: currentReg.invitationCodeId },
								data: { usedCount: { decrement: 1 } }
							});
						}

						await tx.referralUsage.deleteMany({
							where: {
								registrationId: registration.id
							}
						});
					},
					{
						isolationLevel: "Serializable"
					}
				);

				span.addEvent("cancellation_transaction.success");

				const frontendUrl = process.env.FRONTEND_URI || "http://localhost:3000";
				const buttonUrl = `${frontendUrl}/zh-Hant/my-registration/${registration.id}`;

				// A seat hold was never announced, so only confirmed registrations notify anyone when cancelled
				if (registration.status === "confirmed") {
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
				}

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
