import { errorResponse, successResponse } from "../../utils/response.js";

export default async function settingsRoutes(fastify, options) {
	// 獲取系統設定
	fastify.get(
		"/settings",
		{
			schema: {
				description: "獲取系統設定",
				tags: ["system"]
			}
		},
		async (request, reply) => {
			try {
				// TODO: Implement system settings retrieval
				return successResponse({
					siteName: "SITCON 報名系統",
					defaultTimezone: "Asia/Taipei",
					maxFileUploadSize: "10MB",
					allowedFileTypes: [".jpg", ".png", ".pdf", ".doc", ".docx"],
					emailConfig: {
						fromName: "SITCON 活動組",
						fromEmail: "noreply@sitcon.org",
						replyTo: "contact@sitcon.org"
					},
					registrationSettings: {
						sessionTimeout: 15,
						enableReferralSystem: true,
						enableEditModule: true,
						editTokenExpiry: 30
					}
				});
			} catch (error) {
				console.error("Get settings error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取系統設定失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 更新系統設定
	fastify.put(
		"/settings",
		{
			schema: {
				description: "更新系統設定",
				tags: ["system"]
			}
		},
		async (request, reply) => {
			try {
				const settings = request.body;

				// TODO: Implement system settings update
				return successResponse(settings, "系統設定更新成功");
			} catch (error) {
				console.error("Update settings error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新系統設定失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}