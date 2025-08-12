import { errorResponse, successResponse } from "../../utils/response.js";

export default async function registrationsRoutes(fastify, options) {
	// 提交報名表單
	fastify.post(
		"/registrations",
		{
			schema: {
				description: "提交報名表單",
				tags: ["registrations"]
			}
		},
		async (request, reply) => {
			try {
				const { eventId, ticketId, inviteCode, referralCode, formData, agreedToTerms, files } = request.body;

				if (!eventId || !ticketId || !formData || !agreedToTerms) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "必填欄位不完整");
					return reply.code(statusCode).send(response);
				}

				// TODO: Implement registration creation logic
				return successResponse({ message: "報名功能尚未實現" });
			} catch (error) {
				console.error("Registration submission error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "提交報名失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 表單預驗證
	fastify.post(
		"/registrations/validate",
		{
			schema: {
				description: "表單預驗證（即時驗證）",
				tags: ["registrations"]
			}
		},
		async (request, reply) => {
			try {
				const { ticketId, formData } = request.body;

				if (!ticketId || !formData) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "票種ID和表單資料為必填");
					return reply.code(statusCode).send(response);
				}

				// TODO: Implement form validation logic
				return successResponse({ isValid: true, errors: {} });
			} catch (error) {
				console.error("Registration validation error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "表單驗證失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 請求編輯連結
	fastify.post(
		"/registrations/request-edit",
		{
			schema: {
				description: "請求編輯連結（整合 Better Auth 的 email 驗證）",
				tags: ["registrations"]
			}
		},
		async (request, reply) => {
			try {
				const { email, orderNumber, identifyField = "orderNumber" } = request.body;

				if (!email) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "Email為必填欄位");
					return reply.code(statusCode).send(response);
				}

				// TODO: Implement edit request logic with Better Auth integration
				return successResponse({ message: "編輯連結已發送到您的信箱" });
			} catch (error) {
				console.error("Request edit error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "請求編輯連結失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 驗證編輯 token
	fastify.get(
		"/registrations/verify-edit",
		{
			schema: {
				description: "驗證編輯 token（Better Auth 驗證流程）",
				tags: ["registrations"]
			}
		},
		async (request, reply) => {
			try {
				const { token } = request.query;

				if (!token) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "驗證 token 為必填");
					return reply.code(statusCode).send(response);
				}

				// TODO: Implement token verification logic
				return successResponse({ isValid: true });
			} catch (error) {
				console.error("Verify edit token error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "驗證編輯 token 失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 透過驗證後進入編輯頁面
	fastify.get(
		"/registrations/edit/:token",
		{
			schema: {
				description: "透過驗證後進入編輯頁面",
				tags: ["registrations"]
			}
		},
		async (request, reply) => {
			try {
				const { token } = request.params;

				// TODO: Implement get registration data for editing
				return successResponse({ message: "編輯頁面資料載入功能尚未實現" });
			} catch (error) {
				console.error("Get edit registration error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "載入編輯頁面失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 提交編輯後的資料
	fastify.put(
		"/registrations/edit/:token",
		{
			schema: {
				description: "提交編輯後的資料",
				tags: ["registrations"]
			}
		},
		async (request, reply) => {
			try {
				const { token } = request.params;
				const { formData } = request.body;

				if (!formData) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "表單資料為必填");
					return reply.code(statusCode).send(response);
				}

				// TODO: Implement registration update logic
				return successResponse({ message: "報名資料更新成功" });
			} catch (error) {
				console.error("Update registration error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新報名資料失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 取消報名
	fastify.post(
		"/registrations/cancel/:token",
		{
			schema: {
				description: "取消報名",
				tags: ["registrations"]
			}
		},
		async (request, reply) => {
			try {
				const { token } = request.params;
				const { reason, confirmed } = request.body;

				if (!confirmed) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "請確認取消報名");
					return reply.code(statusCode).send(response);
				}

				// TODO: Implement registration cancellation logic
				return successResponse({ message: "報名已取消" });
			} catch (error) {
				console.error("Cancel registration error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取消報名失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 獲取專屬推薦連結
	fastify.get(
		"/registrations/:regId/referral-link",
		{
			schema: {
				description: "獲取專屬推薦連結",
				tags: ["referrals"]
			}
		},
		async (request, reply) => {
			try {
				const { regId } = request.params;

				// TODO: Implement referral link generation
				return successResponse({
					referralLink: `https://example.com/register?ref=${regId}`,
					referralCode: regId
				});
			} catch (error) {
				console.error("Get referral link error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取推薦連結失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 獲取個人推薦統計
	fastify.get(
		"/registrations/referral-stats/:regId",
		{
			schema: {
				description: "獲取個人推薦統計",
				tags: ["referrals"]
			}
		},
		async (request, reply) => {
			try {
				const { regId } = request.params;

				// TODO: Implement referral statistics logic
				return successResponse({
					totalReferrals: 0,
					successfulReferrals: 0,
					referralList: []
				});
			} catch (error) {
				console.error("Get referral stats error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取推薦統計失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}
