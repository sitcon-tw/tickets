import { requireAdmin, requireViewer } from "../middleware/auth.js";
import { successResponse, errorResponse } from "../utils/response.js";
import prisma from "../config/database.js";

export default async function adminRoutes(fastify, options) {
  // Add auth middleware to all admin routes
  fastify.addHook('preHandler', requireAdmin);
  
  // 獲取當前用戶權限
  fastify.get('/permissions', async (request, reply) => {
    try {
      const user = request.user;
      const permissions = user.permissions ? JSON.parse(user.permissions) : [];
      
      return successResponse({
        userId: user.id,
        role: user.role,
        permissions,
        isActive: user.isActive
      });
    } catch (error) {
      console.error('Get permissions error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得權限資訊失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });
  
  // 使用者管理
  fastify.get('/users', async (request, reply) => {
    try {
      const { page = 1, limit = 20 } = request.query;
      const skip = (page - 1) * limit;
      
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: parseInt(limit),
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count()
      ]);
      
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      };
      
      return successResponse(users, "取得管理員列表成功", pagination);
    } catch (error) {
      console.error('Get users error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得管理員列表失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });
  
  // 更新管理員角色
  fastify.put('/users/:userId/role', async (request, reply) => {
    try {
      const { userId } = request.params;
      const { role, permissions = [] } = request.body;
      
      if (!['admin', 'checkin', 'viewer'].includes(role)) {
        const { response, statusCode } = errorResponse("VALIDATION_ERROR", "無效的角色");
        return reply.code(statusCode).send(response);
      }
      
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          role,
          permissions: JSON.stringify(permissions),
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          isActive: true
        }
      });
      
      return successResponse(user, "更新管理員角色成功");
    } catch (error) {
      console.error('Update user role error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新管理員角色失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });
  
  // 啟用/停用管理員
  fastify.put('/users/:userId/status', async (request, reply) => {
    try {
      const { userId } = request.params;
      const { isActive } = request.body;
      
      if (userId === request.user.id) {
        const { response, statusCode } = errorResponse("FORBIDDEN", "無法停用自己的帳號", null, 403);
        return reply.code(statusCode).send(response);
      }
      
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: Boolean(isActive),
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        }
      });
      
      return successResponse(user, `${isActive ? '啟用' : '停用'}管理員成功`);
    } catch (error) {
      console.error('Update user status error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新管理員狀態失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });
  
  // 活動管理
  fastify.get('/events/:eventId', async (request, reply) => {
    try {
      const { eventId } = request.params;
      
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          tickets: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' }
          },
          _count: {
            select: {
              registrations: true,
              invitationCodes: true
            }
          }
        }
      });
      
      if (!event) {
        const { response, statusCode } = errorResponse("NOT_FOUND", "活動不存在", null, 404);
        return reply.code(statusCode).send(response);
      }
      
      return successResponse(event);
    } catch (error) {
      console.error('Get event error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "取得活動資訊失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });
  
  // 更新活動資訊
  fastify.put('/events/:eventId', async (request, reply) => {
    try {
      const { eventId } = request.params;
      const { name, description, location, startDate, endDate, ogImage, landingPage } = request.body;
      
      const event = await prisma.event.update({
        where: { id: eventId },
        data: {
          name,
          description,
          location,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          ogImage,
          landingPage,
          updatedAt: new Date()
        }
      });
      
      return successResponse(event, "更新活動資訊成功");
    } catch (error) {
      console.error('Update event error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新活動資訊失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });
}