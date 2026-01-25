/**
 * @fileoverview Auth-related public routes
 */

import prisma from "#config/database";
import { auth } from "#lib/auth";
import { tracer } from "#lib/tracing";
import { publicAuthSchemas } from "#schemas";
import { safeJsonParse } from "#utils/json";
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
							capabilities: {
								canManageUsers: false,
								canManageAllEvents: false,
								canViewAnalytics: false,
								canManageEmailCampaigns: false,
								canManageReferrals: false,
								canManageSmsLogs: false,
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
						permissions: true
					}
				});

				if (!user) {
					span.addEvent("auth.permissions.user_not_found");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "User not found" });
					const { response, statusCode } = serverErrorResponse("用戶不存在");
					return reply.code(statusCode).send(response);
				}

				const role = user.role || "viewer";
				const permissions = safeJsonParse(user.permissions, [], "user permissions");

				span.setAttribute("auth.user.role", role);
				span.setAttribute("auth.permissions.count", permissions.length);

				const capabilities = {
					canManageUsers: role === "admin",
					canManageAllEvents: role === "admin",
					canViewAnalytics: role === "admin",
					canManageEmailCampaigns: role === "admin",
					canManageReferrals: role === "admin",
					canManageSmsLogs: role === "admin",
					managedEventIds: role === "eventAdmin" ? permissions : []
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(
					successResponse({
						role,
						permissions,
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
