import { auth } from "../lib/auth.js";
import { forbiddenResponse, unauthorizedResponse } from "../utils/response.js";
import { PrismaClient } from "../generated/prisma/index.js";
import { safeJsonParse } from "../utils/json.js";

const prisma = new PrismaClient();

export const requireAuth = async (request, reply) => {
	try {
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session) {
			const { response, statusCode } = unauthorizedResponse("請先登入");
			return reply.code(statusCode).send(response);
			}

		request.user = session.user;
		request.session = session;
	} catch (error) {
		// Use Fastify's built-in logger which is more secure
		request.log.error("Auth middleware error:", error);
		const { response, statusCode } = unauthorizedResponse("認證失敗");
		return reply.code(statusCode).send(response);
	}
};

export const requireRole = allowedRoles => {
	return async (request, reply) => {
		await requireAuth(request, reply);

		if (reply.sent) return; 

		const user = await prisma.user.findUnique({
			where: { id: request.user.id },
			select: { role: true }
		});

		const userRole = user?.role || 'user';

		const userRoles = userRole.split(',').map(role => role.trim());
		
		const hasPermission = allowedRoles.some(allowedRole => 
			userRoles.includes(allowedRole)
		);

		if (!hasPermission) {
			const { response, statusCode } = forbiddenResponse("權限不足 [R]");
			return reply.code(statusCode).send(response);
		}
	};
};

export const requirePermission = permission => {
	return async (request, reply) => {
		await requireAuth(request, reply);

		if (reply.sent) return;

		const userPermissions = safeJsonParse(request.user.permissions, [], 'user permissions');

		if (!userPermissions.includes(permission) && request.user.role !== "admin") {
			const { response, statusCode } = forbiddenResponse("權限不足 [P]");
			return reply.code(statusCode).send(response);
		}
	};
};

export const requireAdmin = requireRole(["admin"]);
export const requireStaff = requireRole(["admin", "staff"]);