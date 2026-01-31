import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { publicTicketSchemas } from "#schemas";
import { logger } from "#utils/logger";
import { notFoundResponse, serverErrorResponse, successResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";
import { LocalizedTextSchema, PublicTicketDetailSchema } from "@sitcontix/types";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { z } from "zod/v4";

const componentLogger = logger.child({ component: "public/tickets" });

const publicTicketsRoutes: FastifyPluginAsync = async fastify => {
	// Get single ticket information (public)
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/tickets/:id",
		{
			schema: publicTicketSchemas.getPublicTicket
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.public.tickets.get_public_ticket");

			try {
				const { id } = request.params;
				span.setAttribute("ticket.id", id);

				const ticket = await prisma.ticket.findUnique({
					where: {
						id
					},
					select: {
						id: true,
						name: true,
						description: true,
						plainDescription: true,
						price: true,
						quantity: true,
						soldCount: true,
						saleStart: true,
						saleEnd: true,
						requireInviteCode: true,
						requireSmsVerification: true,
						showRemaining: true,
						isActive: true
					}
				});

				if (!ticket || !ticket.isActive) {
					span.addEvent("ticket.not_found_or_inactive");
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Ticket not found or inactive" });
					const { response, statusCode } = notFoundResponse("票券不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("ticket.price", ticket.price);
				span.setAttribute("ticket.quantity", ticket.quantity);
				span.setAttribute("ticket.sold_count", ticket.soldCount);
				span.setAttribute("ticket.require_invite_code", ticket.requireInviteCode);
				span.setAttribute("ticket.require_sms_verification", ticket.requireSmsVerification);

				const now = new Date();
				const available = ticket.quantity - ticket.soldCount;
				const isOnSale = (!ticket.saleStart || now >= ticket.saleStart) && (!ticket.saleEnd || now <= ticket.saleEnd);
				const isSoldOut = available <= 0;

				span.setAttribute("ticket.available", available);

				const ticketWithStatus = {
					...ticket,
					name: LocalizedTextSchema.parse(ticket.name),
					description: LocalizedTextSchema.nullable().parse(ticket.description),
					plainDescription: LocalizedTextSchema.nullable().parse(ticket.plainDescription),
					available,
					isOnSale,
					isSoldOut
				} satisfies z.infer<typeof PublicTicketDetailSchema>;

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(ticketWithStatus));
			} catch (error) {
				componentLogger.error({ error }, "Get public ticket info error");
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to get public ticket info" });
				const { response, statusCode } = serverErrorResponse("取得票券資訊失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);
};

export default publicTicketsRoutes;
