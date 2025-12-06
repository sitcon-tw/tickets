/**
 * @fileoverview Auth-related public routes
 */

import prisma from "#config/database";
import { auth } from "#lib/auth";
import { safeJsonParse } from "#utils/json";
import { serverErrorResponse, successResponse } from "#utils/response";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

/**
 * Auth routes
 */
const authRoutes: FastifyPluginAsync = async fastify => {
	/**
	 * GET /api/auth/permissions
	 * Get current user's permissions and capabilities
	 */
	fastify.get(
		"/auth/permissions",
		{
			schema: {
				description: "取得當前用戶的權限資訊",
				tags: ["auth"],
				response: {
					200: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							message: { type: "string" },
							data: {
								type: "object",
								properties: {
									role: { type: "string" },
									permissions: {
										type: "array",
										items: { type: "string" }
									},
									capabilities: {
										type: "object",
										properties: {
											canManageUsers: { type: "boolean" },
											canManageAllEvents: { type: "boolean" },
											canViewAnalytics: { type: "boolean" },
											canManageEmailCampaigns: { type: "boolean" },
											canManageReferrals: { type: "boolean" },
											canManageSmsLogs: { type: "boolean" },
											managedEventIds: {
												type: "array",
												items: { type: "string" }
											}
										}
									}
								}
							}
						}
					}
				}
			}
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			const session = await auth.api.getSession({
				headers: request.headers as any
			});

			console.log("[PERMISSIONS] Better Auth session user role:", session?.user?.role);

			if (!session?.user || !session.user.id) {
				console.log("[PERMISSIONS] No session found");
				return reply.send(successResponse({ role: "viewer", permissions: [], capabilities: {} }));
			}

			// Use role from Better Auth session (which now includes additionalFields)
			const role = (session.user as any).role || "viewer";
			const permissions = safeJsonParse((session.user as any).permissions, [], "user permissions");

			console.log("[PERMISSIONS] Using role from session:", role);

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
