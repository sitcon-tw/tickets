import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import prisma from "../config/database";
import { auth } from "../lib/auth";
import { safeJsonParse } from "../utils/json";
import { accountDisabledResponse, forbiddenResponse, notFoundResponse, unauthorizedResponse } from "../utils/response";

interface SessionUser {
	id: string;
	name: string;
	email: string;
	role?: string;
	permissions?: string;
	isActive?: boolean;
}

interface Session {
	user: SessionUser;
	session: {
		id: string;
		userId: string;
		expiresAt: Date;
		token: string;
		ipAddress?: string | null;
		userAgent?: string | null;
	};
}

declare module "fastify" {
	interface FastifyRequest {
		user?: SessionUser;
		session?: Session;
		userEventPermissions?: string[];
	}
}

export const requireAuth: preHandlerHookHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
	try {
		const session = await auth.api.getSession({
			headers: request.headers as unknown as Headers
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
		request.log.error({ err: error }, "Auth middleware error");
		const { response, statusCode } = unauthorizedResponse("認證失敗");
		return reply.code(statusCode).send(response);
	}
};

export const requireRole = (allowedRoles: string[]): preHandlerHookHandler => {
	return async function (this: unknown, request: FastifyRequest, reply: FastifyReply): Promise<void> {
		await requireAuth(request, reply);

		if (reply.sent) return;

		const user = await prisma.user.findUnique({
			where: { id: request.user!.id },
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
	return async function (this: unknown, request: FastifyRequest, reply: FastifyReply): Promise<void> {
		await requireAuth(request, reply);

		if (reply.sent) return;

		const userPermissions = safeJsonParse<string[]>(request.user!.permissions, [], "user permissions");

		if (!userPermissions.includes(permission) && request.user!.role !== "admin") {
			const { response, statusCode } = forbiddenResponse("權限不足 [P]");
			return reply.code(statusCode).send(response);
		}
	};
};

export const requireAdmin = requireRole(["admin"]);
export const requireStaff = requireRole(["admin", "staff"]);
export const requireAdminOrEventAdmin = requireRole(["admin", "eventAdmin"]);

interface EventAccessRequest {
	eventId?: string;
	id?: string;
}

/**
 * Middleware to check if user can access a specific event
 * Admins can access all events, eventAdmins can only access events in their permissions
 * Returns 404 for eventAdmins without permission (to avoid redirect)
 */
export const requireEventAccess: preHandlerHookHandler = async function (this: unknown, request: FastifyRequest, reply: FastifyReply): Promise<void> {
	await requireAuth(request, reply);

	if (reply.sent) return;

	const user = await prisma.user.findUnique({
		where: { id: request.user!.id },
		select: { role: true, permissions: true }
	});

	const userRole = user?.role || "user";

	if (userRole === "admin") {
		return;
	}

	if (userRole === "eventAdmin") {
		const query = request.query as EventAccessRequest;
		const params = request.params as EventAccessRequest;
		const body = request.body as EventAccessRequest;
		const eventId = query?.eventId || params?.id || body?.eventId;

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
export const requireEventListAccess: preHandlerHookHandler = async function (this: unknown, request: FastifyRequest, reply: FastifyReply): Promise<void> {
	await requireAuth(request, reply);

	if (reply.sent) return;

	const user = await prisma.user.findUnique({
		where: { id: request.user!.id },
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

interface TicketBody {
	ticketId?: string;
}

/**
 * Helper middleware to check event access via ticketId in request body
 */
export const requireEventAccessViaTicketBody: preHandlerHookHandler = async function (this: unknown, request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const body = request.body as TicketBody;
	const { ticketId } = body;
	if (ticketId) {
		const ticket = await prisma.ticket.findUnique({
			where: { id: ticketId },
			select: { eventId: true }
		});
		if (ticket) {
			request.query = { ...(request.query || {}), eventId: ticket.eventId } as typeof request.query;
		}
	}
	await requireEventAccess(request, reply);
};

interface TicketIdParams {
	ticketId?: string;
}

/**
 * Helper middleware to check event access via ticketId in params
 */
export const requireEventAccessViaTicketParam: preHandlerHookHandler = async function (this: unknown, request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const params = request.params as TicketIdParams;
	const { ticketId } = params;
	if (ticketId) {
		const ticket = await prisma.ticket.findUnique({
			where: { id: ticketId },
			select: { eventId: true }
		});
		if (ticket) {
			request.query = { ...(request.query || {}), eventId: ticket.eventId } as typeof request.query;
		}
	}
	await requireEventAccess(request, reply);
};

interface TicketIdQuery {
	ticketId?: string;
}

/**
 * Helper middleware to check event access via ticketId in query string
 */
export const requireEventAccessViaTicketQuery: preHandlerHookHandler = async function (this: unknown, request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const query = request.query as TicketIdQuery;
	const { ticketId } = query;
	if (ticketId) {
		const ticket = await prisma.ticket.findUnique({
			where: { id: ticketId },
			select: { eventId: true }
		});
		if (ticket) {
			request.query = { ...(request.query || {}), eventId: ticket.eventId } as typeof request.query;
		}
	}
	await requireEventAccess(request, reply);
};

interface IdParams {
	id?: string;
}

/**
 * Helper middleware to check event access via form field ID in params
 */
export const requireEventAccessViaFieldId: preHandlerHookHandler = async function (this: unknown, request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const params = request.params as IdParams;
	const { id } = params;
	if (id) {
		const field = await prisma.eventFormFields.findUnique({
			where: { id },
			select: { eventId: true }
		});
		if (field) {
			request.query = { ...(request.query || {}), eventId: field.eventId } as typeof request.query;
		}
	}
	await requireEventAccess(request, reply);
};

/**
 * Helper middleware to check event access via invitation code ID in params
 */
export const requireEventAccessViaCodeId: preHandlerHookHandler = async function (this: unknown, request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const params = request.params as IdParams;
	const { id } = params;
	if (id) {
		const code = await prisma.invitationCode.findUnique({
			where: { id },
			include: { ticket: { select: { eventId: true } } }
		});
		if (code?.ticket) {
			request.query = { ...(request.query || {}), eventId: code.ticket.eventId } as typeof request.query;
		}
	}
	await requireEventAccess(request, reply);
};

/**
 * Helper middleware to check event access via registration ID in params
 */
export const requireEventAccessViaRegistrationId: preHandlerHookHandler = async function (this: unknown, request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const params = request.params as IdParams;
	const { id } = params;
	if (id) {
		const registration = await prisma.registration.findUnique({
			where: { id },
			select: { eventId: true }
		});
		if (registration) {
			request.query = { ...(request.query || {}), eventId: registration.eventId } as typeof request.query;
		}
	}
	await requireEventAccess(request, reply);
};

/**
 * Helper middleware to check event access via ticket ID in params
 */
export const requireEventAccessViaTicketId: preHandlerHookHandler = async function (this: unknown, request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const params = request.params as IdParams;
	const { id } = params;
	if (id) {
		const ticket = await prisma.ticket.findUnique({
			where: { id },
			select: { eventId: true }
		});
		if (ticket) {
			request.query = { ...(request.query || {}), eventId: ticket.eventId } as typeof request.query;
		}
	}
	await requireEventAccess(request, reply);
};
