import prisma from "../config/database.js";
import { auth } from "../lib/auth.js";
import { safeJsonParse } from "../utils/json.js";
import { accountDisabledResponse, forbiddenResponse, notFoundResponse, unauthorizedResponse } from "../utils/response.js";
import type { FastifyRequest, FastifyReply, preHandlerHookHandler } from "fastify";

// Extend Fastify request interface to include user and session
declare module "fastify" {
	interface FastifyRequest {
		user?: any;
		session?: any;
		userEventPermissions?: string[];
	}
}

export const requireAuth: preHandlerHookHandler = async (
	request: FastifyRequest,
	reply: FastifyReply
): Promise<void> => {
	try {
		const session = await auth.api.getSession({
			headers: request.headers as any
		});

		if (!session) {
			const { response, statusCode } = unauthorizedResponse("請先登入");
			return reply.code(statusCode).send(response);
		}

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { isActive: true }
		});

		if (!user || user.isActive === false) {
			const { response, statusCode } = accountDisabledResponse("帳號已停用");
			return reply.code(statusCode).send(response);
		}

		request.user = session.user;
		request.session = session;
	} catch (error) {
		request.log.error("Auth middleware error:", error);
		const { response, statusCode } = unauthorizedResponse("認證失敗");
		return reply.code(statusCode).send(response);
	}
};

export const requireRole = (allowedRoles: string[]): preHandlerHookHandler => {
	return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
		await requireAuth(request, reply);

		if (reply.sent) return;

		const user = await prisma.user.findUnique({
			where: { id: request.user.id },
			select: { role: true }
		});

		const userRole = user?.role || "user";

		const userRoles = userRole.split(",").map(role => role.trim());

		const hasPermission = allowedRoles.some(allowedRole => userRoles.includes(allowedRole));

		if (!hasPermission) {
			const { response, statusCode } = forbiddenResponse("權限不足 [R]");
			return reply.code(statusCode).send(response);
		}
	};
};

export const requirePermission = (permission: string): preHandlerHookHandler => {
	return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
		await requireAuth(request, reply);

		if (reply.sent) return;

		const userPermissions = safeJsonParse<string[]>(request.user.permissions, [], "user permissions");

		if (!userPermissions.includes(permission) && request.user.role !== "admin") {
			const { response, statusCode } = forbiddenResponse("權限不足 [P]");
			return reply.code(statusCode).send(response);
		}
	};
};

export const requireAdmin = requireRole(["admin"]);
export const requireStaff = requireRole(["admin", "staff"]);
export const requireAdminOrEventAdmin = requireRole(["admin", "eventAdmin"]);

/**
 * Middleware to check if user can access a specific event
 * Admins can access all events, eventAdmins can only access events in their permissions
 * Returns 404 for eventAdmins without permission (to avoid redirect)
 */
export const requireEventAccess: preHandlerHookHandler = async (
	request: FastifyRequest,
	reply: FastifyReply
): Promise<void> => {
	await requireAuth(request, reply);

	if (reply.sent) return;

	const user = await prisma.user.findUnique({
		where: { id: request.user.id },
		select: { role: true, permissions: true }
	});

	const userRole = user?.role || "user";

	if (userRole === "admin") {
		return;
	}

	if (userRole === "eventAdmin") {
		const eventId = (request.query as any)?.eventId || (request.params as any)?.id || (request.body as any)?.eventId;

		if (!eventId) {
			const { response, statusCode } = notFoundResponse("活動不存在");
			return reply.code(statusCode).send(response);
		}

		const userPermissions = safeJsonParse<string[]>(user?.permissions || null, [], "user permissions");

		if (!userPermissions.includes(eventId)) {
			const { response, statusCode } = notFoundResponse("活動不存在");
			return reply.code(statusCode).send(response);
		}

		return;
	}

	const { response, statusCode } = forbiddenResponse("權限不足");
	return reply.code(statusCode).send(response);
};

/**
 * Middleware to check if user can list events
 * Admins can see all events, eventAdmins can only see their assigned events
 */
