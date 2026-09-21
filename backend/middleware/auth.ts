import type { EventAccessRequest, IdParams, Session, SessionUser, TicketBody, TicketIdParams, TicketIdQuery } from "@sitcontix/types";
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import prisma from "../config/database";
import { auth } from "../lib/auth";
import { safeJsonParse } from "../utils/json";
import { accountDisabledResponse, forbiddenResponse, notFoundResponse, unauthorizedResponse } from "../utils/response";
import { fromNodeHeaders } from "better-auth/node";

declare module "fastify" {
	interface FastifyRequest {
		user?: SessionUser;
		session?: Session;
		userEventPermissions?: string[];
	}
}

async function ensureAuth(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
	if (!request.user || !request.session) {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(request.headers)
		});

		if (!session) {
			const { response, statusCode } = unauthorizedResponse("請先登入");
			reply.code(statusCode).send(response);
			return false;
		}

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { isActive: true, role: true, permissions: true }
		});

		if (!user || !user.isActive) {
			const { response, statusCode } = accountDisabledResponse();
			reply.code(statusCode).send(response);
			return false;
		}

		const userPermissions = safeJsonParse<string[]>(user.permissions, [], "user permissions");

		request.user = {
			...session.user,
			role: user.role as "admin" | "viewer" | "eventAdmin",
			permissions: userPermissions,
			isActive: user.isActive
		};
		request.session = {
			user: {
				...session.user,
				createdAt: session.user.createdAt,
				updatedAt: session.user.updatedAt
			},
			session: {
				...session.session,
				createdAt: session.session.createdAt,
				updatedAt: session.session.updatedAt,
				expiresAt: session.session.expiresAt
			}
		};
	}
	return true;
}

export const requireAuth: preHandlerHookHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
	try {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(request.headers)
		});

		if (!session) {
			const { response, statusCode } = unauthorizedResponse("請先登入");
			return reply.code(statusCode).send(response);
		}

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { isActive: true, role: true, permissions: true }
		});

		if (!user || !user.isActive) {
			const { response, statusCode } = accountDisabledResponse("帳號已停用");
			return reply.code(statusCode).send(response);
		}

		const userPermissions = safeJsonParse<string[]>(user.permissions, [], "user permissions");

		request.user = {
			...session.user,
			role: user.role as "admin" | "viewer" | "eventAdmin",
			permissions: userPermissions,
			isActive: user.isActive
		};
		request.session = {
			user: {
				...session.user,
				createdAt: session.user.createdAt,
				updatedAt: session.user.updatedAt
			},
			session: {
				...session.session,
				createdAt: session.session.createdAt,
				updatedAt: session.session.updatedAt,
				expiresAt: session.session.expiresAt
			}
		};
	} catch (error) {
		request.log.error({ error }, "Auth middleware error");
		const { response, statusCode } = unauthorizedResponse("認證失敗");
		return reply.code(statusCode).send(response);
	}
};

export const requireRole = (allowedRoles: string[]): preHandlerHookHandler => {
	return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
		const authenticated = await ensureAuth(request, reply);
		if (!authenticated || reply.sent) return;

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
	return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
		const authenticated = await ensureAuth(request, reply);
		if (!authenticated || reply.sent) return;

		const userPermissions = request.user!.permissions;

		if (!userPermissions.includes(permission) && request.user!.role !== "admin") {
			const { response, statusCode } = forbiddenResponse("權限不足 [P]");
			return reply.code(statusCode).send(response);
		}
	};
};

export const requireAdmin = requireRole(["admin"]);
export const requireAdminOrEventAdmin = requireRole(["admin", "eventAdmin"]);

async function checkEventAccess(request: FastifyRequest, reply: FastifyReply, eventId: string | undefined): Promise<void> {
	const authenticated = await ensureAuth(request, reply);
	if (!authenticated || reply.sent) return;

	const user = await prisma.user.findUnique({
		where: { id: request.user!.id },
		select: { role: true, permissions: true }
	});

	const userRole = user?.role || "user";

	if (userRole === "admin") {
		return;
	}

	if (userRole === "eventAdmin") {
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
}

/**
 * Middleware to check if user can access a specific event
 * Admins can access all events, eventAdmins can only access events in their permissions
 * Returns 404 for eventAdmins without permission (to avoid redirect)
 */
export const requireEventAccess = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
	const query = request.query as EventAccessRequest;
	const params = request.params as EventAccessRequest;
	const body = request.body as EventAccessRequest;
	await checkEventAccess(request, reply, params?.eventId || params?.id || query?.eventId || body?.eventId);
};

