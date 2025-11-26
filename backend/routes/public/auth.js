/**
 * @fileoverview Auth-related public routes
 */

import prisma from "#config/database.js";
import { requireAuth } from "#middleware/auth.js";
import { safeJsonParse } from "#utils/json.js";
import { serverErrorResponse, successResponse } from "#utils/response.js";

/**
 * Auth routes
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function authRoutes(fastify) {
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
		async (request, reply) => {
			if (!request.user || !request.user.id) return reply.send(successResponse({ role: "viewer", permissions: [], capabilities: {} }));
			try {
				const user = await prisma.user.findUnique({
					where: { id: request.user.id },
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

				// Determine capabilities based on role
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
			} catch (error) {
				request.log.error("Get permissions error:", error);
				const { response, statusCode } = serverErrorResponse("取得權限資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}
