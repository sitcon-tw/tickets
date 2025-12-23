import prisma from "#config/database";
import { publicTicketResponseSchema } from "#schemas/api";
import { notFoundResponse, serverErrorResponse, successResponse } from "#utils/response";
import { createApiResponseSchema, createFastifySchema } from "#utils/zod-schemas";
import { apiErrorResponseSchema } from "@tickets/shared";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const publicTicketsRoutes: FastifyPluginAsync = async fastify => {
	// Get single ticket information (public)
	fastify.get(
		"/tickets/:id",
		{
			schema: createFastifySchema({
				description: "獲取票券公開資訊",
				tags: ["tickets"],
				params: z.object({
					id: z.string().describe("票券 ID"),
				}),
				response: {
					200: createApiResponseSchema(publicTicketResponseSchema),
					404: apiErrorResponseSchema,
				},
			}),
		},
		async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
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

				const ticketWithStatus = {
					...ticket,
					name: ticket.name as Record<string, string>,
					description: ticket.description as Record<string, string> | null,
					plainDescription: ticket.plainDescription as Record<string, string> | null,
					available,
					isOnSale,
					isSoldOut
				};

				console.log(ticketWithStatus);

				return reply.send(successResponse(ticketWithStatus));
			} catch (error) {
				console.error("Get public ticket info error:", error);
				const { response, statusCode } = serverErrorResponse("取得票券資訊失敗");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default publicTicketsRoutes;
