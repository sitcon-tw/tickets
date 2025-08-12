import { requireCheckIn } from "../middleware/auth.js";
import { successResponse, errorResponse } from "../utils/response.js";
import prisma from "../config/database.js";

export default async function checkinRoutes(fastify, options) {
  // Add checkin auth middleware
  fastify.addHook('preHandler', requireCheckIn);

  // 搜尋報名者
  fastify.get('/registrations/search',
  { schema: {
    description: '搜尋報名者（支援多種搜尋方式）',
    tags: ['checkin'],
  }},
  async (request, reply) => {
    try {
      const { q, type = 'all' } = request.query;
      
      if (!q) {
        const { response, statusCode } = errorResponse("VALIDATION_ERROR", "搜尋關鍵字為必填");
        return reply.code(statusCode).send(response);
      }
      
      // TODO: Implement registration search logic
      return successResponse([]);
    } catch (error) {
      console.error('Search registrations error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "搜尋報名者失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 執行簽到
  fastify.post('/registrations/:regId/checkin',
  { schema: {
    description: '執行簽到',
    tags: ['checkin'],
  }},
  async (request, reply) => {
    try {
      const { regId } = request.params;
      const { checkInTime, note, staffId } = request.body;
      
      // TODO: Implement checkin logic
      return successResponse({ message: "簽到成功" });
    } catch (error) {
      console.error('Checkin error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "簽到失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 獲取簽到狀態
  fastify.get('/registrations/:regId/status',
  { schema: {
    description: '獲取簽到狀態',
    tags: ['checkin'],
  }},
  async (request, reply) => {
    try {
      const { regId } = request.params;
      
      // TODO: Implement get checkin status logic
      return successResponse({ checkedIn: false });
    } catch (error) {
      console.error('Get checkin status error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取簽到狀態失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 簽到統計資訊
  fastify.get('/stats',
  { schema: {
    description: '簽到統計資訊',
    tags: ['checkin'],
  }},
  async (request, reply) => {
    try {
      // TODO: Implement checkin stats logic
      return successResponse({
        totalRegistrations: 0,
        checkedIn: 0,
        checkedInPercentage: 0
      });
    } catch (error) {
      console.error('Get checkin stats error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取簽到統計失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 驗證 QR Code
  fastify.post('/qr-verify',
  { schema: {
    description: '驗證 QR Code 並返回報名者資訊',
    tags: ['checkin'],
  }},
  async (request, reply) => {
    try {
      const { qrData, autoCheckIn = false } = request.body;
      
      if (!qrData) {
        const { response, statusCode } = errorResponse("VALIDATION_ERROR", "QR Code 資料為必填");
        return reply.code(statusCode).send(response);
      }
      
      // TODO: Implement QR code verification logic
      return successResponse({ valid: true, registration: {} });
    } catch (error) {
      console.error('QR verify error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "驗證 QR Code 失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });

  // 透過 Check-in ID 獲取報名者資訊
  fastify.get('/qr/:checkInId',
  { schema: {
    description: '透過 Check-in ID 獲取報名者資訊',
    tags: ['checkin'],
  }},
  async (request, reply) => {
    try {
      const { checkInId } = request.params;
      
      // TODO: Implement get registration by checkin ID logic
      return successResponse({ registration: {} });
    } catch (error) {
      console.error('Get registration by checkin ID error:', error);
      const { response, statusCode } = errorResponse("INTERNAL_ERROR", "獲取報名者資訊失敗", null, 500);
      return reply.code(statusCode).send(response);
    }
  });
}