export const requireEventListAccess: preHandlerHookHandler = async (
	request: FastifyRequest,
	reply: FastifyReply
): Promise<void> => {
	await requireAuth(request, reply);

	if (reply.sent) return;

	const user = await prisma.user.findUnique({
		where: { id: request.user.id },
		select: { role: true, permissions: true }
	});

	const userRole = user?.role || "user";

	if (userRole === "admin") {
		return;
	}

	if (userRole === "eventAdmin") {
		request.userEventPermissions = safeJsonParse<string[]>(user?.permissions || null, [], "user permissions");
		return;
	}

	const { response, statusCode } = forbiddenResponse("權限不足");
	return reply.code(statusCode).send(response);
};

/**
 * Helper middleware to check event access via ticketId in request body
 */
export const requireEventAccessViaTicketBody: preHandlerHookHandler = async (
	request: FastifyRequest,
	reply: FastifyReply
): Promise<void> => {
	const { ticketId } = request.body as any;
	if (ticketId) {
		const ticket = await prisma.ticket.findUnique({
			where: { id: ticketId },
			select: { eventId: true }
		});
		if (ticket) {
			request.query = { ...(request.query || {}), eventId: ticket.eventId };
		}
	}
	await requireEventAccess(request, reply);
};

/**
 * Helper middleware to check event access via ticketId in params
 */
export const requireEventAccessViaTicketParam: preHandlerHookHandler = async (
	request: FastifyRequest,
	reply: FastifyReply
): Promise<void> => {
	const { ticketId } = request.params as any;
	if (ticketId) {
		const ticket = await prisma.ticket.findUnique({
			where: { id: ticketId },
			select: { eventId: true }
		});
		if (ticket) {
			request.query = { ...(request.query || {}), eventId: ticket.eventId };
		}
	}
	await requireEventAccess(request, reply);
};

/**
 * Helper middleware to check event access via ticketId in query string
 */
export const requireEventAccessViaTicketQuery: preHandlerHookHandler = async (
	request: FastifyRequest,
	reply: FastifyReply
): Promise<void> => {
	const { ticketId } = request.query as any;
	if (ticketId) {
		const ticket = await prisma.ticket.findUnique({
			where: { id: ticketId },
			select: { eventId: true }
		});
		if (ticket) {
			request.query = { ...(request.query || {}), eventId: ticket.eventId };
		}
	}
	await requireEventAccess(request, reply);
};

/**
 * Helper middleware to check event access via form field ID in params
 */
export const requireEventAccessViaFieldId: preHandlerHookHandler = async (
	request: FastifyRequest,
	reply: FastifyReply
): Promise<void> => {
	const { id } = request.params as any;
	if (id) {
		const field = await prisma.eventFormFields.findUnique({
			where: { id },
			select: { eventId: true }
		});
		if (field) {
			request.query = { ...(request.query || {}), eventId: field.eventId };
		}
	}
	await requireEventAccess(request, reply);
};

/**
 * Helper middleware to check event access via invitation code ID in params
 */
export const requireEventAccessViaCodeId: preHandlerHookHandler = async (
	request: FastifyRequest,
	reply: FastifyReply
): Promise<void> => {
	const { id } = request.params as any;
	if (id) {
		const code = await prisma.invitationCode.findUnique({
			where: { id },
			include: { ticket: { select: { eventId: true } } }
		});
		if (code?.ticket) {
			request.query = { ...(request.query || {}), eventId: code.ticket.eventId };
		}
	}
	await requireEventAccess(request, reply);
};

/**
 * Helper middleware to check event access via registration ID in params
 */
export const requireEventAccessViaRegistrationId: preHandlerHookHandler = async (
	request: FastifyRequest,
	reply: FastifyReply
): Promise<void> => {
	const { id } = request.params as any;
	if (id) {
		const registration = await prisma.registration.findUnique({
			where: { id },
			select: { eventId: true }
		});
		if (registration) {
			request.query = { ...(request.query || {}), eventId: registration.eventId };
		}
	}
	await requireEventAccess(request, reply);
};

/**
 * Helper middleware to check event access via ticket ID in params
 */
export const requireEventAccessViaTicketId: preHandlerHookHandler = async (
	request: FastifyRequest,
	reply: FastifyReply
): Promise<void> => {
	const { id } = request.params as any;
	if (id) {
		const ticket = await prisma.ticket.findUnique({
			where: { id },
			select: { eventId: true }
		});
		if (ticket) {
			request.query = { ...(request.query || {}), eventId: ticket.eventId };
		}
	}
	await requireEventAccess(request, reply);
};
