import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import prisma from "#config/database";
import type { Prisma } from "#prisma/generated/prisma/client";
import { missingPermissions, parsePermissionList } from "#lib/access";
import { tracer } from "#lib/tracing";
import { requirePermission } from "#middleware/auth";
import { userSchemas } from "#schemas";
import { safeJsonParse } from "#utils/json";
import { logger } from "#utils/logger";
import { conflictResponse, forbiddenResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";
import { BUILTIN_ROLE_PERMISSIONS, UserRoleSchema } from "@sitcontix/types";

const componentLogger = logger.child({ component: "admin/users" });

const adminUsersRoutes: FastifyPluginAsync = async fastify => {
	// List users
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/users",
		{
			preHandler: requirePermission("users:view"),
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

				const where: Prisma.UserWhereInput = {};
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
						roleId: true,
						customRole: { select: { id: true, name: true } },
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
					permissions: safeJsonParse<string[]>(user.permissions, [], "user permissions"),
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

	// Get user by ID
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/users/:id",
		{
			preHandler: requirePermission("users:view"),
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
						roleId: true,
						customRole: { select: { id: true, name: true } },
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
					permissions: safeJsonParse<string[]>(user.permissions, [], "user permissions"),
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

	// Update user
	fastify.withTypeProvider<ZodTypeProvider>().put(
		"/users/:id",
		{
			preHandler: requirePermission("users:update"),
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

				const actor = request.access!;

				// Prevent admins from locking themselves out by changing their own role or deactivating their own account
				const changesOwnRole = (updateData.role !== undefined && updateData.role !== existingUser.role) || (updateData.roleId !== undefined && updateData.roleId !== existingUser.roleId);
				if (request.user?.id === id && (changesOwnRole || updateData.isActive === false)) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = forbiddenResponse("無法變更自己的角色或停用自己的帳號");
					return reply.code(statusCode).send(response);
				}

				// Only full admins may touch admin accounts or hand out the admin role
				if (actor.role !== "admin" && (existingUser.role === "admin" || updateData.role === "admin")) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = forbiddenResponse("只有管理員可以修改管理員帳號或指派管理員角色");
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

				const validRoles = ["admin", "viewer", "eventAdmin", "custom"];
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

				// Work out the custom role the user ends up with (undefined = unchanged)
				const nextRole = updateData.role ?? existingUser.role;
				let nextRoleId: string | null | undefined;
				if (updateData.role !== undefined || updateData.roleId !== undefined) {
					nextRoleId = nextRole === "custom" ? (updateData.roleId ?? existingUser.roleId) : null;
				}

				// Nobody may hand out more access than they have themselves
				let grantedPermissions: readonly string[] = [];
				let grantsAllEvents = false;
				if (nextRole === "custom" && nextRoleId !== undefined) {
					const customRole = nextRoleId ? await prisma.role.findUnique({ where: { id: nextRoleId } }) : null;
					if (!customRole) {
						span.setStatus({ code: SpanStatusCode.OK });
						const { response, statusCode } = validationErrorResponse("請選擇有效的自訂角色");
						return reply.code(statusCode).send(response);
					}
					grantedPermissions = parsePermissionList(customRole.permissions);
					grantsAllEvents = customRole.allEvents;
				} else if (nextRole === "eventAdmin" && (updateData.role !== undefined || updateData.roleId !== undefined)) {
					grantedPermissions = BUILTIN_ROLE_PERMISSIONS.eventAdmin;
				}

				const missing = actor.role === "admin" ? [] : missingPermissions(actor, grantedPermissions);
				if (missing.length > 0 || (grantsAllEvents && !actor.allEvents)) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = forbiddenResponse("無法指派超出自己權限範圍的角色");
					return reply.code(statusCode).send(response);
				}

				if (updateData.permissions && !actor.allEvents && updateData.permissions.some(eventId => !actor.eventIds.includes(eventId))) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = forbiddenResponse("無法指派自己無權管理的活動");
					return reply.code(statusCode).send(response);
				}

				const { permissions, roleId: _roleId, ...restUpdateData } = updateData;
				const updatePayload: Prisma.UserUncheckedUpdateInput = {
					...restUpdateData,
					...(permissions && { permissions: JSON.stringify(permissions) }),
					...(nextRoleId !== undefined && { roleId: nextRoleId }),
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
						roleId: true,
						customRole: { select: { id: true, name: true } },
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
					permissions: safeJsonParse<string[]>(user.permissions, [], "user permissions"),
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
