import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import prisma from "#config/database";
import { missingPermissions, parsePermissionList, type AccessContext } from "#lib/access";
import { tracer } from "#lib/tracing";
import { requireAnyPermission, requirePermission } from "#middleware/auth";
import type { Prisma } from "#prisma/generated/prisma/client";
import { roleSchemas } from "#schemas";
import { logger } from "#utils/logger";
import { conflictResponse, forbiddenResponse, notFoundResponse, serverErrorResponse, successResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";
import type { Role } from "@sitcontix/types";

const componentLogger = logger.child({ component: "admin/roles" });

type RoleRow = Prisma.RoleGetPayload<{ include: { _count: { select: { users: true } } } }>;

const roleInclude = { _count: { select: { users: true } } } as const;

const serializeRole = (role: RoleRow): Role => ({
	id: role.id,
	name: role.name,
	description: role.description,
	permissions: parsePermissionList(role.permissions),
	allEvents: role.allEvents,
	userCount: role._count.users,
	createdAt: role.createdAt,
	updatedAt: role.updatedAt
});

/** Nobody may create or edit a role that grants more than they have themselves. */
const exceedsActorAccess = (actor: AccessContext, permissions: readonly string[], allEvents: boolean): boolean => {
	if (actor.role === "admin") return false;
	return missingPermissions(actor, permissions).length > 0 || (allEvents && !actor.allEvents);
};

const adminRolesRoutes: FastifyPluginAsync = async fastify => {
	// List roles. Also available to user managers, who need the list to assign roles.
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/roles",
		{
			preHandler: requireAnyPermission(["roles:view", "users:update"]),
			schema: roleSchemas.listRoles
		},
		async (_request, reply) => {
			const span = tracer.startSpan("route.admin.roles.list");

			try {
				const roles = await prisma.role.findMany({ include: roleInclude, orderBy: { createdAt: "asc" } });

				span.setAttribute("roles.count", roles.length);
				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(roles.map(serializeRole)));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to list roles" });
				componentLogger.error({ error }, "List roles error");
				const { response, statusCode } = serverErrorResponse("取得角色列表失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// Create role
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/roles",
		{
			preHandler: requirePermission("roles:manage"),
			schema: roleSchemas.createRole
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.admin.roles.create");

			try {
				const { name, description, permissions, allEvents = false } = request.body;
				const uniquePermissions = [...new Set(permissions)];

				if (exceedsActorAccess(request.access!, uniquePermissions, allEvents)) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = forbiddenResponse("無法建立超出自己權限範圍的角色");
					return reply.code(statusCode).send(response);
				}

				if (await prisma.role.findUnique({ where: { name }, select: { id: true } })) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = conflictResponse("角色名稱已被使用");
					return reply.code(statusCode).send(response);
				}

				const role = await prisma.role.create({
					data: { name, description: description || null, permissions: JSON.stringify(uniquePermissions), allEvents },
					include: roleInclude
				});

				span.setAttribute("role.id", role.id);
				span.setStatus({ code: SpanStatusCode.OK });
				return reply.code(201).send(successResponse(serializeRole(role), "角色建立成功"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to create role" });
				componentLogger.error({ error }, "Create role error");
				const { response, statusCode } = serverErrorResponse("建立角色失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// Update role
	fastify.withTypeProvider<ZodTypeProvider>().put(
		"/roles/:id",
		{
			preHandler: requirePermission("roles:manage"),
			schema: roleSchemas.updateRole
		},
		async (request, reply) => {
			const { id } = request.params;
			const span = tracer.startSpan("route.admin.roles.update", { attributes: { "role.id": id } });

			try {
				const existing = await prisma.role.findUnique({ where: { id } });
				if (!existing) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = notFoundResponse("角色不存在");
					return reply.code(statusCode).send(response);
				}

				const { name, description, permissions, allEvents } = request.body;
				const nextPermissions = permissions ? [...new Set(permissions)] : parsePermissionList(existing.permissions);
				const nextAllEvents = allEvents ?? existing.allEvents;

				// Both the current and the new grants must be within the editor's own access
				if (exceedsActorAccess(request.access!, [...parsePermissionList(existing.permissions), ...nextPermissions], existing.allEvents || nextAllEvents)) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = forbiddenResponse("無法編輯超出自己權限範圍的角色");
					return reply.code(statusCode).send(response);
				}

				if (name !== undefined && name !== existing.name && (await prisma.role.findUnique({ where: { name }, select: { id: true } }))) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = conflictResponse("角色名稱已被使用");
					return reply.code(statusCode).send(response);
				}

				const role = await prisma.role.update({
					where: { id },
					data: {
						...(name !== undefined && { name }),
						...(description !== undefined && { description: description || null }),
						...(permissions && { permissions: JSON.stringify(nextPermissions) }),
						...(allEvents !== undefined && { allEvents })
					},
					include: roleInclude
				});

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(serializeRole(role), "角色更新成功"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to update role" });
				componentLogger.error({ error }, "Update role error");
				const { response, statusCode } = serverErrorResponse("更新角色失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	// Delete role
	fastify.withTypeProvider<ZodTypeProvider>().delete(
		"/roles/:id",
		{
			preHandler: requirePermission("roles:manage"),
			schema: roleSchemas.deleteRole
		},
		async (request, reply) => {
			const { id } = request.params;
			const span = tracer.startSpan("route.admin.roles.delete", { attributes: { "role.id": id } });

			try {
				const existing = await prisma.role.findUnique({ where: { id }, include: roleInclude });
				if (!existing) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = notFoundResponse("角色不存在");
					return reply.code(statusCode).send(response);
				}

				if (exceedsActorAccess(request.access!, parsePermissionList(existing.permissions), existing.allEvents)) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = forbiddenResponse("無法刪除超出自己權限範圍的角色");
					return reply.code(statusCode).send(response);
				}

				if (existing._count.users > 0) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = conflictResponse(`仍有 ${existing._count.users} 位用戶使用此角色，請先變更他們的角色`);
					return reply.code(statusCode).send(response);
				}

				await prisma.role.delete({ where: { id } });

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(null, "角色刪除成功"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to delete role" });
				componentLogger.error({ error }, "Delete role error");
				const { response, statusCode } = serverErrorResponse("刪除角色失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);
};

export default adminRolesRoutes;
