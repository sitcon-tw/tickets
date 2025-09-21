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
			reply.code(statusCode).send(response);
			return;
		}

		request.user = session.user;
		request.session = session;
	} catch (error) {
		console.error("Auth middleware error:", error);
		const { response, statusCode } = unauthorizedResponse("認證失敗");
		reply.code(statusCode).send(response);
	}
};

export const requireRole = allowedRoles => {
	return async (request, reply) => {
		await requireAuth(request, reply);

		if (reply.sent) return; 

		// Gather roles from session and database, support comma-separated values
		const sessionRole = request.user?.role;
		const sessionRoles = Array.isArray(sessionRole)
			? sessionRole
			: (typeof sessionRole === 'string' ? sessionRole.split(',').map(r => r.trim()).filter(Boolean) : []);

		const user = await prisma.user.findUnique({
			where: { id: request.user.id },
			select: { role: true }
		});

		const dbRole = user?.role || '';
		const dbRoles = dbRole.split(',').map(role => role.trim()).filter(Boolean);

		const allRoles = Array.from(new Set([...(sessionRoles || []), ...(dbRoles || [])]));
		console.log("User roles (session+DB):", allRoles.join(','));

		const hasPermission = allowedRoles.some(allowedRole => allRoles.includes(allowedRole));

		if (!hasPermission) {
			const { response, statusCode } = forbiddenResponse("權限不足 [R]");
			reply.code(statusCode).send(response);
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
			reply.code(statusCode).send(response);
		}
	};
};

export const requireAdmin = requireRole(["admin", "super-admin"]);
export const requireStaff = requireRole(["admin", "staff"]);