/**
 * @fileoverview Common schema definitions used across multiple endpoints
 */

export const idParam = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			description: '資源 ID'
		}
	},
	required: ['id']
};

export const paginationQuery = {
	type: 'object',
	properties: {
		page: {
			type: 'integer',
			minimum: 1,
			default: 1,
			description: '頁數'
		},
		limit: {
			type: 'integer',
			minimum: 1,
			maximum: 100,
			default: 10,
			description: '每頁項目數'
		}
	}
};

export const searchQuery = {
	type: 'object',
	properties: {
		q: {
			type: 'string',
			description: '搜尋關鍵字'
		},
		sortBy: {
			type: 'string',
			description: '排序欄位'
		},
		sortOrder: {
			type: 'string',
			enum: ['asc', 'desc'],
			default: 'desc',
			description: '排序方向'
		}
	}
};

export const successResponse = {
	type: 'object',
	properties: {
		success: { 
			type: 'boolean',
			const: true 
		},
		message: { 
			type: 'string',
			description: '回應訊息'
		},
		data: {
			description: '回應資料'
		}
	},
	required: ['success', 'message']
};

export const errorResponse = {
	type: 'object',
	properties: {
		success: { 
			type: 'boolean',
			const: false 
		},
		error: {
			type: 'object',
			properties: {
				code: { 
					type: 'string',
					description: '錯誤代碼'
				},
				message: { 
					type: 'string',
					description: '錯誤訊息'
				},
				details: {
					description: '錯誤詳細資訊'
				}
			},
			required: ['code', 'message']
		}
	},
	required: ['success', 'error']
};

export const paginatedResponse = {
	type: 'object',
	properties: {
		...successResponse.properties,
		pagination: {
			type: 'object',
			properties: {
				page: {
					type: 'integer',
					description: '當前頁數'
				},
				limit: {
					type: 'integer',
					description: '每頁項目數'
				},
				total: {
					type: 'integer',
					description: '總項目數'
				},
				totalPages: {
					type: 'integer',
					description: '總頁數'
				},
				hasNext: {
					type: 'boolean',
					description: '是否有下一頁'
				},
				hasPrev: {
					type: 'boolean',
					description: '是否有上一頁'
				}
			},
			required: ['page', 'limit', 'total', 'totalPages', 'hasNext', 'hasPrev']
		}
	},
	required: ['success', 'message', 'pagination']
};

export const dateTimeString = {
	type: 'string',
	format: 'date-time',
	description: 'ISO 8601 日期時間格式'
};

export const statusEnum = {
	type: 'string',
	enum: ['pending', 'confirmed', 'cancelled'],
	description: '狀態'
};

export const roleEnum = {
	type: 'string',
	enum: ['admin', 'checkin', 'viewer'],
	description: '用戶角色'
};