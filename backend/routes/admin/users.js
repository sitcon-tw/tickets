/**
 * @fileoverview Admin users routes with modular types and schemas
 * @typedef {import('#types/database.js').User} User
 * @typedef {import('#types/auth.js').AdminUserUpdateRequest} AdminUserUpdateRequest
 */

import prisma from "#config/database.js";
import { userSchemas } from "#schemas/user.js";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response.js";

/**
 * Admin users routes with modular schemas and types
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
export default async function adminUsersRoutes(fastify, options) {
	// List users
	fastify.get(
		"/users",
		{
			schema: userSchemas.listUsers
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Querystring: {role?: string, isActive?: boolean}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { role, isActive } = request.query;

				// Build where clause
				const where = {};
				if (role) where.role = role;
				if (isActive !== undefined) where.isActive = isActive;

				/** @type {User[]} */
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

				return reply.send(successResponse(users));
			} catch (error) {
				console.error("List users error:", error);
				const { response, statusCode } = serverErrorResponse("取得用戶列表失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Get user by ID
	fastify.get(
		"/users/:id",
		{
			schema: userSchemas.getUser
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;

				/** @type {User | null} */
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

				return reply.send(successResponse(user));
			} catch (error) {
				console.error("Get user error:", error);
				const { response, statusCode } = serverErrorResponse("取得用戶詳情失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);

	// Update user
	fastify.put(
		"/users/:id",
		{
			schema: userSchemas.updateUser
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Params: {id: string}, Body: AdminUserUpdateRequest}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { id } = request.params;
				/** @type {AdminUserUpdateRequest} */
				const updateData = request.body;

				// Check if user exists
				const existingUser = await prisma.user.findUnique({
					where: { id }
				});

				if (!existingUser) {
					const { response, statusCode } = notFoundResponse("用戶不存在");
					return reply.code(statusCode).send(response);
				}

				// Check for email conflicts
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

				// Validate role
				const validRoles = ["admin", "viewer"];
				if (updateData.role && !validRoles.includes(updateData.role)) {
					const { response, statusCode } = validationErrorResponse("無效的用戶角色");
					return reply.code(statusCode).send(response);
				}

				// Prepare update data
				const updatePayload = {
					...updateData,
					...(updateData.permissions && { permissions: JSON.stringify(updateData.permissions) }),
					updatedAt: new Date()
				};

				/** @type {User} */
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

				return reply.send(successResponse(user, "用戶更新成功"));
			} catch (error) {
				console.error("Update user error:", error);
				const { response, statusCode } = serverErrorResponse("更新用戶失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}
