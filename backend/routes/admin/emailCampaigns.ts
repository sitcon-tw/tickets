import type { PaginationQuery } from "@sitcontix/types";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { requireAdmin } from "#middleware/auth";
import { adminEmailCampaignSchemas, EmailCampaignCreateBodySchema, emailCampaignSchemas, EmailCampaignUpdateBodySchema2, PreviewRecipientsBodySchema } from "#schemas";
import { calculateRecipients, getAvailableTemplates, previewCampaignEmail, sendCampaignEmail } from "#utils/email";
import { logger } from "#utils/logger";
import { successPaginatedResponse, successResponse, validationErrorResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";
import { z } from "zod/v4";

const componentLogger = logger.child({ component: "admin/emailCampaigns" });

type EmailCampaignCreateBody = z.infer<typeof EmailCampaignCreateBodySchema>;
type PreviewRecipientsBody = z.infer<typeof PreviewRecipientsBodySchema>;
type EmailCampaignUpdateBody = z.infer<typeof EmailCampaignUpdateBodySchema2>;

const adminEmailCampaignsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	fastify.addHook("preHandler", requireAdmin);

	// List campaigns
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
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to list email campaigns" });
				throw error;
			} finally {
				span.end();
			}
		}
	);

	// Create campaign
	fastify.post<{
		Body: EmailCampaignCreateBody;
	}>(
		"/email-campaigns",
		{
			schema: emailCampaignSchemas.createEmailCampaign
		},
		async (request: FastifyRequest<{ Body: EmailCampaignCreateBody }>, reply: FastifyReply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.create");

			try {
				const { name, subject, content, targetAudience } = request.body;

				if (!content) {
					const { response, statusCode } = validationErrorResponse("必須提供郵件內容");
					return reply.code(statusCode).send(response);
				}

				const campaign = await prisma.emailCampaign.create({
					data: {
						userId: request.user?.id || "system",
						name,
						subject,
						content,
						recipientFilter: targetAudience ? JSON.stringify(targetAudience) : null,
						status: "draft"
					}
				});

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.status(201).send(successResponse(campaign, "郵件發送任務已建立"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to create email campaign" });
				throw error;
			} finally {
				span.end();
			}
		}
	);

	// Update campaign
	fastify.patch<{
		Params: { campaignId: string };
		Body: EmailCampaignUpdateBody;
	}>(
		"/email-campaigns/:campaignId",
		{
			schema: adminEmailCampaignSchemas.updateEmailCampaign
		},
		async (request: FastifyRequest<{ Params: { campaignId: string }; Body: EmailCampaignUpdateBody }>, reply: FastifyReply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.update");

			try {
				const { campaignId } = request.params;
				const { name, subject, content, targetAudience } = request.body;

				const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
				if (!campaign) {
					const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
					return reply.code(statusCode).send(response);
				}
				if (campaign.status !== "draft") {
					const { response, statusCode } = validationErrorResponse("只能修改草稿狀態的任務");
					return reply.code(statusCode).send(response);
				}

				const updated = await prisma.emailCampaign.update({
					where: { id: campaignId },
					data: {
						...(name !== undefined && { name }),
						...(subject !== undefined && { subject }),
						...(content !== undefined && { content }),
						...(targetAudience !== undefined && { recipientFilter: JSON.stringify(targetAudience) }),
						updatedAt: new Date()
					}
				});

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(updated, "郵件任務已更新"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to update email campaign" });
				throw error;
			} finally {
				span.end();
			}
		}
	);

	// Preview recipients without creating a campaign
	fastify.post<{
		Body: PreviewRecipientsBody;
	}>(
		"/email-campaigns/preview-recipients",
		{
			schema: adminEmailCampaignSchemas.previewRecipients
		},
		async (request: FastifyRequest<{ Body: PreviewRecipientsBody }>, reply: FastifyReply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.preview_recipients");

			try {
				const { targetAudience } = request.body;
				const recipients = await calculateRecipients(targetAudience || null);

				span.setAttribute("recipients.count", recipients.length);
				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(
					successResponse(
						{
							recipientCount: recipients.length,
							recipients: recipients.map(r => ({ email: r.email, id: r.id }))
						},
						"成功計算收件人數量"
					)
				);
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to preview recipients" });
				throw error;
			} finally {
				span.end();
			}
		}
	);

	// List email templates
	fastify.get(
		"/email-campaigns/templates",
		{
			schema: adminEmailCampaignSchemas.listTemplates
		},
		async (_request: FastifyRequest, reply: FastifyReply) => {
			try {
				const templates = await getAvailableTemplates();
				return reply.send(successResponse(templates, "取得模板列表成功"));
			} catch (error) {
				componentLogger.error({ error }, "Failed to list templates");
				throw error;
			}
		}
	);

	// Get campaign status (for progress polling)
	fastify.get<{
		Params: { campaignId: string };
	}>(
		"/email-campaigns/:campaignId/status",
		{
			schema: adminEmailCampaignSchemas.getEmailCampaignStatus
		},
		async (request: FastifyRequest<{ Params: { campaignId: string } }>, reply: FastifyReply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.get_status");

			try {
				const { campaignId } = request.params;
				const campaign = await prisma.emailCampaign.findUnique({
					where: { id: campaignId },
					include: { user: { select: { name: true, email: true } } }
				});

				if (!campaign) {
					const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
					return reply.code(statusCode).send(response);
				}

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(
					successResponse({
						id: campaign.id,
						name: campaign.name,
						status: campaign.status,
						sentCount: campaign.sentCount,
						failedCount: campaign.totalCount > 0 ? campaign.totalCount - campaign.sentCount : 0,
						totalRecipients: campaign.totalCount,
						sentAt: campaign.sentAt,
						createdAt: campaign.createdAt
					})
				);
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to get campaign status" });
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
			const span = tracer.startSpan("route.admin.email_campaigns.preview");

			try {
				const { campaignId } = request.params;
				const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });

				if (!campaign) {
					const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
					return reply.code(statusCode).send(response);
				}

				const { previewHtml, previewText } = await previewCampaignEmail(campaign);

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse({ campaignId, subject: campaign.subject, previewHtml, previewText }));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to preview email campaign" });
				throw error;
			} finally {
				span.end();
			}
		}
	);

	// Calculate recipient count for an existing campaign
	fastify.post<{
		Params: { campaignId: string };
	}>(
		"/email-campaigns/:campaignId/calculate-recipients",
		{
			schema: adminEmailCampaignSchemas.calculateRecipients
		},
		async (request: FastifyRequest<{ Params: { campaignId: string } }>, reply: FastifyReply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.calculate_recipients");

			try {
				const { campaignId } = request.params;
				const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });

				if (!campaign) {
					const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
					return reply.code(statusCode).send(response);
				}

				const recipients = await calculateRecipients(campaign.recipientFilter);
				span.setAttribute("recipients.count", recipients.length);
				span.setStatus({ code: SpanStatusCode.OK });

				return reply.send(
					successResponse(
						{
							campaignId,
							recipientCount: recipients.length,
							recipients: recipients.map(r => ({ email: r.email, id: r.id }))
						},
						"成功計算收件人數量"
					)
				);
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to calculate recipients" });
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
			const span = tracer.startSpan("route.admin.email_campaigns.send");

			try {
				const { campaignId } = request.params;

				const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });

				if (!campaign) {
					const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
					return reply.code(statusCode).send(response);
				}

				if (campaign.status === "sent") {
					const { response, statusCode } = validationErrorResponse("郵件任務已發送");
					return reply.code(statusCode).send(response);
				}

				if (campaign.status === "sending") {
					const { response, statusCode } = validationErrorResponse("郵件任務正在發送中");
					return reply.code(statusCode).send(response);
				}

				if (campaign.status === "cancelled") {
					const { response, statusCode } = validationErrorResponse("已取消的郵件任務無法發送");
					return reply.code(statusCode).send(response);
				}

				// Calculate recipients
				const recipients = await calculateRecipients(campaign.recipientFilter);

				if (recipients.length === 0) {
					const { response, statusCode } = validationErrorResponse("沒有符合條件的收件人");
					return reply.code(statusCode).send(response);
				}

				// Mark as sending and set total count
				await prisma.emailCampaign.update({
					where: { id: campaignId },
					data: { status: "sending", totalCount: recipients.length, sentCount: 0, updatedAt: new Date() }
				});

				// Reply immediately so the frontend can start polling
				reply.send(
					successResponse(
						{
							id: campaign.id,
							status: "sending",
							totalCount: recipients.length,
							sentCount: 0
						},
						"郵件發送已開始"
					)
				);

				// Send in background, updating progress periodically
				(async () => {
					try {
						const result = await sendCampaignEmail(campaign, recipients, async (sentCount, _failedCount) => {
							// Update sentCount in DB every batch for progress tracking
							await prisma.emailCampaign.update({
								where: { id: campaignId },
								data: { sentCount, updatedAt: new Date() }
							});
						});

						await prisma.emailCampaign.update({
							where: { id: campaignId },
							data: {
								status: "sent",
								sentCount: result.sentCount,
								totalCount: result.totalRecipients,
								sentAt: new Date(),
								updatedAt: new Date()
							}
						});

						componentLogger.info({ campaignId, sentCount: result.sentCount, totalRecipients: result.totalRecipients }, "Campaign email sending complete");
					} catch (error) {
						componentLogger.error({ error, campaignId }, "Campaign email sending failed");
						try {
							await prisma.emailCampaign.update({
								where: { id: campaignId },
								data: { status: "draft", updatedAt: new Date() }
							});
						} catch (updateError) {
							componentLogger.error({ error: updateError }, "Failed to reset campaign status after error");
						}
					}
				})();

				span.setStatus({ code: SpanStatusCode.OK });
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to send email campaign" });
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
			const span = tracer.startSpan("route.admin.email_campaigns.cancel");

			try {
				const { campaignId } = request.params;
				const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });

				if (!campaign) {
					const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
					return reply.code(statusCode).send(response);
				}

				if (campaign.status === "sent") {
					const { response, statusCode } = validationErrorResponse("已發送的郵件任務無法取消");
					return reply.code(statusCode).send(response);
				}

				if (campaign.status === "sending") {
					const { response, statusCode } = validationErrorResponse("發送中的郵件任務無法取消");
					return reply.code(statusCode).send(response);
				}

				const updatedCampaign = await prisma.emailCampaign.update({
					where: { id: campaignId },
					data: { status: "cancelled", updatedAt: new Date() }
				});

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(updatedCampaign, "郵件發送任務已取消"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to cancel email campaign" });
				throw error;
			} finally {
				span.end();
			}
		}
	);
};

export default adminEmailCampaignsRoutes;
