import type { PaginationQuery } from "@sitcontix/types";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import prisma from "#config/database";
import { requireAdmin } from "#middleware/auth";
import { adminEmailCampaignSchemas, EmailCampaignCreateBodySchema, emailCampaignSchemas } from "#schemas";
import { calculateRecipients, sendCampaignEmail } from "#utils/email";
import { logger } from "#utils/logger";
import { serverErrorResponse, successPaginatedResponse, successResponse, validationErrorResponse } from "#utils/response";
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

			return reply.send(successPaginatedResponse(campaigns, "取得郵件發送記錄成功", pagination));
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
			const { name, subject, content, targetAudience, scheduledAt } = request.body;

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
					scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
					status: "draft"
				}
			});

			return reply.status(201).send(successResponse(campaign, "郵件發送任務已建立"));
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
			const { campaignId } = request.params;

			const campaign = await prisma.emailCampaign.findUnique({
				where: { id: campaignId },
				include: {
					user: {
						select: { name: true, email: true }
					}
				}
			});

			if (!campaign) {
				const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
				return reply.code(statusCode).send(response);
			}

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
			const { campaignId } = request.params;

			const campaign = await prisma.emailCampaign.findUnique({
				where: { id: campaignId }
			});

			if (!campaign) {
				const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
				return reply.code(statusCode).send(response);
			}

			let previewHtml = campaign.content;
			let previewText = campaign.content.replace(/<[^>]*>/g, "");

			const sampleRegistration = await prisma.registration.findFirst({
				include: {
					event: true,
					ticket: true
				}
			});

			if (sampleRegistration) {
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

			return reply.send(
				successResponse({
					campaignId,
					subject: campaign.subject,
					previewHtml,
					previewText
				})
			);
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
			const { campaignId } = request.params;

			const campaign = await prisma.emailCampaign.findUnique({
				where: { id: campaignId }
			});

			if (!campaign) {
				const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
				return reply.code(statusCode).send(response);
			}

			const recipients = await calculateRecipients(campaign.recipientFilter);

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
			const { campaignId } = request.params;
			const { sendNow = true } = request.body || {};

			const campaign = await prisma.emailCampaign.findUnique({
				where: { id: campaignId }
			});

			if (!campaign) {
				const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
				return reply.code(statusCode).send(response);
			}

			if (campaign.status === "sent") {
				const { response, statusCode } = validationErrorResponse("郵件任務已發送");
				return reply.code(statusCode).send(response);
			}

			if (campaign.status === "cancelled") {
				const { response, statusCode } = validationErrorResponse("已取消的郵件任務無法發送");
				return reply.code(statusCode).send(response);
			}

			if (!sendNow) {
				// Schedule for later - just update status
				await prisma.emailCampaign.update({
					where: { id: campaignId },
					data: {
						status: "scheduled",
						updatedAt: new Date()
					}
				});
				return reply.send(successResponse(campaign, "郵件已排程"));
			}

			// Calculate recipients
			const recipients = await calculateRecipients(campaign.recipientFilter);

			if (recipients.length === 0) {
				const { response, statusCode } = validationErrorResponse("沒有符合條件的收件人");
				return reply.code(statusCode).send(response);
			}

			await prisma.emailCampaign.update({
				where: { id: campaignId },
				data: {
					status: "sending",
					totalCount: recipients.length,
					updatedAt: new Date()
				}
			});

			try {
				// Send emails
				const result = await sendCampaignEmail(campaign, recipients);

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
			const { campaignId } = request.params;

			const campaign = await prisma.emailCampaign.findUnique({
				where: { id: campaignId }
			});

			if (!campaign) {
				const { response, statusCode } = validationErrorResponse("找不到指定的郵件發送任務");
				return reply.code(statusCode).send(response);
			}

			if (campaign.status === "sent") {
				const { response, statusCode } = validationErrorResponse("已發送的郵件任務無法取消");
				return reply.code(statusCode).send(response);
			}

			const updatedCampaign = await prisma.emailCampaign.update({
				where: { id: campaignId },
				data: {
					status: "cancelled",
					updatedAt: new Date()
				}
			});

			return reply.send(successResponse(updatedCampaign, "郵件發送任務已取消"));
		}
	);
};

export default adminEmailCampaignsRoutes;
