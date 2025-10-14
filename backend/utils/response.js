/**
 * @typedef {import('../types/api.js').ApiResponse} ApiResponse
 * @typedef {import('../types/api.js').ApiErrorResponse} ApiErrorResponse
 * @typedef {import('../types/api.js').Pagination} Pagination
 */

/**
 * Creates a standardized success response
 * @param {*} [data=null] - Response data
 * @param {string} [message="操作成功"] - Success message
 * @param {Pagination} [pagination=null] - Pagination info
 * @returns {ApiResponse} Standardized success response
 */
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

/**
 * Creates a standardized error response
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {*} [details=null] - Additional error details
 * @param {number} [statusCode=400] - HTTP status code
 * @returns {{response: ApiErrorResponse, statusCode: number}} Error response with status code
 */
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

/**
 * Creates a standardized unauthorized (401) error response
 * @param {string} [message="未授權"] - Unauthorized message
 * @returns {{response: ApiErrorResponse, statusCode: number}} Unauthorized error response
 */
export const unauthorizedResponse = (message = "未授權") => {
	return errorResponse("UNAUTHORIZED", message, null, 401);
};

/**
 * Creates a standardized forbidden (403) error response
 * @param {string} [message="權限不足"] - Forbidden message
 * @returns {{response: ApiErrorResponse, statusCode: number}} Forbidden error response
 */
export const forbiddenResponse = (message = "權限不足") => {
	return errorResponse("FORBIDDEN", message, null, 403);
};

/**
 * Creates a standardized not found (404) error response
 * @param {string} [message="資源不存在"] - Not found message
 * @returns {{response: ApiErrorResponse, statusCode: number}} Not found error response
 */
export const notFoundResponse = (message = "資源不存在") => {
	return errorResponse("NOT_FOUND", message, null, 404);
};

/**
 * Creates a standardized validation error (422) response
 * @param {string} [message="驗證失敗"] - Validation error message
 * @param {Object} [details=null] - Validation error details
 * @returns {{response: ApiErrorResponse, statusCode: number}} Validation error response
 */
export const validationErrorResponse = (message = "驗證失敗", details = null) => {
	return errorResponse("VALIDATION_ERROR", message, details, 422);
};

/**
 * Creates a standardized conflict (409) error response
 * @param {string} [message="資源衝突"] - Conflict message
 * @returns {{response: ApiErrorResponse, statusCode: number}} Conflict error response
 */
export const conflictResponse = (message = "資源衝突") => {
	return errorResponse("CONFLICT", message, null, 409);
};

/**
 * Creates a standardized locked (423) error response for disabled accounts
 * @param {string} [message="帳號已停用"] - Account disabled message
 * @returns {{response: ApiErrorResponse, statusCode: number}} Account locked error response
 */
export const accountDisabledResponse = (message = "帳號已停用") => {
	return errorResponse("ACCOUNT_DISABLED", message, null, 423);
};

/**
 * Creates a standardized internal server error (500) response
 * @param {string} [message="內部伺服器錯誤"] - Server error message
 * @returns {{response: ApiErrorResponse, statusCode: number}} Server error response
 */
export const serverErrorResponse = (message = "內部伺服器錯誤") => {
	return errorResponse("INTERNAL_SERVER_ERROR", message, null, 500);
};

/**
 * Creates pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items count
 * @returns {Pagination} Pagination metadata
 */
export const createPagination = (page, limit, total) => {
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
