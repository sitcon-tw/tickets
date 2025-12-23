import type { FastifyPluginAsync } from "fastify";

import prisma from "#config/database";
import { requireAdmin } from "#middleware/auth";
import { safeJsonParse } from "#utils/json";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";
import { userUpdateSchema, type UserUpdateRequest } from "@tickets/shared";

const adminUsersRoutes: FastifyPluginAsync = async fastify => {
	// List users - admin only
	fastify.get(
		"/users",
		{
			preHandler: requireAdmin,
			schema: {
				description: "List users",
				tags: ["admin/users"],
			},
		},
		async (request, reply) => {
			try {
				const { role, isActive } = request.query as { role?: string; isActive?: string };

				const where: any = {};
				if (role) where.role = role;
				if (isActive !== undefined) where.isActive = isActive === "true";

				const users = await prisma.user.findMany({
					where,
					select: {
						id: true,
						name: true,
						email: true,
						emailVerified: true,
						image: true,
						role: true,
						permissions: true,
						isActive: true,
						createdAt: true,
						updatedAt: true,
						_count: {
							select: {
								sessions: true,
								registrations: true
							}
						}
					},
					orderBy: { createdAt: "desc" }
				});

				const usersWithParsedPermissions = users.map(user => ({
					...user,
					permissions: safeJsonParse(user.permissions, [], "user permissions")
				}));

				return reply.send(successResponse(usersWithParsedPermissions));
			} catch (error) {
				console.error("List users error:", error);
				const { response, statusCode } = serverErrorResponse("取得用戶列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get user by ID - admin only
	fastify.get(
		"/users/:id",
		{
			preHandler: requireAdmin,
			schema: {
				description: "Get user by ID",
				tags: ["admin/users"],
			},
		},
		async (request, reply) => {
			try {
				const { id } = request.params as { id: string };

				const user = await prisma.user.findUnique({
					where: { id },
					select: {
						id: true,
						name: true,
						email: true,
						emailVerified: true,
						image: true,
						role: true,
						permissions: true,
						isActive: true,
						createdAt: true,
						updatedAt: true,
						registrations: {
							select: {
								id: true,
								status: true,
								event: {
									select: { name: true }
								}
							}
						},
						_count: {
							select: {
								sessions: true,
								registrations: true
							}
						}
					}
				});

				if (!user) {
					const { response, statusCode } = notFoundResponse("用戶不存在");
					return reply.code(statusCode).send(response);
				}

				const userWithParsedPermissions = {
					...user,
					permissions: safeJsonParse(user.permissions, [], "user permissions")
				};

				return reply.send(successResponse(userWithParsedPermissions));
			} catch (error) {
				console.error("Get user error:", error);
				const { response, statusCode } = serverErrorResponse("取得用戶詳情失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Update user - admin only
	fastify.put(
		"/users/:id",
		{
			preHandler: requireAdmin,
			schema: {
				description: "Update user",
				tags: ["admin/users"],
				body: userUpdateSchema,
			},
		},
		async (request, reply) => {
			try {
				const { id } = request.params as { id: string };
				const updateData = request.body as UserUpdateRequest;

				const existingUser = await prisma.user.findUnique({
					where: { id }
				});

				if (!existingUser) {
					const { response, statusCode } = notFoundResponse("用戶不存在");
					return reply.code(statusCode).send(response);
				}

				if (updateData.email && updateData.email !== existingUser.email) {
					const emailConflict = await prisma.user.findFirst({
						where: {
							email: updateData.email,
							id: { not: id }
						}
					});

					if (emailConflict) {
						const { response, statusCode } = conflictResponse("電子郵件已被使用");
						return reply.code(statusCode).send(response);
					}
				}

				const validRoles = ["admin", "viewer", "eventAdmin"];
				if (updateData.role && !validRoles.includes(updateData.role)) {
					const { response, statusCode } = validationErrorResponse("無效的用戶角色");
					return reply.code(statusCode).send(response);
				}

				const updatePayload: any = {
					...updateData,
					...(updateData.permissions && { permissions: JSON.stringify(updateData.permissions) }),
					updatedAt: new Date()
				};

				const user = await prisma.user.update({
					where: { id },
					data: updatePayload,
					select: {
						id: true,
						name: true,
						email: true,
						emailVerified: true,
						image: true,
						role: true,
						permissions: true,
						isActive: true,
						createdAt: true,
						updatedAt: true
					}
				});

				const userWithParsedPermissions = {
					...user,
					permissions: safeJsonParse(user.permissions, [], "user permissions")
				};

				return reply.send(successResponse(userWithParsedPermissions, "用戶更新成功"));
			} catch (error) {
				console.error("Update user error:", error);
				const { response, statusCode } = serverErrorResponse("更新用戶失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default adminUsersRoutes;
