import { requireAdmin } from "../../middleware/auth.js";
import { errorResponse, successResponse } from "../../utils/response.js";

export default async function adminEmailCampaignsRoutes(fastify, options) {
	// Add auth middleware to all admin routes
	fastify.addHook("preHandler", requireAdmin);

	// 獲取郵件發送記錄
	fastify.get(
		"/email-campaigns",
		{
			schema: {
				description: "獲取郵件發送記錄",
				tags: ["admin-email-campaigns"]
			}
		},
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

				return successResponse(campaigns, "取得郵件發送記錄成功", pagination);
			} catch (error) {
				console.error("Get email campaigns error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得郵件發送記錄失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 建立新的郵件發送任務
	fastify.post(
		"/email-campaigns",
		{
			schema: {
				description: "建立新的郵件發送任務",
				tags: ["admin-email-campaigns"]
			}
		},
		async (request, reply) => {
			try {
				const { name, subject, htmlContent, textContent, recipients, scheduleTime, attachments } = request.body;

				if (!name || !subject || (!htmlContent && !textContent) || !recipients) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "名稱、主旨、內容和收件人為必填");
					return reply.code(statusCode).send(response);
				}

				// TODO: Implement email campaign creation
				return successResponse({ message: "郵件發送任務已建立" });
			} catch (error) {
				console.error("Create email campaign error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "建立郵件發送任務失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 獲取郵件發送狀態
	fastify.get(
		"/email-campaigns/:campaignId/status",
		{
			schema: {
				description: "獲取郵件發送狀態",
				tags: ["admin-email-campaigns"]
			}
		},
		async (request, reply) => {
			try {
				const { campaignId } = request.params;

				// TODO: Implement email campaign status retrieval
				return successResponse({
					status: "pending",
					sentCount: 0,
					failedCount: 0,
					totalRecipients: 0
				});
			} catch (error) {
				console.error("Get email campaign status error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得郵件發送狀態失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 預覽郵件內容
	fastify.post(
		"/email-campaigns/:campaignId/preview",
		{
			schema: {
				description: "預覽郵件內容",
				tags: ["admin-email-campaigns"]
			}
		},
		async (request, reply) => {
			try {
				const { campaignId } = request.params;
				const { recipientId, templateData } = request.body;

				// TODO: Implement email preview with template variables
				return successResponse({
					previewHtml: "<h1>預覽內容</h1>",
					previewText: "預覽內容"
				});
			} catch (error) {
				console.error("Preview email campaign error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "預覽郵件內容失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 取消郵件發送任務
	fastify.delete(
		"/email-campaigns/:campaignId",
		{
			schema: {
				description: "取消郵件發送任務",
				tags: ["admin-email-campaigns"]
			}
		},
		async (request, reply) => {
			try {
				const { campaignId } = request.params;

				// TODO: Implement email campaign cancellation
				return successResponse({ message: "郵件發送任務已取消" });
			} catch (error) {
				console.error("Cancel email campaign error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取消郵件發送任務失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}
