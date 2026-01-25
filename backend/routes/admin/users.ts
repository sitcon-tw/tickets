import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { requireAdmin } from "#middleware/auth";
import { userSchemas } from "#schemas";
import { safeJsonParse } from "#utils/json";
import { logger } from "#utils/logger";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";
import { UserRoleSchema } from "@sitcontix/types";

const componentLogger = logger.child({ component: "admin/users" });

const adminUsersRoutes: FastifyPluginAsync = async fastify => {
	// List users - admin only
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/users",
		{
			preHandler: requireAdmin,
			schema: userSchemas.listUsers
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.users.list", {
				attributes: {
					"user.filter.role": request.query.role || "all",
					"user.filter.isActive": request.query.isActive !== undefined ? request.query.isActive : "all"
				}
			});

			try {
				const { role, isActive } = request.query;

				const where: any = {};
				if (role) where.role = role;
				if (isActive !== undefined) where.isActive = isActive;

				span.addEvent("database.query.users");

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

				span.setAttribute("user.count", users.length);
				span.addEvent("users.transform");

				const usersWithParsedPermissions = users.map(user => ({
					...user,
					role: UserRoleSchema.parse(user.role),
					permissions: safeJsonParse(user.permissions, [], "user permissions"),
					phoneVerified: user.phoneVerified ?? false,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
					smsVerifications: user.smsVerifications?.map(sms => ({
						...sms,
						expiresAt: sms.expiresAt,
						createdAt: sms.createdAt,
						updatedAt: sms.updatedAt
					}))
				}));

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(usersWithParsedPermissions));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to list users"
				});
				componentLogger.error({ error }, "List users error");
				const { response, statusCode } = serverErrorResponse("取得用戶列表失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// Get user by ID - admin only
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/users/:id",
		{
			preHandler: requireAdmin,
			schema: userSchemas.getUser
		},
		async (request, reply) => {
			const { id } = request.params;
			const span = tracer.startSpan("route.admin.users.get", {
				attributes: {
					"user.id": id
				}
			});

			try {
				span.addEvent("database.query.user");

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
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = notFoundResponse("用戶不存在");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("user.role", user.role);
				span.setAttribute("user.registrations.count", user._count.registrations);
				span.setAttribute("user.sessions.count", user._count.sessions);

				const userWithParsedPermissions = {
					...user,
					role: UserRoleSchema.parse(user.role),
					permissions: safeJsonParse(user.permissions, [], "user permissions"),
					phoneVerified: user.phoneVerified ?? false,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(userWithParsedPermissions));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get user"
				});
				componentLogger.error({ error }, "Get user error");
				const { response, statusCode } = serverErrorResponse("取得用戶詳情失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// Update user - admin only
	fastify.withTypeProvider<ZodTypeProvider>().put(
		"/users/:id",
		{
			preHandler: requireAdmin,
			schema: userSchemas.updateUser
		},
		async (request, reply) => {
			const { id } = request.params;
			const updateData = request.body;

			const span = tracer.startSpan("route.admin.users.update", {
				attributes: {
					"user.id": id
				}
			});

			try {
				span.addEvent("database.query.existing_user");

				const existingUser = await prisma.user.findUnique({
					where: { id }
				});

				if (!existingUser) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = notFoundResponse("用戶不存在");
					return reply.code(statusCode).send(response);
				}

				if (updateData.email && updateData.email !== existingUser.email) {
					span.addEvent("database.check.email_conflict");

					const emailConflict = await prisma.user.findFirst({
						where: {
							email: updateData.email,
							id: { not: id }
						}
					});

					if (emailConflict) {
						span.setStatus({ code: SpanStatusCode.OK });
						const { response, statusCode } = conflictResponse("電子郵件已被使用");
						return reply.code(statusCode).send(response);
					}
				}

				const validRoles = ["admin", "viewer", "eventAdmin"];
				if (updateData.role && !validRoles.includes(updateData.role)) {
					span.setAttribute("validation.error", `Invalid role: ${updateData.role}`);
					span.setAttribute("validation.field", "role");
					span.setAttribute("validation.validRoles", validRoles.join(","));
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = validationErrorResponse("無效的用戶角色");
					return reply.code(statusCode).send(response);
				}

				if (updateData.role) {
					span.setAttribute("user.role.new", updateData.role);
				}

				const updatePayload: any = {
					...updateData,
					...(updateData.permissions && { permissions: JSON.stringify(updateData.permissions) }),
					updatedAt: new Date()
				};

				span.addEvent("database.update.user");

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
					role: UserRoleSchema.parse(user.role),
					permissions: safeJsonParse(user.permissions, [], "user permissions"),
					phoneVerified: user.phoneVerified ?? false,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(userWithParsedPermissions, "用戶更新成功"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to update user"
				});
				componentLogger.error({ error }, "Update user error");
				const { response, statusCode } = serverErrorResponse("更新用戶失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);
};

export default adminUsersRoutes;
