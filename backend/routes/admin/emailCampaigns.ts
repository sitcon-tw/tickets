import type { PaginationQuery } from "@sitcontix/types";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { requireAdmin } from "#middleware/auth";
import { adminEmailCampaignSchemas, EmailCampaignCreateBodySchema, emailCampaignSchemas } from "#schemas";
import { calculateRecipients, sendCampaignEmail } from "#utils/email";
import { logger } from "#utils/logger";
import { serverErrorResponse, successPaginatedResponse, successResponse, validationErrorResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";
import { z } from "zod/v4";

const componentLogger = logger.child({ component: "admin/emailCampaigns" });

type EmailCampaignCreateBody = z.infer<typeof EmailCampaignCreateBodySchema>;

const adminEmailCampaignsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	fastify.addHook("preHandler", requireAdmin);

	fastify.get<{
		Querystring: PaginationQuery;
	}>(
		"/email-campaigns",
		{
			schema: adminEmailCampaignSchemas.listEmailCampaigns
		},
		async (request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.list", {
				attributes: {
					"pagination.page": request.query.page || 1,
					"pagination.limit": request.query.limit || 20
				}
			});

			try {
				const { page = 1, limit = 20 } = request.query;
				const skip = (page - 1) * limit;

				span.addEvent("query.campaigns.start");

				const campaigns = await prisma.emailCampaign.findMany({
					skip,
					take: limit,
					include: {
						user: {
							select: { name: true, email: true }
						}
					},
					orderBy: { createdAt: "desc" }
				});
				const total = await prisma.emailCampaign.count();

				span.setAttribute("campaigns.count", campaigns.length);
				span.setAttribute("campaigns.total", total);

				const pagination = {
					page: parseInt(page as any),
					limit: parseInt(limit as any),
					total,
					totalPages: Math.ceil(total / limit),
					hasNext: page < Math.ceil(total / limit),
					hasPrev: page > 1
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successPaginatedResponse(campaigns, "取得郵件發送記錄成功", pagination));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to list email campaigns"
				});
				throw error;
			} finally {
				span.end();
			}
		}
	);

	fastify.post<{
		Body: EmailCampaignCreateBody;
	}>(
		"/email-campaigns",
		{
			schema: emailCampaignSchemas.createEmailCampaign
		},
		async (request: FastifyRequest<{ Body: EmailCampaignCreateBody }>, reply: FastifyReply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.create", {
				attributes: {
					"campaign.name": request.body.name,
					"campaign.subject": request.body.subject
				}
			});

			try {
				const { name, subject, content, targetAudience, scheduledAt } = request.body;

				if (!content) {
					span.addEvent("validation.failed", { reason: "missing_content" });
					const { response, statusCode } = validationErrorResponse("必須提供郵件內容");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("campaign.create.start");

				const campaign = await prisma.emailCampaign.create({
					data: {
						userId: request.user?.id || "system",
						name,
						subject,
						content,
						recipientFilter: targetAudience ? JSON.stringify(targetAudience) : null,
						scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
						status: "draft"
					}
				});

				span.setAttribute("campaign.id", campaign.id);
				span.setAttribute("campaign.creator_id", request.user?.id || "system");
				span.setAttribute("campaign.status", campaign.status);
				span.setStatus({ code: SpanStatusCode.OK });

				return reply.status(201).send(successResponse(campaign, "郵件發送任務已建立"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to create email campaign"
				});
				throw error;
			} finally {
				span.end();
			}
		}
	);

	fastify.get<{
		Params: { campaignId: string };
	}>(
		"/email-campaigns/:campaignId/status",
		{
			schema: adminEmailCampaignSchemas.getEmailCampaignStatus
		},
		async (request: FastifyRequest<{ Params: { campaignId: string } }>, reply: FastifyReply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.get_status", {
				attributes: {
					"campaign.id": request.params.campaignId
				}
			});

			try {
				const { campaignId } = request.params;

				span.addEvent("query.campaign.start");

				const campaign = await prisma.emailCampaign.findUnique({
					where: { id: campaignId },
					include: {
						user: {
							select: { name: true, email: true }
						}
					}
				});

				if (!campaign) {
					span.addEvent("campaign.not_found");
					const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("campaign.id", campaign.id);
				span.setAttribute("campaign.status", campaign.status);
				span.setAttribute("campaign.sent_count", campaign.sentCount);
				span.setAttribute("campaign.total_count", campaign.totalCount);
				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(
					successResponse({
						id: campaign.id,
						name: campaign.name,
						status: campaign.status,
						sentCount: campaign.sentCount,
						failedCount: campaign.totalCount - campaign.sentCount,
						totalRecipients: campaign.totalCount,
						scheduledAt: campaign.scheduledAt,
						sentAt: campaign.sentAt,
						createdAt: campaign.createdAt
					})
				);
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get campaign status"
				});
				throw error;
			} finally {
				span.end();
			}
		}
	);

	// Preview email content
	fastify.post<{
		Params: { campaignId: string };
	}>(
		"/email-campaigns/:campaignId/preview",
		{
			schema: adminEmailCampaignSchemas.previewEmailCampaign
		},
		async (request: FastifyRequest<{ Params: { campaignId: string } }>, reply: FastifyReply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.preview", {
				attributes: {
					"campaign.id": request.params.campaignId
				}
			});

			try {
				const { campaignId } = request.params;

				span.addEvent("query.campaign.start");

				const campaign = await prisma.emailCampaign.findUnique({
					where: { id: campaignId }
				});

				if (!campaign) {
					span.addEvent("campaign.not_found");
					const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("campaign.id", campaign.id);
				let previewHtml = campaign.content;
				let previewText = campaign.content.replace(/<[^>]*>/g, "");

				span.addEvent("query.sample_registration.start");

				const sampleRegistration = await prisma.registration.findFirst({
					include: {
						event: true,
						ticket: true
					}
				});

				if (sampleRegistration) {
					span.addEvent("preview.populate_sample_data");
					const formData = JSON.parse(sampleRegistration.formData || "{}");
					previewHtml = previewHtml
						.replace(/{{name}}/g, formData.name || "Sample User")
						.replace(/{{email}}/g, sampleRegistration.email)
						.replace(/{{eventName}}/g, String(sampleRegistration.event.name))
						.replace(/{{ticketName}}/g, String(sampleRegistration.ticket.name));

					previewText = previewText
						.replace(/{{name}}/g, formData.name || "Sample User")
						.replace(/{{email}}/g, sampleRegistration.email)
						.replace(/{{eventName}}/g, String(sampleRegistration.event.name))
						.replace(/{{ticketName}}/g, String(sampleRegistration.ticket.name));
				}

				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(
					successResponse({
						campaignId,
						subject: campaign.subject,
						previewHtml,
						previewText
					})
				);
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to preview email campaign"
				});
				throw error;
			} finally {
				span.end();
			}
		}
	);

	// Calculate recipient count
	fastify.post<{
		Params: { campaignId: string };
	}>(
		"/email-campaigns/:campaignId/calculate-recipients",
		{
			schema: adminEmailCampaignSchemas.calculateRecipients
		},
		async (request: FastifyRequest<{ Params: { campaignId: string } }>, reply: FastifyReply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.calculate_recipients", {
				attributes: {
					"campaign.id": request.params.campaignId
				}
			});

			try {
				const { campaignId } = request.params;

				span.addEvent("query.campaign.start");

				const campaign = await prisma.emailCampaign.findUnique({
					where: { id: campaignId }
				});

				if (!campaign) {
					span.addEvent("campaign.not_found");
					const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("campaign.id", campaign.id);
				span.addEvent("calculate_recipients.start");

				const recipients = await calculateRecipients(campaign.recipientFilter);

				span.setAttribute("recipients.count", recipients.length);
				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(
					successResponse(
						{
							campaignId,
							recipientCount: recipients.length,
							recipients: recipients.slice(0, 10).map(r => ({ email: r.email }))
						},
						"成功計算收件人數量"
					)
				);
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to calculate recipients"
				});
				throw error;
			} finally {
				span.end();
			}
		}
	);

	// Send email campaign
	fastify.post<{
		Params: { campaignId: string };
		Body: { sendNow?: boolean };
	}>(
		"/email-campaigns/:campaignId/send",
		{
			schema: adminEmailCampaignSchemas.sendEmailCampaign
		},
		async (request: FastifyRequest<{ Params: { campaignId: string }; Body: { sendNow?: boolean } }>, reply: FastifyReply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.send", {
				attributes: {
					"campaign.id": request.params.campaignId,
					"campaign.send_now": request.body?.sendNow ?? true
				}
			});

			try {
				const { campaignId } = request.params;
				const { sendNow = true } = request.body || {};

				span.addEvent("query.campaign.start");

				const campaign = await prisma.emailCampaign.findUnique({
					where: { id: campaignId }
				});

				if (!campaign) {
					span.addEvent("campaign.not_found");
					const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("campaign.id", campaign.id);
				span.setAttribute("campaign.status", campaign.status);

				if (campaign.status === "sent") {
					span.addEvent("validation.failed", { reason: "already_sent" });
					const { response, statusCode } = validationErrorResponse("郵件任務已發送");
					return reply.code(statusCode).send(response);
				}

				if (campaign.status === "cancelled") {
					span.addEvent("validation.failed", { reason: "cancelled" });
					const { response, statusCode } = validationErrorResponse("已取消的郵件任務無法發送");
					return reply.code(statusCode).send(response);
				}

				if (!sendNow) {
					span.addEvent("campaign.scheduled");
					// Schedule for later - just update status
					await prisma.emailCampaign.update({
						where: { id: campaignId },
						data: {
							status: "scheduled",
							updatedAt: new Date()
						}
					});
					span.setStatus({ code: SpanStatusCode.OK });
					return reply.send(successResponse(campaign, "郵件已排程"));
				}

				span.addEvent("calculate_recipients.start");

				// Calculate recipients
				const recipients = await calculateRecipients(campaign.recipientFilter);

				span.setAttribute("recipients.count", recipients.length);

				if (recipients.length === 0) {
					span.addEvent("validation.failed", { reason: "no_recipients" });
					const { response, statusCode } = validationErrorResponse("沒有符合條件的收件人");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("campaign.update_status_sending");

				await prisma.emailCampaign.update({
					where: { id: campaignId },
					data: {
						status: "sending",
						totalCount: recipients.length,
						updatedAt: new Date()
					}
				});

				try {
					span.addEvent("campaign.send_emails.start");

					// Send emails
					const result = await sendCampaignEmail(campaign, recipients);

					span.setAttribute("campaign.sent_count", result.sentCount);
					span.setAttribute("campaign.total_recipients", result.totalRecipients);
					span.addEvent("campaign.send_emails.complete");

					// Update campaign with results
					const updatedCampaign = await prisma.emailCampaign.update({
						where: { id: campaignId },
						data: {
							status: "sent",
							sentCount: result.sentCount,
							totalCount: result.totalRecipients,
							sentAt: new Date(),
							updatedAt: new Date()
						}
					});

					span.setStatus({ code: SpanStatusCode.OK });

					return reply.send(
						successResponse(
							{
								...updatedCampaign,
								sendResult: result
							},
							"郵件發送完成"
						)
					);
				} catch (error) {
					componentLogger.error({ error }, "Send email campaign error");
					span.recordException(error as Error);
					span.addEvent("campaign.send_failed");
					span.setStatus({
						code: SpanStatusCode.ERROR,
						message: "Failed to send campaign emails"
					});

					// Update campaign status to failed
					try {
						await prisma.emailCampaign.update({
							where: { id: campaignId },
							data: {
								status: "draft",
								updatedAt: new Date()
							}
						});
					} catch (updateError) {
						componentLogger.error({ error: updateError }, "Failed to update campaign status");
					}

					const { response, statusCode } = serverErrorResponse("發送郵件失敗：" + (error as Error).message);
					return reply.code(statusCode).send(response);
				}
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to send email campaign"
				});
				throw error;
			} finally {
				span.end();
			}
		}
	);

	// Cancel email campaign
	fastify.delete<{
		Params: { campaignId: string };
	}>(
		"/email-campaigns/:campaignId",
		{
			schema: adminEmailCampaignSchemas.cancelEmailCampaign
		},
		async (request: FastifyRequest<{ Params: { campaignId: string } }>, reply: FastifyReply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.cancel", {
				attributes: {
					"campaign.id": request.params.campaignId
				}
			});

			try {
				const { campaignId } = request.params;

				span.addEvent("query.campaign.start");

				const campaign = await prisma.emailCampaign.findUnique({
					where: { id: campaignId }
				});

				if (!campaign) {
					span.addEvent("campaign.not_found");
					const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("campaign.id", campaign.id);
				span.setAttribute("campaign.status", campaign.status);

				if (campaign.status === "sent") {
					span.addEvent("validation.failed", { reason: "already_sent" });
					const { response, statusCode } = validationErrorResponse("已發送的郵件任務無法取消");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("campaign.cancel.start");

				const updatedCampaign = await prisma.emailCampaign.update({
					where: { id: campaignId },
					data: {
						status: "cancelled",
						updatedAt: new Date()
					}
				});

				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(successResponse(updatedCampaign, "郵件發送任務已取消"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to cancel email campaign"
				});
				throw error;
			} finally {
				span.end();
			}
		}
	);
};

export default adminEmailCampaignsRoutes;
