import { requireAdmin } from "../middleware/auth.js";
import { errorResponse, successResponse } from "../utils/response.js";

export default async function systemRoutes(fastify, options) {
	// System health check (public)
	fastify.get(
		"/health",
		{
			schema: {
				description: "系統健康檢查",
				tags: ["system"]
			}
		},
		async (request, reply) => {
			try {
				return successResponse({
					status: "ok",
					timestamp: new Date().toISOString(),
					version: process.env.npm_package_version || "1.0.0",
					uptime: process.uptime()
				});
			} catch (error) {
				console.error("Health check error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "健康檢查失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// System version info (public)
	fastify.get(
		"/version",
		{
			schema: {
				description: "獲取系統版本資訊",
				tags: ["system"]
			}
		},
		async (request, reply) => {
			try {
				return successResponse({
					version: process.env.npm_package_version || "1.0.0",
					buildDate: process.env.BUILD_DATE || new Date().toISOString(),
					nodeVersion: process.version,
					environment: process.env.NODE_ENV || "development"
				});
			} catch (error) {
				console.error("Version info error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取版本資訊失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Protected admin-only routes below
	fastify.register(async function (fastify) {
		fastify.addHook("preHandler", requireAdmin);

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

		// 系統檔案上傳
		fastify.post(
			"/files/upload",
			{
				schema: {
					description: "系統檔案上傳",
					tags: ["system"]
				}
			},
			async (request, reply) => {
				try {
					// TODO: Implement system file upload
					return successResponse({ fileId: "uploaded_file_id" });
				} catch (error) {
					console.error("System file upload error:", error);
					const { response, statusCode } = errorResponse("INTERNAL_ERROR", "系統檔案上傳失敗", null, 500);
					return reply.code(statusCode).send(response);
				}
			}
		);

		// 獲取檔案
		fastify.get(
			"/files/:fileId",
			{
				schema: {
					description: "獲取檔案",
					tags: ["system"]
				}
			},
			async (request, reply) => {
				try {
					const { fileId } = request.params;

					// TODO: Implement file retrieval
					return successResponse({ message: "檔案獲取功能尚未實現" });
				} catch (error) {
					console.error("Get file error:", error);
					const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取檔案失敗", null, 500);
					return reply.code(statusCode).send(response);
				}
			}
		);

		// 刪除檔案
		fastify.delete(
			"/files/:fileId",
			{
				schema: {
					description: "刪除檔案",
					tags: ["system"]
				}
			},
			async (request, reply) => {
				try {
					const { fileId } = request.params;

					// TODO: Implement file deletion
					return successResponse({ message: "檔案已刪除" });
				} catch (error) {
					console.error("Delete file error:", error);
					const { response, statusCode } = errorResponse("INTERNAL_ERROR", "刪除檔案失敗", null, 500);
					return reply.code(statusCode).send(response);
				}
			}
		);
	});
}
