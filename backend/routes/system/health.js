import { errorResponse, successResponse } from "../../utils/response.js";

export default async function healthRoutes(fastify, options) {
	// System health check (public)
	fastify.get(
		"/health",
		{
			schema: {
				description: "系統健康檢查",
				tags: ["system"],
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							data: {
								type: 'object',
								properties: {
									status: { type: 'string' },
									timestamp: { type: 'string', format: 'date-time' },
									version: { type: 'string' },
									uptime: { type: 'number' }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				return successResponse({
					status: "ok",
					timestamp: new Date().toISOString(),
					version: process.env.npm_package_version || "1.0.0",
					uptime: process.uptime()
				});
			} catch (error) {
				console.error("Health check error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "健康檢查失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);

	// System version info (public)
	fastify.get(
		"/version",
		{
			schema: {
				description: "獲取系統版本資訊",
				tags: ["system"],
				response: {
					200: {
						type: 'object',
						properties: {
							success: { type: 'boolean' },
							data: {
								type: 'object',
								properties: {
									version: { type: 'string' },
									buildDate: { type: 'string', format: 'date-time' },
									nodeVersion: { type: 'string' },
									environment: { type: 'string' }
								}
							}
						}
					}
				}
			}
		},
		async (request, reply) => {
			try {
				return successResponse({
					version: process.env.npm_package_version || "1.0.0",
					buildDate: process.env.BUILD_DATE || new Date().toISOString(),
					nodeVersion: process.version,
					environment: process.env.NODE_ENV || "development"
				});
			} catch (error) {
				console.error("Version info error:", error);
				const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取版本資訊失敗", null, 500);
				return reply.code(statusCode).send(response);
			}
		}
	);
}