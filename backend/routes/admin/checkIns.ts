/**
 * @fileoverview Admin check-in routes: attendee list for the check-in desk and check-in / undo
 */

import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { requireEventAccess, requireEventAccessViaRegistrationId } from "#middleware/auth";
import { adminCheckInSchemas } from "#schemas";
import { notFoundResponse, successResponse, validationErrorResponse } from "#utils/response";
import { safeJsonParse } from "#utils/json";
import { SpanStatusCode } from "@opentelemetry/api";
import { LocalizedTextSchema, RegistrationStatusSchema } from "@sitcontix/types";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import crypto from "node:crypto";

/** The token in an attendee's ticket QR code; the frontend derives it the same way (see success page). */
function getQrToken(id: string, createdAt: Date): string {
	return crypto.createHash("sha256").update(`${id}${createdAt.toISOString()}`).digest("hex");
}

const adminCheckInsRoutes: FastifyPluginAsync = async fastify => {
	// Everyone who can be checked in (confirmed) or needs a clear "cancelled" message when their ticket is scanned
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/check-ins",
		{
			preHandler: requireEventAccess("checkIns:view"),
			schema: adminCheckInSchemas.listAttendees
		},
		async (request, reply) => {
			const { eventId } = request.query;

			const span = tracer.startSpan("route.admin.check_ins.list", { attributes: { "event.id": eventId } });

			try {
				const registrations = await prisma.registration.findMany({
					where: { eventId, status: { in: ["confirmed", "cancelled"] } },
					select: {
						id: true,
						eventId: true,
						email: true,
						status: true,
						formData: true,
						checkedIn: true,
						checkedInAt: true,
						createdAt: true,
						user: { select: { name: true, phoneNumber: true } },
						ticket: { select: { name: true } }
					},
					orderBy: { createdAt: "asc" }
				});

				span.setAttribute("check_ins.count", registrations.length);

				const attendees = registrations.map(registration => ({
					id: registration.id,
					eventId: registration.eventId,
					email: registration.email,
					name: registration.user.name || null,
					phoneNumber: registration.user.phoneNumber || null,
					status: RegistrationStatusSchema.parse(registration.status),
					ticketName: LocalizedTextSchema.parse(registration.ticket.name),
					formData: safeJsonParse<Record<string, unknown>>(registration.formData, {}, `check-in list for ${registration.id}`),
					qrToken: getQrToken(registration.id, registration.createdAt),
					checkedIn: registration.checkedIn,
					checkedInAt: registration.checkedInAt,
					createdAt: registration.createdAt
				}));

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(attendees, "取得報到名單成功"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to list check-ins" });
				throw error;
			} finally {
				span.end();
			}
		}
	);

	fastify.withTypeProvider<ZodTypeProvider>().put(
		"/check-ins/:id",
		{
			preHandler: requireEventAccessViaRegistrationId("checkIns:update"),
			schema: adminCheckInSchemas.updateCheckIn
		},
		async (request, reply) => {
			const { id } = request.params;
			const { checkedIn } = request.body;

			const span = tracer.startSpan("route.admin.check_ins.update", { attributes: { "registration.id": id, "check_ins.checked_in": checkedIn } });

			try {
				const registration = await prisma.registration.findUnique({ where: { id }, select: { id: true, status: true, checkedIn: true, checkedInAt: true } });

				if (!registration) {
					span.addEvent("registration.not_found");
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = notFoundResponse("報名記錄不存在");
					return reply.code(statusCode).send(response);
				}

				if (!checkedIn) {
					// Undo: only touches rows that are actually checked in
					await prisma.registration.updateMany({ where: { id, checkedIn: true }, data: { checkedIn: false, checkedInAt: null } });
					span.setStatus({ code: SpanStatusCode.OK });
					return reply.send(successResponse({ id, checkedIn: false, checkedInAt: null, alreadyCheckedIn: false }, "已取消報到"));
				}

				if (registration.status !== "confirmed") {
					span.addEvent("registration.not_confirmed");
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = validationErrorResponse("只有已確認的報名可以報到");
					return reply.code(statusCode).send(response);
				}

				// Conditional update so that two desks checking in the same attendee cannot both "win"
				const checkedInAt = new Date();
				const { count } = await prisma.registration.updateMany({ where: { id, checkedIn: false, status: "confirmed" }, data: { checkedIn: true, checkedInAt } });

				if (count === 1) {
					span.setStatus({ code: SpanStatusCode.OK });
					return reply.send(successResponse({ id, checkedIn: true, checkedInAt, alreadyCheckedIn: false }, "報到成功"));
				}

				const current = await prisma.registration.findUnique({ where: { id }, select: { status: true, checkedIn: true, checkedInAt: true } });
				if (!current?.checkedIn) {
					// Cancelled or deleted between the two queries
					const { response, statusCode } = validationErrorResponse("只有已確認的報名可以報到");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("check_in.already_checked_in");
				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse({ id, checkedIn: true, checkedInAt: current.checkedInAt, alreadyCheckedIn: true }, "此報名已報到"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to update check-in" });
				throw error;
			} finally {
				span.end();
			}
		}
	);
};

export default adminCheckInsRoutes;
