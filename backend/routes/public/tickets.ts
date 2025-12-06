import prisma from "#config/database";
import { notFoundResponse, serverErrorResponse, successResponse } from "#utils/response";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

const publicTicketsRoutes: FastifyPluginAsync = async fastify => {
	// Get single ticket information (public)
	fastify.get(
		"/tickets/:id",
		{
			schema: {
				description: "獲取票券公開資訊",
				tags: ["tickets"],
				params: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "票券 ID"
						}
					},
					required: ["id"]
				},
				response: {
					200: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							message: { type: "string" },
							data: {
								type: "object",
								properties: {
									id: { type: "string" },
									name: { type: "object", additionalProperties: true },
									description: { type: "object", additionalProperties: true },
									plainDescription: { type: "object", additionalProperties: true },
									price: { type: "number" },
									quantity: { type: "integer" },
									soldCount: { type: "integer" },
									available: { type: "integer" },
									saleStart: { type: "string" },
									saleEnd: { type: "string" },
									isOnSale: { type: "boolean" },
									isSoldOut: { type: "boolean" },
									requireInviteCode: { type: "boolean" },
									requireSmsVerification: { type: "boolean" }
								}
							}
						}
					},
					404: {
						type: "object",
						properties: {
							success: { type: "boolean" },
							error: {
								type: "object",
								properties: {
									code: { type: "string" },
									message: { type: "string" }
								}
							}
						}
					}
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
