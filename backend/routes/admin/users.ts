import type { AdminUserUpdateRequest } from "@sitcontix/types";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import prisma from "#config/database";
import { logger } from "#utils/logger";
import { requireAdmin } from "#middleware/auth";
import { userSchemas } from "#schemas";
import { safeJsonParse } from "#utils/json";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";

const componentLogger = logger.child({ component: "admin/users" });

const adminUsersRoutes: FastifyPluginAsync = async fastify => {
	// List users - admin only
	fastify.get<{ Querystring: { role?: string; isActive?: boolean } }>(
		"/users",
		{
			preHandler: requireAdmin,
			schema: userSchemas.listUsers
		},
		async (request: FastifyRequest<{ Querystring: { role?: string; isActive?: boolean } }>, reply: FastifyReply) => {
			try {
				const { role, isActive } = request.query;

				const where: any = {};
				if (role) where.role = role;
				if (isActive !== undefined) where.isActive = isActive;

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
						phoneNumber: true,
						phoneVerified: true,
						createdAt: true,
						updatedAt: true,
						smsVerifications: true
					},
					orderBy: { createdAt: "desc" }
				});

				const usersWithParsedPermissions = users.map(user => ({
					...user,
					permissions: safeJsonParse(user.permissions, [], "user permissions"),
					phoneVerified: user.phoneVerified ?? false,
					createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
					updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
					smsVerifications: user.smsVerifications?.map(sms => ({
						...sms,
						expiresAt: sms.expiresAt instanceof Date ? sms.expiresAt.toISOString() : sms.expiresAt,
						createdAt: sms.createdAt instanceof Date ? sms.createdAt.toISOString() : sms.createdAt,
						updatedAt: sms.updatedAt instanceof Date ? sms.updatedAt.toISOString() : sms.updatedAt
					}))
				}));

				return reply.send(successResponse(usersWithParsedPermissions));
			} catch (error) {
				componentLogger.error({ error }, "List users error");
				const { response, statusCode } = serverErrorResponse("取得用戶列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get user by ID - admin only
	fastify.get<{ Params: { id: string } }>(
		"/users/:id",
		{
			preHandler: requireAdmin,
			schema: userSchemas.getUser
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;

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
						phoneNumber: true,
						phoneVerified: true,
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
					permissions: safeJsonParse(user.permissions, [], "user permissions"),
					phoneVerified: user.phoneVerified ?? false,
					createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
					updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt
				};

				return reply.send(successResponse(userWithParsedPermissions));
			} catch (error) {
				componentLogger.error({ error }, "Get user error");
				const { response, statusCode } = serverErrorResponse("取得用戶詳情失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Update user - admin only
	fastify.put<{ Params: { id: string }; Body: AdminUserUpdateRequest }>(
		"/users/:id",
		{
			preHandler: requireAdmin,
			schema: userSchemas.updateUser
		},
		async (request: FastifyRequest<{ Params: { id: string }; Body: AdminUserUpdateRequest }>, reply: FastifyReply) => {
			try {
				const { id } = request.params;
				const updateData = request.body;

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
						phoneNumber: true,
						phoneVerified: true,
						createdAt: true,
						updatedAt: true
					}
				});

				const userWithParsedPermissions = {
					...user,
					permissions: safeJsonParse(user.permissions, [], "user permissions"),
					phoneVerified: user.phoneVerified ?? false,
					createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
					updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt
				};

				return reply.send(successResponse(userWithParsedPermissions, "用戶更新成功"));
			} catch (error) {
				componentLogger.error({ error }, "Update user error");
				const { response, statusCode } = serverErrorResponse("更新用戶失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default adminUsersRoutes;
