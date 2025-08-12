import { requireAdmin } from "../../middleware/auth.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import prisma from "../../config/database.js";

export default async function adminEventsRoutes(fastify, options) {
  // Add auth middleware to all admin routes
  fastify.addHook('preHandler', requireAdmin);

  // 獲取活動詳細資訊
  fastify.get('/events/:eventId',
  { schema: {
    description: '獲取活動詳細資訊',
    tags: ['admin-events'],
  }},
  async (request, reply) => {
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
  fastify.put('/events/:eventId',
  { schema: {
    description: '更新活動資訊',
    tags: ['admin-events'],
  }},
  async (request, reply) => {
    try {
      const { eventId } = request.params;
      const { 
        name, description, startDate, endDate, location, venue,
        organizer, contactPerson, contactEmail, contactPhone, website
      } = request.body;
      
      const event = await prisma.event.update({
        where: { id: eventId },
        data: {
          name, description, location, venue, organizer, 
          contactPerson, contactEmail, contactPhone, website,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
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

  // 更新活動首頁內容
  fastify.put('/events/:eventId/landing-page',
  { schema: {
    description: '更新活動首頁內容',
    tags: ['admin-events'],
  }},
  async (request, reply) => {
    try {
      const { eventId } = request.params;
      const { 
        heroTitle, heroSubtitle, description, schedule, venue,
        ogTitle, ogDescription, features 
      } = request.body;
      
      const landingPageData = {
        heroTitle, heroSubtitle, description, schedule, venue,
        ogTitle, ogDescription, features
      };
      
      const event = await prisma.event.update({
        where: { id: eventId },
        data: {
          landingPage: JSON.stringify(landingPageData),
          updatedAt: new Date()
        }
      });
      
      return successResponse(event, "更新活動首頁內容成功");
    } catch (error) {
      console.error('Update landing page error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "更新活動首頁內容失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 上傳 OG 圖片
  fastify.post('/events/:eventId/og-image',
  { schema: {
    description: '上傳 OG 圖片',
    tags: ['admin-events'],
  }},
  async (request, reply) => {
    try {
      const { eventId } = request.params;
      
      // TODO: Implement OG image upload logic
      return successResponse({ message: "OG 圖片上傳功能尚未實現" });
    } catch (error) {
      console.error('Upload OG image error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "上傳 OG 圖片失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });
}