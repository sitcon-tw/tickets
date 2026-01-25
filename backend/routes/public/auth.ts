/**
 * @fileoverview Auth-related public routes
 */

import prisma from "#config/database";
import { auth } from "#lib/auth";
import { publicAuthSchemas } from "#schemas";
import { safeJsonParse } from "#utils/json";
import { serverErrorResponse, successResponse } from "#utils/response";
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
			const session = await auth.api.getSession({
				headers: request.headers
			});
			if (!session?.user || !session.user.id)
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

			const user = await prisma.user.findUnique({
				where: { id: session.user.id },
				select: {
					role: true,
					permissions: true
				}
			});

			if (!user) {
				const { response, statusCode } = serverErrorResponse("用戶不存在");
				return reply.code(statusCode).send(response);
			}

			const role = user.role || "viewer";
			const permissions = safeJsonParse(user.permissions, [], "user permissions");

			const capabilities = {
				canManageUsers: role === "admin",
				canManageAllEvents: role === "admin",
				canViewAnalytics: role === "admin",
				canManageEmailCampaigns: role === "admin",
				canManageReferrals: role === "admin",
				canManageSmsLogs: role === "admin",
				managedEventIds: role === "eventAdmin" ? permissions : []
			};

			return reply.send(
				successResponse({
					role,
					permissions,
					capabilities
				})
			);
		}
	);
};

export default authRoutes;
