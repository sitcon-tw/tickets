/**
 * @fileoverview Admin promotion routes - allows users to promote themselves to admin with a password
 */

import prisma from "#config/database.js";
import {
	successResponse,
	validationErrorResponse,
	unauthorizedResponse,
	serverErrorResponse
} from "#utils/response.js";
import { requireAuth } from "../../middleware/auth.js";

/**
 * Admin promotion routes
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
export default async function adminPromoteRoutes(fastify, options) {
	// Promote user to admin with password
	fastify.post(
		"/promote",
		{
			preHandler: requireAuth,
			schema: {
				description: "Promote current user to admin role with correct password",
				tags: ["registrations"],
				body: {
					type: "object",
					required: ["password"],
					properties: {
						password: { type: "string", description: "Admin promotion password" }
					}
				},
				response: {
					200: {
						description: "Successfully promoted to admin",
						type: "object",
						properties: {
							success: { type: "boolean" },
							message: { type: "string" },
							data: {
								type: "object",
								properties: {
									id: { type: "string" },
									name: { type: "string" },
									email: { type: "string" },
									role: { type: "string" }
								}
							}
						}
					},
					401: {
						description: "Invalid password",
						type: "object",
						properties: {
							success: { type: "boolean" },
							error: {
								type: "object",
								properties: {
									code: { type: "string" },
									message: { type: "string" }
								}
							}
						}
					}
				}
			}
		},
		/**
		 * @param {import('fastify').FastifyRequest<{Body: {password: string}}>} request
		 * @param {import('fastify').FastifyReply} reply
		 */
		async (request, reply) => {
			try {
				const { password } = request.body;
				const userId = request.user.id;

				// Get the admin promotion password from environment variable
				const ADMIN_PROMOTION_PASSWORD = process.env.ADMIN_PROMOTION_PASSWORD;

				// Validate password
				if (password !== ADMIN_PROMOTION_PASSWORD) {
					const { response, statusCode } = unauthorizedResponse("密碼錯誤");
					return reply.code(statusCode).send(response);
				}

				// Update user role to admin
				const updatedUser = await prisma.user.update({
					where: { id: userId },
					data: {
						role: "admin",
						updatedAt: new Date()
					},
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
						isActive: true,
						createdAt: true,
						updatedAt: true
					}
				});

				return reply.send(successResponse(updatedUser, "成功升級為管理員"));
			} catch (error) {
				console.error("Promote to admin error:", error);
				const { response, statusCode } = serverErrorResponse("升級為管理員失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
}
