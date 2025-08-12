import { requireAdmin } from "../../middleware/auth.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import prisma from "../../config/database.js";

export default async function adminTicketsRoutes(fastify, options) {
  // Add auth middleware to all admin routes
  fastify.addHook('preHandler', requireAdmin);

  // 獲取票種列表
  fastify.get('/tickets',
  { schema: {
    description: '獲取票種列表',
    tags: ['admin-tickets'],
  }},
  async (request, reply) => {
    try {
      const { eventId, page = 1, limit = 20 } = request.query;
      const skip = (page - 1) * limit;
      
      const where = eventId ? { eventId } : {};
      
      const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            event: {
              select: { id: true, name: true }
            },
            _count: {
              select: { registrations: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.ticket.count({ where })
      ]);
      
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      };
      
      return successResponse(tickets, "取得票種列表成功", pagination);
    } catch (error) {
      console.error('Get tickets error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得票種列表失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 新增票種
  fastify.post('/tickets',
  { schema: {
    description: '新增票種',
    tags: ['admin-tickets'],
  }},
  async (request, reply) => {
    try {
      const {
        eventId, name, description, price, quantity, maxPerOrder,
        saleStartTime, saleEndTime, isVisible, requireInviteCode,
        isRefundable, refundDeadline
      } = request.body;
      
      if (!eventId || !name || price === undefined || quantity === undefined) {
        const { response, statusCode } = errorResponse("VALIDATION_ERROR", "活動ID、票種名稱、價格和數量為必填");
        return reply.code(statusCode).send(response);
      }
      
      const ticket = await prisma.ticket.create({
        data: {
          eventId,
          name,
          description,
          price: parseFloat(price),
          quantity: parseInt(quantity),
          maxPerOrder: maxPerOrder ? parseInt(maxPerOrder) : 1,
          saleStart: saleStartTime ? new Date(saleStartTime) : null,
          saleEnd: saleEndTime ? new Date(saleEndTime) : null,
          isVisible: Boolean(isVisible),
          requireInviteCode: Boolean(requireInviteCode),
          isRefundable: Boolean(isRefundable),
          refundDeadline: refundDeadline ? new Date(refundDeadline) : null,
          soldCount: 0,
          isActive: true
        },
        include: {
          event: {
            select: { id: true, name: true }
          }
        }
      });
      
      return successResponse(ticket, "新增票種成功");
    } catch (error) {
      console.error('Create ticket error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "新增票種失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 更新票種資訊
  fastify.put('/tickets/:ticketId',
  { schema: {
    description: '更新票種資訊',
    tags: ['admin-tickets'],
  }},
  async (request, reply) => {
    try {
      const { ticketId } = request.params;
      const {
        name, description, price, quantity, maxPerOrder,
        saleStartTime, saleEndTime, isVisible, requireInviteCode,
        isRefundable, refundDeadline
      } = request.body;
      
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (quantity !== undefined) updateData.quantity = parseInt(quantity);
      if (maxPerOrder !== undefined) updateData.maxPerOrder = parseInt(maxPerOrder);
      if (saleStartTime !== undefined) updateData.saleStart = saleStartTime ? new Date(saleStartTime) : null;
      if (saleEndTime !== undefined) updateData.saleEnd = saleEndTime ? new Date(saleEndTime) : null;
      if (isVisible !== undefined) updateData.isVisible = Boolean(isVisible);
      if (requireInviteCode !== undefined) updateData.requireInviteCode = Boolean(requireInviteCode);
      if (isRefundable !== undefined) updateData.isRefundable = Boolean(isRefundable);
      if (refundDeadline !== undefined) updateData.refundDeadline = refundDeadline ? new Date(refundDeadline) : null;
      
      updateData.updatedAt = new Date();
      
      const ticket = await prisma.ticket.update({
        where: { id: ticketId },
        data: updateData,
        include: {
          event: {
            select: { id: true, name: true }
          }
        }
      });
      
      return successResponse(ticket, "更新票種資訊成功");
    } catch (error) {
      console.error('Update ticket error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新票種資訊失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 刪除票種
  fastify.delete('/tickets/:ticketId',
  { schema: {
    description: '刪除票種',
    tags: ['admin-tickets'],
  }},
  async (request, reply) => {
    try {
      const { ticketId } = request.params;
      
      // Check if ticket has any registrations
      const registrationCount = await prisma.registration.count({
        where: { ticketId }
      });
      
      if (registrationCount > 0) {
        const { response, statusCode } = errorResponse("CONFLICT", "此票種已有報名記錄，無法刪除", null, 409);
        return reply.code(statusCode).send(response);
      }
      
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { isActive: false, updatedAt: new Date() }
      });
      
      return successResponse({ message: "票種已刪除" });
    } catch (error) {
      console.error('Delete ticket error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "刪除票種失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 獲取各票種銷售概況
  fastify.get('/tickets/sales-overview',
  { schema: {
    description: '獲取各票種銷售概況',
    tags: ['admin-tickets'],
  }},
  async (request, reply) => {
    try {
      const { eventId } = request.query;
      
      const where = eventId ? { eventId, isActive: true } : { isActive: true };
      
      const tickets = await prisma.ticket.findMany({
        where,
        select: {
          id: true,
          name: true,
          price: true,
          quantity: true,
          soldCount: true,
          saleStart: true,
          saleEnd: true,
          event: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      const salesOverview = tickets.map(ticket => ({
        ...ticket,
        soldPercentage: ticket.quantity > 0 ? (ticket.soldCount / ticket.quantity * 100).toFixed(2) : 0,
        remainingQuantity: ticket.quantity - ticket.soldCount,
        totalRevenue: ticket.soldCount * ticket.price,
        isOnSale: (!ticket.saleStart || ticket.saleStart <= new Date()) && 
                  (!ticket.saleEnd || ticket.saleEnd >= new Date())
      }));
      
      return successResponse(salesOverview);
    } catch (error) {
      console.error('Get sales overview error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得銷售概況失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });
}