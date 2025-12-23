/**
 * API Response utilities
 * Types are imported from shared package
 */
import type { Pagination, ApiResponse, ApiError, ApiErrorResponse, ErrorResponseWithStatus } from "@tickets/shared";

export type { Pagination, ApiResponse, ApiError, ApiErrorResponse, ErrorResponseWithStatus };

export const successResponse = <T = unknown>(data: T = null as T, message: string = "操作成功", pagination: Pagination | null = null): ApiResponse<T> => {
	const response: ApiResponse<T> = {
		success: true,
		message,
		data
	};

	if (pagination) {
		response.pagination = pagination;
	}

	return response;
};

export const errorResponse = (code: string, message: string, details: unknown = null, statusCode: number = 400): ErrorResponseWithStatus => {
	const response: ApiErrorResponse = {
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

export const unauthorizedResponse = (message: string = "未授權"): ErrorResponseWithStatus => {
	return errorResponse("UNAUTHORIZED", message, null, 401);
};

export const forbiddenResponse = (message: string = "權限不足"): ErrorResponseWithStatus => {
	return errorResponse("FORBIDDEN", message, null, 403);
};

export const notFoundResponse = (message: string = "資源不存在"): ErrorResponseWithStatus => {
	return errorResponse("NOT_FOUND", message, null, 404);
};

export const validationErrorResponse = (message: string = "驗證失敗", details: unknown = null): ErrorResponseWithStatus => {
	return errorResponse("VALIDATION_ERROR", message, details, 422);
};

export const conflictResponse = (message: string = "資源衝突"): ErrorResponseWithStatus => {
	return errorResponse("CONFLICT", message, null, 409);
};

export const accountDisabledResponse = (message: string = "帳號已停用"): ErrorResponseWithStatus => {
	return errorResponse("ACCOUNT_DISABLED", message, null, 423);
};

export const serverErrorResponse = (message: string = "內部伺服器錯誤"): ErrorResponseWithStatus => {
	return errorResponse("INTERNAL_SERVER_ERROR", message, null, 500);
};

export const createPagination = (page: number, limit: number, total: number): Pagination => {
	const totalPages = Math.ceil(total / limit);
	return {
		page,
		limit,
		total,
		totalPages,
		hasNext: page < totalPages,
		hasPrev: page > 1
	};
};
