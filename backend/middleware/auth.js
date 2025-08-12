import { auth } from "../lib/auth.js";
import { unauthorizedResponse, forbiddenResponse } from "../utils/response.js";

export const requireAuth = async (request, reply) => {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });
    
    if (!session) {
      const { response, statusCode } = unauthorizedResponse("請先登入");
      reply.code(statusCode).send(response);
      return;
    }
    
    request.user = session.user;
    request.session = session;
  } catch (error) {
    console.error("Auth middleware error:", error);
    const { response, statusCode } = unauthorizedResponse("認證失敗");
    reply.code(statusCode).send(response);
  }
};

export const requireRole = (allowedRoles) => {
  return async (request, reply) => {
    await requireAuth(request, reply);
    
    if (reply.sent) return; // Auth failed
    
    const userRole = request.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      const { response, statusCode } = forbiddenResponse("權限不足");
      reply.code(statusCode).send(response);
    }
  };
};

export const requirePermission = (permission) => {
  return async (request, reply) => {
    await requireAuth(request, reply);
    
    if (reply.sent) return; // Auth failed
    
    const userPermissions = request.user.permissions ? JSON.parse(request.user.permissions) : [];
    
    if (!userPermissions.includes(permission) && request.user.role !== 'admin') {
      const { response, statusCode } = forbiddenResponse("權限不足");
      reply.code(statusCode).send(response);
    }
  };
};

// Specific role middleware
export const requireAdmin = requireRole(['admin']);
export const requireCheckIn = requireRole(['admin', 'checkin']);
export const requireViewer = requireRole(['admin', 'checkin', 'viewer']);