/**
 * @fileoverview Auth-related public routes
 */

import prisma from "#config/database";
import { resolveAccess } from "#lib/access";
import { auth } from "#lib/auth";
import { tracer } from "#lib/tracing";
import { publicAuthSchemas } from "#schemas";
import { serverErrorResponse, successResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

/**
 * Auth routes
 */
const authRoutes: FastifyPluginAsync = async fastify => {
	/**
	 * GET /api/auth/permissions
	 * Get current user's permissions and capabilities
	 */
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/auth/permissions",
		{
			schema: publicAuthSchemas.getAuthPermissions
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.public.auth.get_permissions");

			try {
				const session = await auth.api.getSession({
					headers: request.headers
				});

				if (!session?.user || !session.user.id) {
					span.addEvent("auth.permissions.no_session");
					span.setAttribute("auth.authenticated", false);
					span.setStatus({ code: SpanStatusCode.OK });
					return reply.send(
						successResponse({
							role: "viewer",
							permissions: [],
							grantedPermissions: [],
							allEvents: false,
							capabilities: {
								canManageUsers: false,
								canManageAllEvents: false,
								canViewAnalytics: false,
								canManageEmailCampaigns: false,
								canManageReferrals: false,
								canManageSmsLogs: false,
								canManageSettings: false,
								canManageRoles: false,
								managedEventIds: []
							}
						})
					);
				}

				span.setAttribute("auth.authenticated", true);
				span.setAttribute("auth.user.id", session.user.id);

				const user = await prisma.user.findUnique({
					where: { id: session.user.id },
					select: {
						role: true,
						permissions: true,
						customRole: { select: { permissions: true, allEvents: true } }
					}
				});

				if (!user) {
					span.addEvent("auth.permissions.user_not_found");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "User not found" });
					const { response, statusCode } = serverErrorResponse("用戶不存在");
					return reply.code(statusCode).send(response);
				}

				const access = resolveAccess(user);
				const role = access.role;
				const grantedPermissions = [...access.permissions];

				span.setAttribute("auth.user.role", role);
				span.setAttribute("auth.permissions.count", grantedPermissions.length);

				const capabilities = {
					canManageUsers: access.permissions.has("users:view"),
					canManageAllEvents: access.allEvents,
					canViewAnalytics: access.permissions.has("dashboard:view"),
					canManageEmailCampaigns: access.permissions.has("emailCampaigns:view"),
					canManageReferrals: access.permissions.has("referrals:view"),
					canManageSmsLogs: access.permissions.has("smsLogs:view"),
					canManageSettings: access.permissions.has("settings:view"),
					canManageRoles: access.permissions.has("roles:view"),
					managedEventIds: access.allEvents ? [] : access.eventIds
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(
					successResponse({
						role,
						permissions: access.eventIds,
						grantedPermissions,
						allEvents: access.allEvents,
						capabilities
					})
				);
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to get permissions" });
				throw error;
			} finally {
				span.end();
			}
		}
	);
};

export default authRoutes;
