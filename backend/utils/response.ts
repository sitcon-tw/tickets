export interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface ApiResponse<T> {
	success: true;
	message: string;
	data: T;
}

export interface ApiPaginatedResponse<T> extends ApiResponse<T> {
	pagination: Pagination;
}

export interface ApiError {
	code: string;
	message: string;
	details?: unknown;
}

export interface ApiErrorResponse {
	success: false;
	error: ApiError;
}

export interface ErrorResponseWithStatus<C extends number> {
	response: ApiErrorResponse;
	statusCode: C;
}

export const successResponse = <T>(data: T, message: string = "操作成功"): ApiResponse<T> => {
	const response: ApiResponse<T> = {
		success: true,
		message,
		data
	};

	return response;
};

export const successPaginatedResponse = <T>(data: T, message: string = "操作成功", pagination: Pagination): ApiPaginatedResponse<T> => {
	return {
		...successResponse(data, message),
		pagination
	};
};

export const errorResponse = <C extends number>(code: string, message: string, details: unknown = null, statusCode: C): ErrorResponseWithStatus<C> => {
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

export const unauthorizedResponse = (message: string = "未授權") => {
	return errorResponse("UNAUTHORIZED", message, null, 401);
};

export const forbiddenResponse = (message: string = "權限不足") => {
	return errorResponse("FORBIDDEN", message, null, 403);
};

export const notFoundResponse = (message: string = "資源不存在") => {
	return errorResponse("NOT_FOUND", message, null, 404);
};

export const validationErrorResponse = (message: string = "驗證失敗", details: unknown = null) => {
	return errorResponse("VALIDATION_ERROR", message, details, 422);
};

export const conflictResponse = (message: string = "資源衝突") => {
	return errorResponse("CONFLICT", message, null, 409);
};

export const accountDisabledResponse = (message: string = "帳號已停用") => {
	return errorResponse("ACCOUNT_DISABLED", message, null, 423);
};

export const serverErrorResponse = (message: string = "內部伺服器錯誤") => {
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
