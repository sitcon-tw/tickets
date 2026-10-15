import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import prisma from "#config/database";
import type { Prisma } from "#prisma/generated/prisma/client";
import { tracer } from "#lib/tracing";
import { requirePermission } from "#middleware/auth";
import { emailCampaignSchemas } from "#schemas";
import { calculateRecipients, getAvailableTemplates, InvalidRecipientFilterError, parseRecipientFilter, previewCampaignEmail, sendCampaignEmail } from "#utils/email";
import { logger } from "#utils/logger";
import { createPagination, notFoundResponse, successPaginatedResponse, successResponse, validationErrorResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";
import { EmailCampaignStatusSchema, type AdminEmailCampaign, type TargetAudience } from "@sitcontix/types";

const componentLogger = logger.child({ component: "admin/emailCampaigns" });

type EmailCampaignRow = Prisma.EmailCampaignGetPayload<{ include: { user: { select: { name: true; email: true } } } }> | Prisma.EmailCampaignGetPayload<object>;

/** Map a stored campaign to the admin API shape; the recipient filter is exposed as the parsed target audience */
const toAdminEmailCampaign = (campaign: EmailCampaignRow): AdminEmailCampaign => {
	let targetAudience: TargetAudience | undefined;
	try {
		targetAudience = parseRecipientFilter(campaign.recipientFilter) ?? undefined;
	} catch (error) {
		if (!(error instanceof InvalidRecipientFilterError)) throw error;
		componentLogger.warn({ campaignId: campaign.id }, "Campaign has an invalid recipient filter");
	}

	return {
		id: campaign.id,
		userId: campaign.userId,
		name: campaign.name,
		subject: campaign.subject,
		content: campaign.content,
		recipientFilter: campaign.recipientFilter,
		status: EmailCampaignStatusSchema.catch("draft").parse(campaign.status),
		sentCount: campaign.sentCount,
		totalCount: campaign.totalCount,
		scheduledAt: campaign.scheduledAt,
		sentAt: campaign.sentAt,
		createdAt: campaign.createdAt,
		updatedAt: campaign.updatedAt,
		createdBy: campaign.userId,
		targetAudience,
		...("user" in campaign && campaign.user && { user: { name: campaign.user.name, email: campaign.user.email } })
	};
};

const invalidFilterResponse = () => validationErrorResponse("郵件任務的收件人篩選條件無效");

const adminEmailCampaignsRoutes: FastifyPluginAsync = async (fastify, _options) => {
	// List campaigns
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/email-campaigns",
		{
			preHandler: requirePermission("emailCampaigns:view"),
			schema: emailCampaignSchemas.listEmailCampaigns
		},
		async (request, reply) => {
			const { page, limit, status, eventId } = request.query;
			const span = tracer.startSpan("route.admin.email_campaigns.list", {
				attributes: {
					"pagination.page": page,
					"pagination.limit": limit
				}
			});

			try {
				const where: Prisma.EmailCampaignWhereInput = {
					...(status && { status }),
					// Campaigns have no event column; the event they target lives in the stored filter's `eventIds` (cuids, so the quoted match is exact)
					...(eventId && { recipientFilter: { contains: JSON.stringify(eventId) } })
				};

				const [campaigns, total] = await Promise.all([
					prisma.emailCampaign.findMany({
						where,
						skip: (page - 1) * limit,
						take: limit,
						include: {
							user: {
								select: { name: true, email: true }
							}
						},
						orderBy: { createdAt: "desc" }
					}),
					prisma.emailCampaign.count({ where })
				]);

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successPaginatedResponse(campaigns.map(toAdminEmailCampaign), "取得郵件發送記錄成功", createPagination(page, limit, total)));
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
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/email-campaigns",
		{
			preHandler: requirePermission("emailCampaigns:create"),
			schema: emailCampaignSchemas.createEmailCampaign
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.create");

			try {
				const { name, subject, content, targetAudience, recipientFilter: rawRecipientFilter, scheduledAt } = request.body;

				// `targetAudience` wins; a raw `recipientFilter` string must itself be a valid target audience
				let audience: TargetAudience | null = targetAudience ?? null;
				if (!targetAudience && rawRecipientFilter) {
					try {
						audience = parseRecipientFilter(rawRecipientFilter);
					} catch (error) {
						if (!(error instanceof InvalidRecipientFilterError)) throw error;
						const { response, statusCode } = invalidFilterResponse();
						return reply.code(statusCode).send(response);
					}
				}

				const recipientFilter = audience ? JSON.stringify(audience) : null;

				// Pre-calculate recipient count so the list shows it immediately for drafts
				let totalCount = 0;
				try {
					const recipients = await calculateRecipients(audience);
					totalCount = recipients.length;
				} catch (error) {
					// Non-fatal
					componentLogger.warn({ error }, "Failed to pre-calculate campaign recipients");
				}

				const campaign = await prisma.emailCampaign.create({
					data: {
						userId: request.user?.id || "system",
						name,
						subject,
						content,
						recipientFilter,
						totalCount,
						scheduledAt: scheduledAt ?? null,
						status: "draft"
					}
				});

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.status(201).send(successResponse(toAdminEmailCampaign(campaign), "郵件發送任務已建立"));
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
	fastify.withTypeProvider<ZodTypeProvider>().patch(
		"/email-campaigns/:campaignId",
		{
			preHandler: requirePermission("emailCampaigns:update"),
			schema: emailCampaignSchemas.updateEmailCampaign
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.update");

			try {
				const { campaignId } = request.params;
				const { name, subject, content, targetAudience, recipientFilter: rawRecipientFilter, scheduledAt } = request.body;

				const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
				if (!campaign) {
					const { response, statusCode } = notFoundResponse("找不到指定的郵件發送任務");
					return reply.code(statusCode).send(response);
				}
				if (campaign.status !== "draft") {
					const { response, statusCode } = validationErrorResponse("只能修改草稿狀態的任務");
					return reply.code(statusCode).send(response);
				}

				let audience: TargetAudience | null | undefined = targetAudience;
				if (audience === undefined && rawRecipientFilter !== undefined) {
					try {
						audience = parseRecipientFilter(rawRecipientFilter);
					} catch (error) {
						if (!(error instanceof InvalidRecipientFilterError)) throw error;
						const { response, statusCode } = invalidFilterResponse();
						return reply.code(statusCode).send(response);
					}
				}

				let newTotalCount: number | undefined;
				if (audience !== undefined) {
					try {
						const recipients = await calculateRecipients(audience);
						newTotalCount = recipients.length;
					} catch (error) {
						// Non-fatal
						componentLogger.warn({ error, campaignId }, "Failed to recalculate campaign recipients");
					}
				}

				const updated = await prisma.emailCampaign.update({
					where: { id: campaignId },
					data: {
						...(name !== undefined && { name }),
						...(subject !== undefined && { subject }),
						...(content !== undefined && { content }),
						...(audience !== undefined && { recipientFilter: audience ? JSON.stringify(audience) : null }),
						...(newTotalCount !== undefined && { totalCount: newTotalCount }),
						// null clears the schedule
						...(scheduledAt !== undefined && { scheduledAt }),
						updatedAt: new Date()
					}
				});

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(toAdminEmailCampaign(updated), "郵件任務已更新"));
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
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/email-campaigns/preview-recipients",
		{
			preHandler: requirePermission("emailCampaigns:view"),
			schema: emailCampaignSchemas.previewRecipients
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.preview_recipients");

			try {
				const { targetAudience } = request.body;
				const recipients = await calculateRecipients(targetAudience ?? null);

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
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/email-campaigns/templates",
		{
			preHandler: requirePermission("emailCampaigns:view"),
			schema: emailCampaignSchemas.listTemplates
		},
		async (_request, reply) => {
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
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/email-campaigns/:campaignId/status",
		{
			preHandler: requirePermission("emailCampaigns:view"),
			schema: emailCampaignSchemas.getEmailCampaignStatus
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.get_status");

			try {
				const { campaignId } = request.params;
				const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });

				if (!campaign) {
					const { response, statusCode } = notFoundResponse("找不到指定的郵件發送任務");
					return reply.code(statusCode).send(response);
				}

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(
					successResponse({
						id: campaign.id,
						status: EmailCampaignStatusSchema.catch("draft").parse(campaign.status),
						sentCount: campaign.sentCount,
						failedCount: Math.max(0, campaign.totalCount - campaign.sentCount),
						totalRecipients: campaign.totalCount
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
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/email-campaigns/:campaignId/preview",
		{
			preHandler: requirePermission("emailCampaigns:view"),
			schema: emailCampaignSchemas.previewEmailCampaign
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.preview");

			try {
				const { campaignId } = request.params;
				const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });

				if (!campaign) {
					const { response, statusCode } = notFoundResponse("找不到指定的郵件發送任務");
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
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/email-campaigns/:campaignId/calculate-recipients",
		{
			preHandler: requirePermission("emailCampaigns:view"),
			schema: emailCampaignSchemas.calculateRecipients
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.calculate_recipients");

			try {
				const { campaignId } = request.params;
				const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });

				if (!campaign) {
					const { response, statusCode } = notFoundResponse("找不到指定的郵件發送任務");
					return reply.code(statusCode).send(response);
				}

				const recipients = await calculateRecipients(parseRecipientFilter(campaign.recipientFilter));
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
				if (error instanceof InvalidRecipientFilterError) {
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Invalid recipient filter" });
					const { response, statusCode } = invalidFilterResponse();
					return reply.code(statusCode).send(response);
				}
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to calculate recipients" });
				throw error;
			} finally {
				span.end();
			}
		}
	);

	// Send email campaign
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/email-campaigns/:campaignId/send",
		{
			preHandler: requirePermission("emailCampaigns:send"),
			schema: emailCampaignSchemas.sendEmailCampaign
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.send");

			try {
				const { campaignId } = request.params;
				const { sendNow, scheduledAt } = request.body;

				// There is no scheduler yet, so a campaign can only be sent right away
				if (!sendNow && scheduledAt) {
					const { response, statusCode } = validationErrorResponse("目前尚不支援排程發送");
					return reply.code(statusCode).send(response);
				}

				const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });

				if (!campaign) {
					const { response, statusCode } = notFoundResponse("找不到指定的郵件發送任務");
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
				let audience: TargetAudience | null;
				try {
					audience = parseRecipientFilter(campaign.recipientFilter);
				} catch (error) {
					if (!(error instanceof InvalidRecipientFilterError)) throw error;
					const { response, statusCode } = invalidFilterResponse();
					return reply.code(statusCode).send(response);
				}
				const recipients = await calculateRecipients(audience);

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
							status: "sending" as const,
							totalCount: recipients.length,
							sentCount: 0
						},
						"郵件發送已開始"
					)
				);

				// Send in background, updating progress periodically
				void (async () => {
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
				return reply;
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
	fastify.withTypeProvider<ZodTypeProvider>().delete(
		"/email-campaigns/:campaignId",
		{
			preHandler: requirePermission("emailCampaigns:delete"),
			schema: emailCampaignSchemas.cancelEmailCampaign
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.email_campaigns.cancel");

			try {
				const { campaignId } = request.params;
				const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });

				if (!campaign) {
					const { response, statusCode } = notFoundResponse("找不到指定的郵件發送任務");
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
				return reply.send(successResponse(toAdminEmailCampaign(updatedCampaign), "郵件發送任務已取消"));
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
