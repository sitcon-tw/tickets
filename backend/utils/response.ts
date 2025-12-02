/**
 * API response type definitions
 */

export interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface ApiResponse<T = any> {
	success: true;
	message: string;
	data: T;
	pagination?: Pagination;
}

export interface ApiError {
	code: string;
	message: string;
	details?: any;
}

export interface ApiErrorResponse {
	success: false;
	error: ApiError;
}

export interface ErrorResponseWithStatus {
	response: ApiErrorResponse;
	statusCode: number;
}

/**
 * Creates a standardized success response
 * @param data - Response data
 * @param message - Success message
 * @param pagination - Pagination info
 * @returns Standardized success response
 */
export const successResponse = <T = any>(data: T = null as T, message: string = "操作成功", pagination: Pagination | null = null): ApiResponse<T> => {
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

/**
 * Creates a standardized error response
 * @param code - Error code
 * @param message - Error message
 * @param details - Additional error details
 * @param statusCode - HTTP status code
 * @returns Error response with status code
 */
export const errorResponse = (code: string, message: string, details: any = null, statusCode: number = 400): ErrorResponseWithStatus => {
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

/**
 * Creates a standardized unauthorized (401) error response
 * @param message - Unauthorized message
 * @returns Unauthorized error response
 */
export const unauthorizedResponse = (message: string = "未授權"): ErrorResponseWithStatus => {
	return errorResponse("UNAUTHORIZED", message, null, 401);
};

/**
 * Creates a standardized forbidden (403) error response
 * @param message - Forbidden message
 * @returns Forbidden error response
 */
export const forbiddenResponse = (message: string = "權限不足"): ErrorResponseWithStatus => {
	return errorResponse("FORBIDDEN", message, null, 403);
};

/**
 * Creates a standardized not found (404) error response
 * @param message - Not found message
 * @returns Not found error response
 */
export const notFoundResponse = (message: string = "資源不存在"): ErrorResponseWithStatus => {
	return errorResponse("NOT_FOUND", message, null, 404);
};

/**
 * Creates a standardized validation error (422) response
 * @param message - Validation error message
 * @param details - Validation error details
 * @returns Validation error response
 */
export const validationErrorResponse = (message: string = "驗證失敗", details: any = null): ErrorResponseWithStatus => {
	return errorResponse("VALIDATION_ERROR", message, details, 422);
};

/**
 * Creates a standardized conflict (409) error response
 * @param message - Conflict message
 * @returns Conflict error response
 */
export const conflictResponse = (message: string = "資源衝突"): ErrorResponseWithStatus => {
	return errorResponse("CONFLICT", message, null, 409);
};

/**
 * Creates a standardized locked (423) error response for disabled accounts
 * @param message - Account disabled message
 * @returns Account locked error response
 */
export const accountDisabledResponse = (message: string = "帳號已停用"): ErrorResponseWithStatus => {
	return errorResponse("ACCOUNT_DISABLED", message, null, 423);
};

/**
 * Creates a standardized internal server error (500) response
 * @param message - Server error message
 * @returns Server error response
 */
export const serverErrorResponse = (message: string = "內部伺服器錯誤"): ErrorResponseWithStatus => {
	return errorResponse("INTERNAL_SERVER_ERROR", message, null, 500);
};

/**
 * Creates pagination metadata
 * @param page - Current page
 * @param limit - Items per page
 * @param total - Total items count
 * @returns Pagination metadata
 */
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
