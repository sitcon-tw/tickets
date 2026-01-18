import prisma from "#config/database";
import { notFoundResponse, serverErrorResponse, successResponse } from "#utils/response";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod/v4";

const publicTicketsRoutes: FastifyPluginAsync = async fastify => {
	// Get single ticket information (public)
	fastify.get(
		"/tickets/:id",
		{
			schema: {
				description: "獲取票券公開資訊",
				tags: ["tickets"],
				params: z.object({
					id: z.string()
				}),
				response: {
					200: z.object({
						success: z.boolean(),
						message: z.string().optional(),
						data: z.object({
							id: z.string(),
							name: z.record(z.string(), z.unknown()),
							description: z.record(z.string(), z.unknown()),
							plainDescription: z.record(z.string(), z.unknown()).nullable(),
							price: z.number(),
							quantity: z.number().int(),
							soldCount: z.number().int(),
							available: z.number().int(),
							saleStart: z.string().nullable(),
							saleEnd: z.string().nullable(),
							isOnSale: z.boolean(),
							isSoldOut: z.boolean(),
							requireInviteCode: z.boolean(),
							requireSmsVerification: z.boolean()
						}).optional()
					}),
					404: z.object({
						success: z.boolean(),
						error: z.object({
							code: z.string(),
							message: z.string()
						}).optional()
					})
				}
			}
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
					available,
					isOnSale,
					isSoldOut
				};

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
