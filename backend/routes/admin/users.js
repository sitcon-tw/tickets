import prisma from "#config/database.js";
import { errorResponse, successResponse } from "#utils/response.js";

export default async function adminUsersRoutes(fastify, options) {	// 獲取當前用戶權限
	fastify.get(
		"/permissions",
		{
			schema: {
				description: "獲取當前用戶權限",
				tags: ["admin-users"]
			}
		},
		async (request, reply) => {
			try {
				const user = request.user;
				const permissions = user.permissions ? JSON.parse(user.permissions) : [];

				return successResponse({
					userId: user.id,
					role: user.role,
					permissions,
					isActive: user.isActive
				});
			} catch (error) {
				console.error("Get permissions error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得權限資訊失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 獲取管理員列表
	fastify.get(
		"/users",
		{
			schema: {
				description: "獲取管理員列表",
				tags: ["admin-users"]
			}
		},
		async (request, reply) => {
			try {
				const { page = 1, limit = 20 } = request.query;
				const skip = (page - 1) * limit;

				const [users, total] = await Promise.all([
					prisma.user.findMany({
						skip,
						take: parseInt(limit),
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
							isActive: true,
							createdAt: true,
							updatedAt: true
						},
						orderBy: { createdAt: "desc" }
					}),
					prisma.user.count()
				]);

				const pagination = {
					page: parseInt(page),
					limit: parseInt(limit),
					total,
					totalPages: Math.ceil(total / limit)
				};

				return successResponse(users, "取得管理員列表成功", pagination);
			} catch (error) {
				console.error("Get users error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得管理員列表失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 邀請新管理員
	fastify.post(
		"/users/invite",
		{
			schema: {
				description: "邀請新管理員（發送邀請信）",
				tags: ["admin-users"]
			}
		},
		async (request, reply) => {
			try {
				const { email, role = "viewer", permissions = [] } = request.body;

				if (!email || !["admin", "checkin", "viewer"].includes(role)) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "無效的 email 或角色");
					return reply.code(statusCode).send(response);
				}

				// TODO: Implement invitation email sending logic
				return successResponse({ message: "邀請信已發送" });
			} catch (error) {
				console.error("Invite user error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "邀請管理員失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 建立新管理員帳號
	fastify.post(
		"/users",
		{
			schema: {
				description: "建立新管理員帳號",
				tags: ["admin-users"]
			}
		},
		async (request, reply) => {
			try {
				const { name, email, role = "viewer", permissions = [] } = request.body;

				if (!name || !email || !["admin", "checkin", "viewer"].includes(role)) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "姓名、email 和有效角色為必填");
					return reply.code(statusCode).send(response);
				}

				// TODO: Implement user creation logic
				return successResponse({ message: "管理員帳號已建立" });
			} catch (error) {
				console.error("Create user error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "建立管理員帳號失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 更新管理員資訊
	fastify.put(
		"/users/:userId",
		{
			schema: {
				description: "更新管理員資訊",
				tags: ["admin-users"]
			}
		},
		async (request, reply) => {
			try {
				const { userId } = request.params;
				const { name, email } = request.body;

				// TODO: Implement user update logic
				return successResponse({ message: "管理員資訊已更新" });
			} catch (error) {
				console.error("Update user error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新管理員資訊失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 更新管理員角色
	fastify.put(
		"/users/:userId/role",
		{
			schema: {
				description: "更改管理員角色權限",
				tags: ["admin-users"]
			}
		},
		async (request, reply) => {
			try {
				const { userId } = request.params;
				const { role, permissions = [] } = request.body;

				if (!["admin", "checkin", "viewer"].includes(role)) {
					const { response, statusCode } = errorResponse("VALIDATION_ERROR", "無效的角色");
					return reply.code(statusCode).send(response);
				}

				const user = await prisma.user.update({
					where: { id: userId },
					data: {
						role,
						permissions: JSON.stringify(permissions),
						updatedAt: new Date()
					},
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
						permissions: true,
						isActive: true
					}
				});

				return successResponse(user, "更新管理員角色成功");
			} catch (error) {
				console.error("Update user role error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新管理員角色失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 啟用/停用管理員
	fastify.put(
		"/users/:userId/status",
		{
			schema: {
				description: "啟用/停用管理員帳號",
				tags: ["admin-users"]
			}
		},
		async (request, reply) => {
			try {
				const { userId } = request.params;
				const { isActive } = request.body;

				if (userId === request.user.id) {
					const { response, statusCode } = errorResponse("FORBIDDEN", "無法停用自己的帳號", null, 403);
					return reply.code(statusCode).send(response);
				}

				const user = await prisma.user.update({
					where: { id: userId },
					data: {
						isActive: Boolean(isActive),
						updatedAt: new Date()
					},
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
						isActive: true
					}
				});

				return successResponse(user, `${isActive ? "啟用" : "停用"}管理員成功`);
			} catch (error) {
				console.error("Update user status error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新管理員狀態失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// 刪除管理員
	fastify.delete(
		"/users/:userId",
		{
			schema: {
				description: "刪除管理員",
				tags: ["admin-users"]
			}
		},
		async (request, reply) => {
			try {
				const { userId } = request.params;

				if (userId === request.user.id) {
					const { response, statusCode } = errorResponse("FORBIDDEN", "無法刪除自己的帳號", null, 403);
					return reply.code(statusCode).send(response);
				}

				// TODO: Implement user deletion logic
				return successResponse({ message: "管理員已刪除" });
			} catch (error) {
				console.error("Delete user error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "刪除管理員失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}