/** Authorize the event that a body-based handler will actually use. */
export const requireEventAccessViaEventBody: preHandlerHookHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
	const body = request.body as EventAccessRequest;
	await checkEventAccess(request, reply, body?.eventId);
};

/**
 * Middleware to check if user can list events
 * Admins can see all events, eventAdmins can only see their assigned events
 */
export const requireEventListAccess: preHandlerHookHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
	const authenticated = await ensureAuth(request, reply);
	if (!authenticated || reply.sent) return;

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

/**
 * Helper middleware to check event access via ticketId in request body
 */
export const requireEventAccessViaTicketBody = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
	const body = request.body as TicketBody;
	const { ticketId } = body;
	let eventId: string | undefined;
	if (ticketId) {
		const ticket = await prisma.ticket.findUnique({
			where: { id: ticketId },
			select: { eventId: true }
		});
		if (ticket) {
			eventId = ticket.eventId;
		}
	}
	await checkEventAccess(request, reply, eventId);
};

/**
 * Helper middleware to check event access via ticketId in params
 */
export const requireEventAccessViaTicketParam: preHandlerHookHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
	const params = request.params as TicketIdParams;
	const { ticketId } = params;
	let eventId: string | undefined;
	if (ticketId) {
		const ticket = await prisma.ticket.findUnique({
			where: { id: ticketId },
			select: { eventId: true }
		});
		if (ticket) {
			eventId = ticket.eventId;
		}
	}
	await checkEventAccess(request, reply, eventId);
};

/**
 * Helper middleware to check event access via ticketId in query string
 */
export const requireEventAccessViaTicketQuery: preHandlerHookHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
	const query = request.query as TicketIdQuery;
	const { ticketId } = query;
	let eventId: string | undefined;
	if (ticketId) {
		const ticket = await prisma.ticket.findUnique({
			where: { id: ticketId },
			select: { eventId: true }
		});
		if (ticket) {
			eventId = ticket.eventId;
		}
	}
	await checkEventAccess(request, reply, eventId);
};

/**
 * Helper middleware to check event access via form field ID in params
 */
export const requireEventAccessViaFieldId: preHandlerHookHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
	const params = request.params as IdParams;
	const { id } = params;
	let eventId: string | undefined;
	if (id) {
		const field = await prisma.eventFormFields.findUnique({
			where: { id },
			select: { eventId: true }
		});
		if (field) {
			eventId = field.eventId;
		}
	}
	await checkEventAccess(request, reply, eventId);
};

/**
 * Helper middleware to check event access via invitation code ID in params
 */
export const requireEventAccessViaCodeId: preHandlerHookHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
	const params = request.params as IdParams;
	const { id } = params;
	let eventId: string | undefined;
	if (id) {
		const code = await prisma.invitationCode.findUnique({
			where: { id },
			include: { ticket: { select: { eventId: true } } }
		});
		if (code?.ticket) {
			eventId = code.ticket.eventId;
		}
	}
	await checkEventAccess(request, reply, eventId);
};

/**
 * Helper middleware to check event access via registration ID in params
 */
export const requireEventAccessViaRegistrationId: preHandlerHookHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
	const params = request.params as IdParams;
	const { id } = params;
	let eventId: string | undefined;
	if (id) {
		const registration = await prisma.registration.findUnique({
			where: { id },
			select: { eventId: true }
		});
		if (registration) {
			eventId = registration.eventId;
		}
	}
	await checkEventAccess(request, reply, eventId);
};

/**
 * Helper middleware to check event access via ticket ID in params
 */
export const requireEventAccessViaTicketId: preHandlerHookHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
	const params = request.params as IdParams;
	const { id } = params;
	let eventId: string | undefined;
	if (id) {
		const ticket = await prisma.ticket.findUnique({
			where: { id },
			select: { eventId: true }
		});
		if (ticket) {
			eventId = ticket.eventId;
		}
	}
	await checkEventAccess(request, reply, eventId);
};

export const requireEventDashboardAccess: preHandlerHookHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
	const authenticated = await ensureAuth(request, reply);
	if (!authenticated || reply.sent) return;

	const user = await prisma.user.findUnique({
		where: { id: request.user!.id },
		select: { role: true, permissions: true }
	});

	const userRole = user?.role || "user";

	if (userRole === "admin") {
		return;
	}

	if (userRole === "eventAdmin") {
		const url = request.url;
		const eventIdMatch = url.match(/\/events\/([a-zA-Z0-9-_]+)\/dashboard/);
		const eventId = eventIdMatch ? eventIdMatch[1] : null;

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
