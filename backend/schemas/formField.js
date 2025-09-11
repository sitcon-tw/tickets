/**
 * @fileoverview Form field-related schema definitions
 */

import { dateTimeString, successResponse, errorResponse, idParam } from './common.js';

export const fieldTypeEnum = {
	type: 'string',
	enum: ['text', 'email', 'phone', 'textarea', 'select', 'radio', 'checkbox'],
	description: '欄位類型'
};

export const formFieldProperties = {
	id: {
		type: 'string',
		description: '表單欄位 ID'
	},
	eventId: {
		type: 'string',
		description: '活動 ID'
	},
	name: {
		type: 'string',
		description: '欄位名稱/鍵值'
	},
	label: {
		type: 'string',
		description: '顯示標籤'
	},
	type: {
		...fieldTypeEnum,
		description: '欄位類型'
	},
	isRequired: {
		type: 'boolean',
		description: '是否必填'
	},
	options: {
		type: 'array',
		items: { type: 'string' },
		description: '選項列表（適用於 select/radio/checkbox）'
	},
	validation: {
		type: 'object',
		properties: {
			minLength: {
				type: 'integer',
				minimum: 0,
				description: '最小長度'
			},
			maxLength: {
				type: 'integer',
				minimum: 1,
				description: '最大長度'
			},
			pattern: {
				type: 'string',
				description: '驗證正則表達式'
			},
			customMessage: {
				type: 'string',
				description: '自訂錯誤訊息'
			}
		},
		description: '驗證規則'
	},
	order: {
		type: 'integer',
		minimum: 0,
		description: '顯示順序'
	},
	isActive: {
		type: 'boolean',
		description: '是否啟用'
	},
	createdAt: {
		...dateTimeString,
		description: '建立時間'
	},
	updatedAt: {
		...dateTimeString,
		description: '更新時間'
	}
};

export const formFieldCreateBody = {
	type: 'object',
	properties: {
		eventId: {
			type: 'string',
			description: '活動 ID'
		},
		name: {
			type: 'string',
			description: '欄位名稱/鍵值',
			minLength: 1
		},
		label: {
			type: 'string',
			description: '顯示標籤',
			minLength: 1
		},
		type: {
			...fieldTypeEnum,
			description: '欄位類型'
		},
		isRequired: {
			type: 'boolean',
			description: '是否必填',
			default: false
		},
		options: {
			type: 'array',
			items: { type: 'string' },
			description: '選項列表'
		},
		validation: {
			type: 'object',
			properties: {
				minLength: {
					type: 'integer',
					minimum: 0
				},
				maxLength: {
					type: 'integer',
					minimum: 1
				},
				pattern: {
					type: 'string'
				},
				customMessage: {
					type: 'string'
				}
			},
			description: '驗證規則'
		},
		order: {
			type: 'integer',
			minimum: 0,
			description: '顯示順序'
		}
	},
	required: ['eventId', 'name', 'label', 'type']
};

export const formFieldUpdateBody = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
			description: '欄位名稱/鍵值',
			minLength: 1
		},
		label: {
			type: 'string',
			description: '顯示標籤',
			minLength: 1
		},
		type: {
			...fieldTypeEnum,
			description: '欄位類型'
		},
		isRequired: {
			type: 'boolean',
			description: '是否必填'
		},
		options: {
			type: 'array',
			items: { type: 'string' },
			description: '選項列表'
		},
		validation: {
			type: 'object',
			properties: {
				minLength: {
					type: 'integer',
					minimum: 0
				},
				maxLength: {
					type: 'integer',
					minimum: 1
				},
				pattern: {
					type: 'string'
				},
				customMessage: {
					type: 'string'
				}
			},
			description: '驗證規則'
		},
		order: {
			type: 'integer',
			minimum: 0,
			description: '顯示順序'
		},
		isActive: {
			type: 'boolean',
			description: '是否啟用'
		}
	}
};

export const formFieldResponse = {
	type: 'object',
	properties: {
		...successResponse.properties,
		data: {
			type: 'object',
			properties: formFieldProperties,
			required: ['id', 'eventId', 'name', 'label', 'type']
		}
	},
	required: ['success', 'message', 'data']
};

export const formFieldsListResponse = {
	type: 'object',
	properties: {
		...successResponse.properties,
		data: {
			type: 'array',
			items: {
				type: 'object',
				properties: formFieldProperties
			}
		}
	},
	required: ['success', 'message', 'data']
};

export const formFieldSchemas = {
	createFormField: {
		description: '創建新表單欄位',
		tags: ['admin/form-fields'],
		body: formFieldCreateBody,
		params: undefined,
		querystring: undefined,
		response: {
			201: formFieldResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse
		}
	},
	
	getFormField: {
		description: '取得表單欄位詳情',
		tags: ['admin/form-fields'],
		body: undefined,
		params: idParam,
		querystring: undefined,
		response: {
			200: formFieldResponse,
			404: errorResponse
		}
	},
	
	updateFormField: {
		description: '更新表單欄位',
		tags: ['admin/form-fields'],
		body: formFieldUpdateBody,
		params: idParam,
		querystring: undefined,
		response: {
			200: formFieldResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},
	
	deleteFormField: {
		description: '刪除表單欄位',
		tags: ['admin/form-fields'],
		body: undefined,
		params: idParam,
		querystring: undefined,
		response: {
			200: successResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},
	
	listFormFields: {
		description: '取得表單欄位列表',
		tags: ['admin/form-fields'],
		body: undefined,
		params: undefined,
		querystring: {
			type: 'object',
			properties: {
				eventId: {
					type: 'string',
					description: '篩選活動 ID'
				},
				isActive: {
					type: 'boolean',
					description: '篩選啟用狀態'
				}
			}
		},
		response: {
			200: formFieldsListResponse
		}
	}
};