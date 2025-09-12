/**
 * @fileoverview Admin email campaigns routes with modular types and schemas
 * @typedef {import('#types/api.js').EmailCampaignCreateRequest} EmailCampaignCreateRequest
 * @typedef {import('#types/api.js').PaginationQuery} PaginationQuery
 */

import { 
	successResponse, 
	validationErrorResponse, 
	serverErrorResponse 
} from "#utils/response.js";
import { emailCampaignSchemas } from "#schemas/emailCampaign.js";

/**
 * Admin email campaigns routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {Object} options 
 */
export default async function adminEmailCampaignsRoutes(fastify, options) {
	// Get email campaigns with pagination
	fastify.get(
		"/email-campaigns",
		{
			schema: {
				...emailCampaignSchemas.listEmailCampaigns,
				description: "獲取郵件發送記錄",
				querystring: {
					type: 'object',
					properties: {
						...emailCampaignSchemas.listEmailCampaigns.querystring.properties,
						page: {
							type: 'integer',
							minimum: 1,
							default: 1,
							description: '頁碼'
						},
						limit: {
							type: 'integer',
							minimum: 1,
							maximum: 100,
							default: 20,
							description: '每頁筆數'
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

				// TODO: Implement email campaigns retrieval
				const campaigns = [];
				const total = 0;

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

				// TODO: Implement email campaign creation
				return reply.status(201).send(successResponse({ 
					id: 'temp-id', 
					name, 
					status: 'pending' 
				}, "郵件發送任務已建立"));
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
					type: 'object',
					properties: {
						campaignId: { 
							type: 'string',
							description: '活動 ID' 
						}
					},
					required: ['campaignId']
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

				// TODO: Implement email campaign status retrieval
				return reply.send(successResponse({
					id: campaignId,
					status: "pending",
					sentCount: 0,
					failedCount: 0,
					totalRecipients: 0
				}));
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
					type: 'object',
					properties: {
						campaignId: { 
							type: 'string',
							description: '活動 ID' 
						}
					},
					required: ['campaignId']
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

				// TODO: Implement email preview with template variables
				return reply.send(successResponse({
					campaignId,
					previewHtml: "<h1>預覽內容</h1>",
					previewText: "預覽內容"
				}));
			} catch (error) {
				console.error("Preview email campaign error:", error);
				const { response, statusCode } = serverErrorResponse("預覽郵件內容失敗");
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
					type: 'object',
					properties: {
						campaignId: { 
							type: 'string',
							description: '活動 ID' 
						}
					},
					required: ['campaignId']
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

				// TODO: Implement email campaign cancellation
				return reply.send(successResponse({ 
					id: campaignId, 
					status: 'cancelled' 
				}, "郵件發送任務已取消"));
			} catch (error) {
				console.error("Cancel email campaign error:", error);
				const { response, statusCode } = serverErrorResponse("取消郵件發送任務失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}
