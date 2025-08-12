export const successResponse = (data = null, message = "操作成功", pagination = null) => {
  const response = {
    success: true,
    message,
    data
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  return response;
};

export const errorResponse = (code, message, details = null, statusCode = 400) => {
  const response = {
    success: false,
    error: {
      code,
      message
    }
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return { response, statusCode };
};

export const validationErrorResponse = (details) => {
  return errorResponse("VALIDATION_ERROR", "表單驗證失敗", details);
};

export const notFoundResponse = (resource = "資源") => {
  return errorResponse("NOT_FOUND", `${resource}不存在`, null, 404);
};

export const unauthorizedResponse = (message = "未授權訪問") => {
  return errorResponse("UNAUTHORIZED", message, null, 401);
};

export const forbiddenResponse = (message = "權限不足") => {
  return errorResponse("FORBIDDEN", message, null, 403);
};