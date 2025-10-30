import { PrismaClient } from "../generated/prisma/index.js";
import { auth } from "../lib/auth.js";
import { safeJsonParse } from "../utils/json.js";
import { accountDisabledResponse, forbiddenResponse, notFoundResponse, unauthorizedResponse } from "../utils/response.js";

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

export const requireRole = allowedRoles => {
	return async (request, reply) => {
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

export const requirePermission = permission => {
	return async (request, reply) => {
		await requireAuth(request, reply);

		if (reply.sent) return;

		const userPermissions = safeJsonParse(request.user.permissions, [], "user permissions");

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
export const requireEventAccess = async (request, reply) => {
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
		const eventId = request.query.eventId || request.params.id || request.body.eventId;

		if (!eventId) {
			const { response, statusCode } = notFoundResponse("活動不存在");
			return reply.code(statusCode).send(response);
		}

		const userPermissions = safeJsonParse(user.permissions, [], "user permissions");

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
export const requireEventListAccess = async (request, reply) => {
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
		request.userEventPermissions = safeJsonParse(user.permissions, [], "user permissions");
		return;
	}

	const { response, statusCode } = forbiddenResponse("權限不足");
	return reply.code(statusCode).send(response);
};

/**
 * Helper middleware to check event access via ticketId in request body
 */
export const requireEventAccessViaTicketBody = async (request, reply) => {
	const { ticketId } = request.body;
	if (ticketId) {
		const ticket = await prisma.ticket.findUnique({
			where: { id: ticketId },
			select: { eventId: true }
		});
		if (ticket) {
			request.query = { ...request.query, eventId: ticket.eventId };
		}
	}
	await requireEventAccess(request, reply);
};

/**
 * Helper middleware to check event access via ticketId in params
 */
export const requireEventAccessViaTicketParam = async (request, reply) => {
	const { ticketId } = request.params;
	if (ticketId) {
		const ticket = await prisma.ticket.findUnique({
			where: { id: ticketId },
			select: { eventId: true }
		});
		if (ticket) {
			request.query = { ...request.query, eventId: ticket.eventId };
		}
	}
	await requireEventAccess(request, reply);
};

/**
 * Helper middleware to check event access via ticketId in query string
 */
export const requireEventAccessViaTicketQuery = async (request, reply) => {
	const { ticketId } = request.query;
	if (ticketId) {
		const ticket = await prisma.ticket.findUnique({
			where: { id: ticketId },
			select: { eventId: true }
		});
		if (ticket) {
			request.query = { ...request.query, eventId: ticket.eventId };
		}
	}
	await requireEventAccess(request, reply);
};

/**
 * Helper middleware to check event access via form field ID in params
 */
export const requireEventAccessViaFieldId = async (request, reply) => {
	const { id } = request.params;
	if (id) {
		const field = await prisma.eventFormFields.findUnique({
			where: { id },
			select: { eventId: true }
		});
		if (field) {
			request.query = { ...request.query, eventId: field.eventId };
		}
	}
	await requireEventAccess(request, reply);
};

/**
 * Helper middleware to check event access via invitation code ID in params
 */
export const requireEventAccessViaCodeId = async (request, reply) => {
	const { id } = request.params;
	if (id) {
		const code = await prisma.invitationCode.findUnique({
			where: { id },
			include: { ticket: { select: { eventId: true } } }
		});
		if (code?.ticket) {
			request.query = { ...request.query, eventId: code.ticket.eventId };
		}
	}
	await requireEventAccess(request, reply);
};

/**
 * Helper middleware to check event access via registration ID in params
 */
export const requireEventAccessViaRegistrationId = async (request, reply) => {
	const { id } = request.params;
	if (id) {
		const registration = await prisma.registration.findUnique({
			where: { id },
			select: { eventId: true }
		});
		if (registration) {
			request.query = { ...request.query, eventId: registration.eventId };
		}
	}
	await requireEventAccess(request, reply);
};

/**
 * Helper middleware to check event access via ticket ID in params
 */
export const requireEventAccessViaTicketId = async (request, reply) => {
	const { id } = request.params;
	if (id) {
		const ticket = await prisma.ticket.findUnique({
			where: { id },
			select: { eventId: true }
		});
		if (ticket) {
			request.query = { ...request.query, eventId: ticket.eventId };
		}
	}
	await requireEventAccess(request, reply);
};
