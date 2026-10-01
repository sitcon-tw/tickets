import type { EventAccessRequest, IdParams, Permission, Session, SessionUser, TicketBody, TicketIdParams, TicketIdQuery } from "@sitcontix/types";
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import prisma from "../config/database";
import { canAccessEvent, resolveAccess, type AccessContext } from "../lib/access";
import { auth } from "../lib/auth";
import { safeJsonParse } from "../utils/json";
import { accountDisabledResponse, errorResponse, forbiddenResponse, notFoundResponse, unauthorizedResponse } from "../utils/response";
import { fromNodeHeaders } from "better-auth/node";

declare module "fastify" {
	interface FastifyRequest {
		user?: SessionUser;
		session?: Session;
		/** What the signed-in user may do in the admin area */
		access?: AccessContext;
		/** Set by the list guards for users limited to specific events; undefined means "all events" */
		userEventPermissions?: string[];
	}
}

async function ensureAuth(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
	if (request.user && request.session && request.access) return true;

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
		select: { isActive: true, role: true, permissions: true, customRole: { select: { permissions: true, allEvents: true } } }
	});

	if (!user || !user.isActive) {
		const { response, statusCode } = accountDisabledResponse();
		reply.code(statusCode).send(response);
		return false;
	}

	const access = resolveAccess(user);

	request.access = access;
	request.user = {
		...session.user,
		role: access.role,
		permissions: safeJsonParse<string[]>(user.permissions, [], "user permissions"),
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
	return true;
}

export const requireAuth: preHandlerHookHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
	try {
		await ensureAuth(request, reply);
	} catch (error) {
		request.log.error({ error }, "Auth middleware error");
		const { response, statusCode } = unauthorizedResponse("認證失敗");
		return reply.code(statusCode).send(response);
	}
};

const denyPermission = (reply: FastifyReply, permission: string) => {
	// A dedicated code lets the frontend show an error instead of treating the 403 as "not an admin" and redirecting home.
	const { response, statusCode } = errorResponse("PERMISSION_DENIED", `權限不足：缺少 ${permission} 權限`, null, 403);
	return reply.code(statusCode).send(response);
};

/** Authenticate and require `permission`. Sends the error reply and returns undefined when the request must stop. */
async function authorize(request: FastifyRequest, reply: FastifyReply, permission: Permission): Promise<AccessContext | undefined> {
	const authenticated = await ensureAuth(request, reply);
	if (!authenticated || reply.sent) return undefined;

	const access = request.access!;
	if (!access.permissions.has(permission)) {
		await denyPermission(reply, permission);
		return undefined;
	}
	return access;
}

/** Lets anyone with at least one admin permission into the admin area; individual routes still check their own permission. */
export const requireAdminAccess: preHandlerHookHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
	const authenticated = await ensureAuth(request, reply);
	if (!authenticated || reply.sent) return;

	if (request.access!.permissions.size === 0) {
		const { response, statusCode } = forbiddenResponse("權限不足 [R]");
		return reply.code(statusCode).send(response);
	}
};

/** Requires a permission that is not tied to a single event (users, settings, ...). */
export const requirePermission = (permission: Permission): Guard => {
	return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
		await authorize(request, reply, permission);
	};
};

/** Requires at least one of the given permissions. */
export const requireAnyPermission = (permissions: Permission[]): Guard => {
	return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
		const authenticated = await ensureAuth(request, reply);
		if (!authenticated || reply.sent) return;

		if (!permissions.some(permission => request.access!.permissions.has(permission))) {
			return denyPermission(reply, permissions.join(" | "));
		}
	};
};

/** A guard that can also be awaited directly from inside a handler */
type Guard = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

type EventIdResolver = (request: FastifyRequest) => Promise<string | undefined> | string | undefined;

/**
 * Builds an event-scoped guard factory: the user needs `permission`, and the resolved event must be one they may manage.
 * Users without access to the event get a 404 (not a 403) so the frontend does not redirect them.
 */
const eventGuard = (resolveEventId: EventIdResolver) => {
	return (permission: Permission): Guard =>
		async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
			const access = await authorize(request, reply, permission);
			if (!access || access.allEvents) return;

			const eventId = await resolveEventId(request);
			if (!eventId || !canAccessEvent(access, eventId)) {
				const { response, statusCode } = notFoundResponse("活動不存在");
				return reply.code(statusCode).send(response);
			}
		};
};

const eventIdViaRelation = (find: (id: string) => Promise<string | undefined>): EventIdResolver => {
	return async request => {
		const { id } = request.params as IdParams;
		return id ? find(id) : undefined;
	};
};

/** Guard for routes whose event ID is in params (`eventId` / `id`), the query or the body */
export const requireEventAccess = eventGuard(request => {
	const query = request.query as EventAccessRequest;
	const params = request.params as EventAccessRequest;
	const body = request.body as EventAccessRequest;
	return params?.eventId || params?.id || query?.eventId || body?.eventId;
});

/** Authorize the event that a body-based handler will actually use. */
export const requireEventAccessViaEventBody = eventGuard(request => (request.body as EventAccessRequest)?.eventId);

const eventIdOfTicket = async (ticketId: string | undefined) => {
	if (!ticketId) return undefined;
	const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { eventId: true } });
	return ticket?.eventId;
};

/** Event access via ticketId in the request body */
export const requireEventAccessViaTicketBody = eventGuard(request => eventIdOfTicket((request.body as TicketBody).ticketId));

/** Event access via ticketId in params */
export const requireEventAccessViaTicketParam = eventGuard(request => eventIdOfTicket((request.params as TicketIdParams).ticketId));

/** Event access via ticketId in the query string */
export const requireEventAccessViaTicketQuery = eventGuard(request => eventIdOfTicket((request.query as TicketIdQuery).ticketId));

/** Event access via ticket ID in params (`:id`) */
export const requireEventAccessViaTicketId = eventGuard(eventIdViaRelation(eventIdOfTicket));

/** Event access via form field ID in params */
export const requireEventAccessViaFieldId = eventGuard(
	eventIdViaRelation(async id => {
		const field = await prisma.eventFormFields.findUnique({ where: { id }, select: { eventId: true } });
		return field?.eventId;
	})
);

/** Event access via invitation code ID in params */
export const requireEventAccessViaCodeId = eventGuard(
	eventIdViaRelation(async id => {
		const code = await prisma.invitationCode.findUnique({ where: { id }, include: { ticket: { select: { eventId: true } } } });
		return code?.ticket?.eventId;
	})
);

/** Event access via registration ID in params */
export const requireEventAccessViaRegistrationId = eventGuard(
	eventIdViaRelation(async id => {
		const registration = await prisma.registration.findUnique({ where: { id }, select: { eventId: true } });
		return registration?.eventId;
	})
);

/** Event access via sponsor ID in params */
export const requireEventAccessViaSponsorId = eventGuard(
	eventIdViaRelation(async id => {
		const sponsor = await prisma.sponsor.findUnique({ where: { id }, select: { eventId: true } });
		return sponsor?.eventId;
	})
);

/**
 * List guard: requires `permission` and exposes the events the user is limited to through `request.userEventPermissions`.
 * Users who may manage every event get `undefined`; everyone else gets their event IDs (possibly empty, meaning "no events").
 */
export const requireEventListAccess = (permission: Permission): Guard => {
	return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
		const access = await authorize(request, reply, permission);
		if (!access) return;

		request.userEventPermissions = access.allEvents ? undefined : access.eventIds;
	};
};
