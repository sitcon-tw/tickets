import prisma from "#config/database";
import { PublicTicketResponseDataSchema, publicTicketSchemas } from "#schemas";
import { logger } from "#utils/logger";
import { notFoundResponse, serverErrorResponse, successResponse } from "#utils/response";
import { LocalizedTextSchema } from "@sitcontix/types";
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
			try {
				const { id } = request.params;

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
						isActive: true
					}
				});

				if (!ticket || !ticket.isActive) {
					const { response, statusCode } = notFoundResponse("票券不存在或已關閉");
					return reply.code(statusCode).send(response);
				}

				const now = new Date();
				const available = ticket.quantity - ticket.soldCount;
				const isOnSale = (!ticket.saleStart || now >= ticket.saleStart) && (!ticket.saleEnd || now <= ticket.saleEnd);
				const isSoldOut = available <= 0;

				const name = LocalizedTextSchema.parse(ticket.name);
				const description = LocalizedTextSchema.nullable().parse(ticket.description);
				const plainDescription = LocalizedTextSchema.nullable().parse(ticket.plainDescription);

				const ticketWithStatus = {
					...ticket,
					name,
					description,
					plainDescription,
					available,
					isOnSale,
					isSoldOut
				} satisfies z.infer<typeof PublicTicketResponseDataSchema>;

				return reply.send(successResponse(ticketWithStatus));
			} catch (error) {
				componentLogger.error({ error }, "Get public ticket info error");
				const { response, statusCode } = serverErrorResponse("取得票券資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default publicTicketsRoutes;
