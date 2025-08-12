import { successResponse, errorResponse } from "../utils/response.js";
import prisma from "../config/database.js";

export default async function publicRoutes(fastify, options) {
  // 活動基本資訊
  fastify.get('/events/:eventId/info', async (request, reply) => {
    try {
      const { eventId } = request.params;
      
      const event = await prisma.event.findUnique({
        where: { id: eventId, isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          location: true,
          startDate: true,
          endDate: true,
          ogImage: true,
          landingPage: true
        }
      });
      
      if (!event) {
        const { response, statusCode } = errorResponse("NOT_FOUND", "活動不存在", null, 404);
        return reply.code(statusCode).send(response);
      }
      
      return successResponse(event);
    } catch (error) {
      console.error('Get event info error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得活動資訊失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });
  
  // 獲取可用票種列表
  fastify.get('/events/:eventId/tickets', async (request, reply) => {
    try {
      const { eventId } = request.params;
      
      const tickets = await prisma.ticket.findMany({
        where: { 
          eventId,
          isActive: true,
          OR: [
            { saleStart: null },
            { saleStart: { lte: new Date() } }
          ],
          OR: [
            { saleEnd: null },
            { saleEnd: { gte: new Date() } }
          ]
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          quantity: true,
          soldCount: true,
          saleStart: true,
          saleEnd: true
        },
        orderBy: { createdAt: 'asc' }
      });
      
      return successResponse(tickets);
    } catch (error) {
      console.error('Get tickets error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得票種列表失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });
  
  // 獲取特定票種的表單欄位
  fastify.get('/events/:eventId/form-fields/:ticketId', async (request, reply) => {
    try {
      const { eventId, ticketId } = request.params;
      
      // Verify ticket belongs to event
      const ticket = await prisma.ticket.findFirst({
        where: { id: ticketId, eventId, isActive: true }
      });
      
      if (!ticket) {
        const { response, statusCode } = errorResponse("NOT_FOUND", "票種不存在", null, 404);
        return reply.code(statusCode).send(response);
      }
      
      const formFields = await prisma.ticketFormField.findMany({
        where: { 
          ticketId,
          isVisible: true,
          field: { isActive: true }
        },
        include: {
          field: {
            select: {
              id: true,
              name: true,
              label: true,
              type: true,
              options: true,
              placeholder: true,
              helpText: true,
              validation: true
            }
          }
        },
        orderBy: { order: 'asc' }
      });
      
      const fields = formFields.map(tf => ({
        ...tf.field,
        isRequired: tf.isRequired,
        order: tf.order
      }));
      
      return successResponse(fields);
    } catch (error) {
      console.error('Get form fields error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得表單欄位失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });
  
  // 驗證邀請碼
  fastify.post('/invitation-codes/verify', async (request, reply) => {
    try {
      const { code, eventId } = request.body;
      
      if (!code || !eventId) {
        const { response, statusCode } = errorResponse("VALIDATION_ERROR", "邀請碼和活動ID為必填");
        return reply.code(statusCode).send(response);
      }
      
      const invitationCode = await prisma.invitationCode.findFirst({
        where: {
          code,
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