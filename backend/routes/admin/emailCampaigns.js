/**
 * @fileoverview Admin email campaigns routes with modular types and schemas
 * @typedef {import('#types/api.js').EmailCampaignCreateRequest} EmailCampaignCreateRequest
 * @typedef {import('#types/api.js').PaginationQuery} PaginationQuery
 */

import prisma from "#config/database.js";
import { requireAdmin } from "#middleware/auth.js";
import { emailCampaignSchemas } from "#schemas/emailCampaign.js";
import { calculateRecipients, sendCampaignEmail } from "#utils/email.js";
import { serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response.js";

/**
 * Admin email campaigns routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
export default async function adminEmailCampaignsRoutes(fastify, options) {
	// Email campaigns are admin-only
	fastify.addHook("preHandler", requireAdmin);
	// Get email campaigns with pagination
	fastify.get(
		"/email-campaigns",
		{
			schema: {
				...emailCampaignSchemas.listEmailCampaigns,
				description: "獲取郵件發送記錄",
				querystring: {
					type: "object",
					properties: {
						...emailCampaignSchemas.listEmailCampaigns.querystring.properties,
						page: {
							type: "integer",
							minimum: 1,
							default: 1,
							description: "頁碼"
						},
						limit: {
							type: "integer",
							minimum: 1,
							maximum: 100,
							default: 20,
							description: "每頁筆數"
						}
					}
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Querystring: PaginationQuery}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
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
					page: parseInt(page),
					limit: parseInt(limit),
					total,
					totalPages: Math.ceil(total / limit)
				};

				return reply.send(successResponse(campaigns, "取得郵件發送記錄成功", pagination));
			} catch (error) {
				console.error("Get email campaigns error:", error);
				const { response, statusCode } = serverErrorResponse("取得郵件發送記錄失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Create email campaign
	fastify.post(
		"/email-campaigns",
		{
			schema: emailCampaignSchemas.createEmailCampaign
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Body: EmailCampaignCreateRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				/** @type {EmailCampaignCreateRequest} */
				const { name, subject, content, eventId, targetAudience, scheduledAt } = request.body;

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
			} catch (error) {
				console.error("Create email campaign error:", error);
				const { response, statusCode } = serverErrorResponse("建立郵件發送任務失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get email campaign status
	fastify.get(
		"/email-campaigns/:campaignId/status",
		{
			schema: {
				description: "獲取郵件發送狀態",
				tags: ["admin/email-campaigns"],
				params: {
					type: "object",
					properties: {
						campaignId: {
							type: "string",
							description: "活動 ID"
						}
					},
					required: ["campaignId"]
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {campaignId: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
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
			} catch (error) {
				console.error("Get email campaign status error:", error);
				const { response, statusCode } = serverErrorResponse("取得郵件發送狀態失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Preview email content
	fastify.post(
		"/email-campaigns/:campaignId/preview",
		{
			schema: {
				description: "預覽郵件內容",
				tags: ["admin/email-campaigns"],
				params: {
					type: "object",
					properties: {
						campaignId: {
							type: "string",
							description: "活動 ID"
						}
					},
					required: ["campaignId"]
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {campaignId: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
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
						.replace(/{{eventName}}/g, sampleRegistration.event.name)
						.replace(/{{ticketName}}/g, sampleRegistration.ticket.name);

					previewText = previewText
						.replace(/{{name}}/g, formData.name || "Sample User")
						.replace(/{{email}}/g, sampleRegistration.email)
						.replace(/{{eventName}}/g, sampleRegistration.event.name)
						.replace(/{{ticketName}}/g, sampleRegistration.ticket.name);
				}

				return reply.send(
					successResponse({
						campaignId,
						subject: campaign.subject,
						previewHtml,
						previewText
					})
				);
			} catch (error) {
				console.error("Preview email campaign error:", error);
				const { response, statusCode } = serverErrorResponse("預覽郵件內容失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Calculate recipient count
	fastify.post(
		"/email-campaigns/:campaignId/calculate-recipients",
		{
			schema: {
				description: "計算收件人數量",
				tags: ["admin/email-campaigns"],
				params: {
					type: "object",
					properties: {
						campaignId: {
							type: "string",
							description: "活動 ID"
						}
					},
					required: ["campaignId"]
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {campaignId: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
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
			} catch (error) {
				console.error("Calculate recipients error:", error);
				const { response, statusCode } = serverErrorResponse("計算收件人數量失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Send email campaign
	fastify.post(
		"/email-campaigns/:campaignId/send",
		{
			schema: {
				description: "發送郵件",
				tags: ["admin/email-campaigns"],
				params: {
					type: "object",
					properties: {
						campaignId: {
							type: "string",
							description: "活動 ID"
						}
					},
					required: ["campaignId"]
				},
				body: {
					type: "object",
					properties: {
						sendNow: {
							type: "boolean",
							description: "是否立即發送",
							default: true
						}
					}
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {campaignId: string}, Body: {sendNow?: boolean}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
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

				// Update status to sending
				await prisma.emailCampaign.update({
					where: { id: campaignId },
					data: {
						status: "sending",
						totalCount: recipients.length,
						updatedAt: new Date()
					}
				});

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
				console.error("Send email campaign error:", error);

				// Update campaign status to failed
				try {
					await prisma.emailCampaign.update({
						where: { id: request.params.campaignId },
						data: {
							status: "draft",
							updatedAt: new Date()
						}
					});
				} catch (updateError) {
					console.error("Failed to update campaign status:", updateError);
				}

				const { response, statusCode } = serverErrorResponse("發送郵件失敗：" + error.message);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Cancel email campaign
	fastify.delete(
		"/email-campaigns/:campaignId",
		{
			schema: {
				description: "取消郵件發送任務",
				tags: ["admin/email-campaigns"],
				params: {
					type: "object",
					properties: {
						campaignId: {
							type: "string",
							description: "活動 ID"
						}
					},
					required: ["campaignId"]
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {campaignId: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
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
			} catch (error) {
				console.error("Cancel email campaign error:", error);
				const { response, statusCode } = serverErrorResponse("取消郵件發送任務失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}
