import { successResponse, errorResponse } from "../../utils/response.js";
import prisma from "../../config/database.js";

export default async function invitationCodesRoutes(fastify, options) {
  // 驗證邀請碼
  fastify.post('/invitation-codes/verify',
  { schema: {
    description: '驗證邀請碼並返回可用票種',
    tags: ['invitation-codes'],
  }},
  async (request, reply) => {
    try {
      const { inviteCode, eventId } = request.body;
      
      if (!inviteCode || !eventId) {
        const { response, statusCode } = errorResponse("VALIDATION_ERROR", "邀請碼和活動ID為必填");
        return reply.code(statusCode).send(response);
      }
      
      const invitationCode = await prisma.invitationCode.findFirst({
        where: {
          code: inviteCode,
          eventId,
          isActive: true,
          OR: [
            { validFrom: null },
            { validFrom: { lte: new Date() } }
          ],
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } }
          ],
          OR: [
            { usageLimit: null },
            { usedCount: { lt: prisma.invitationCode.fields.usageLimit } }
          ]
        },
        include: {
          tickets: {
            include: {
              ticket: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  quantity: true,
                  soldCount: true
                }
              }
            }
          }
        }
      });
      
      if (!invitationCode) {
        const { response, statusCode } = errorResponse("INVALID_CODE", "邀請碼無效或已過期", null, 400);
        return reply.code(statusCode).send(response);
      }
      
      const availableTickets = invitationCode.tickets.map(it => it.ticket);
      
      return successResponse({
        invitationCode: {
          id: invitationCode.id,
          name: invitationCode.name
        },
        availableTickets
      });
    } catch (error) {
      console.error('Verify invitation code error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "驗證邀請碼失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });
}