import { requireAdmin } from "../../middleware/auth.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import prisma from "../../config/database.js";

export default async function adminRegistrationsRoutes(fastify, options) {
  // Add auth middleware to all admin routes
  fastify.addHook('preHandler', requireAdmin);

  // 獲取報名列表
  fastify.get('/registrations',
  { schema: {
    description: '獲取報名列表（支援分頁、篩選、搜尋）',
    tags: ['admin-registrations'],
  }},
  async (request, reply) => {
    try {
      const {
        page = 1, limit = 20, search, status, ticketId, eventId,
        startDate, endDate, sort = 'createdAt', order = 'desc'
      } = request.query;
      
      const skip = (page - 1) * limit;
      const where = {};
      
      // Apply filters
      if (search) {
        where.OR = [
          { formData: { contains: search } },
          { orderNumber: { contains: search } },
          { checkInId: { contains: search } }
        ];
      }
      
      if (status) where.status = status;
      if (ticketId) where.ticketId = ticketId;
      if (eventId) where.ticket = { eventId };
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }
      
      const [registrations, total] = await Promise.all([
        prisma.registration.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            ticket: {
              select: { id: true, name: true, event: { select: { id: true, name: true } } }
            }
          },
          orderBy: { [sort]: order }
        }),
        prisma.registration.count({ where })
      ]);
      
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      };
      
      return successResponse(registrations, "取得報名列表成功", pagination);
    } catch (error) {
      console.error('Get registrations error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得報名列表失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 獲取單筆報名詳細資料
  fastify.get('/registrations/:regId',
  { schema: {
    description: '獲取單筆報名詳細資料',
    tags: ['admin-registrations'],
  }},
  async (request, reply) => {
    try {
      const { regId } = request.params;
      
      const registration = await prisma.registration.findUnique({
        where: { id: regId },
        include: {
          ticket: {
            include: {
              event: { select: { id: true, name: true } }
            }
          },
          referrer: {
            select: { id: true, orderNumber: true, formData: true }
          },
          referrals: {
            select: { id: true, orderNumber: true, formData: true, status: true }
          }
        }
      });
      
      if (!registration) {
        const { response, statusCode } = errorResponse("NOT_FOUND", "報名記錄不存在", null, 404);
        return reply.code(statusCode).send(response);
      }
      
      return successResponse(registration);
    } catch (error) {
      console.error('Get registration error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得報名詳細資料失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 管理員編輯報名資料
  fastify.put('/registrations/:regId',
  { schema: {
    description: '管理員編輯報名資料',
    tags: ['admin-registrations'],
  }},
  async (request, reply) => {
    try {
      const { regId } = request.params;
      const { formData, adminNote } = request.body;
      
      if (!formData) {
        const { response, statusCode } = errorResponse("VALIDATION_ERROR", "表單資料為必填");
        return reply.code(statusCode).send(response);
      }
      
      const registration = await prisma.registration.update({
        where: { id: regId },
        data: {
          formData: JSON.stringify(formData),
          adminNote,
          updatedAt: new Date()
        },
        include: {
          ticket: {
            include: {
              event: { select: { id: true, name: true } }
            }
          }
        }
      });
      
      return successResponse(registration, "編輯報名資料成功");
    } catch (error) {
      console.error('Update registration error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "編輯報名資料失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 取消單筆報名
  fastify.delete('/registrations/:regId',
  { schema: {
    description: '取消單筆報名',
    tags: ['admin-registrations'],
  }},
  async (request, reply) => {
    try {
      const { regId } = request.params;
      const { reason } = request.body;
      
      const registration = await prisma.registration.update({
        where: { id: regId },
        data: {
          status: 'cancelled',
          cancelReason: reason,
          cancelledAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // TODO: Update ticket sold count if needed
      
      return successResponse(registration, "取消報名成功");
    } catch (error) {
      console.error('Cancel registration error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取消報名失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 發送取消通知給報名者
  fastify.post('/registrations/:regId/cancel-notification',
  { schema: {
    description: '發送取消通知給報名者',
    tags: ['admin-registrations'],
  }},
  async (request, reply) => {
    try {
      const { regId } = request.params;
      const { reason, customMessage, includeRefundInfo } = request.body;
      
      // TODO: Implement email notification logic
      return successResponse({ message: "取消通知已發送" });
    } catch (error) {
      console.error('Send cancel notification error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "發送取消通知失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 報名編輯管理 - 獲取編輯請求記錄
  fastify.get('/edit-requests',
  { schema: {
    description: '獲取編輯請求記錄',
    tags: ['admin-registrations'],
  }},
  async (request, reply) => {
    try {
      const { page = 1, limit = 20 } = request.query;
      const skip = (page - 1) * limit;
      
      // TODO: Implement edit requests tracking
      const editRequests = [];
      const total = 0;
      
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      };
      
      return successResponse(editRequests, "取得編輯請求記錄成功", pagination);
    } catch (error) {
      console.error('Get edit requests error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得編輯請求記錄失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 管理員手動發送編輯連結
  fastify.post('/edit-requests/:regId/send-link',
  { schema: {
    description: '管理員手動發送編輯連結',
    tags: ['admin-registrations'],
  }},
  async (request, reply) => {
    try {
      const { regId } = request.params;
      
      // TODO: Implement manual edit link sending
      return successResponse({ message: "編輯連結已發送" });
    } catch (error) {
      console.error('Send edit link error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "發送編輯連結失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 獲取編輯稽核記錄
  fastify.get('/edit-requests/audit-log',
  { schema: {
    description: '獲取編輯稽核記錄',
    tags: ['admin-registrations'],
  }},
  async (request, reply) => {
    try {
      const { page = 1, limit = 20 } = request.query;
      
      // TODO: Implement audit log retrieval
      return successResponse([], "取得編輯稽核記錄成功");
    } catch (error) {
      console.error('Get audit log error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得編輯稽核記錄失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 更新編輯功能設定
  fastify.put('/edit-settings',
  { schema: {
    description: '更新編輯功能設定（開關、期限等）',
    tags: ['admin-registrations'],
  }},
  async (request, reply) => {
    try {
      const settings = request.body;
      
      // TODO: Implement edit settings update
      return successResponse(settings, "編輯功能設定更新成功");
    } catch (error) {
      console.error('Update edit settings error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新編輯功能設定失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });
}