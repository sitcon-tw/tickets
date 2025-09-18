/**
 * @fileoverview TicketFromFields-related schema definitions
 */

import { successResponse, errorResponse, idParam } from './common.js';

export const ticketFormFieldProperties = {
	id: {
		type: 'string',
		description: '表單欄位 ID'
	},
	ticketId: {
		type: 'string',
		description: '票券 ID'
	},
	order: {
		type: 'integer',
		minimum: 0,
		description: '欄位排序'
	},
	type: {
		type: 'string',
		enum: ['text', 'textarea', 'select', 'checkbox', 'radio'],
		description: '欄位類型'
	},
	validater: {
		type: 'string',
		description: '驗證規則（正規表達式）'
	},
	name: {
		type: 'string',
		description: '欄位名稱'
	},
	description: {
		type: 'string',
		description: '欄位標籤'
	},
	placeholder: {
		type: 'string',
		description: '欄位提示文字'
	},
	required: {
		type: 'boolean',
		description: '是否必填'
	},
	values: {
		type: 'string',
		description: '選項值（JSON 陣列，用於 select、radio 類型）'
	}
};

export const ticketFormFieldCreateBody = {
	type: 'object',
	properties: {
		ticketId: {
			type: 'string',
			description: '票券 ID'
		},
		order: {
			type: 'integer',
			minimum: 0,
			description: '欄位排序'
		},
		type: {
			type: 'string',
			enum: ['text', 'textarea', 'select', 'checkbox', 'radio'],
			description: '欄位類型'
		},
		validater: {
			type: 'string',
			description: '驗證規則（正規表達式）'
		},
		name: {
			type: 'string',
			minLength: 1,
			description: '欄位名稱'
		},
		description: {
			type: 'string',
			minLength: 1,
			description: '欄位標籤'
		},
		placeholder: {
			type: 'string',
			description: '欄位提示文字'
		},
		required: {
			type: 'boolean',
			default: false,
			description: '是否必填'
		},
		values: {
			type: 'string',
			description: '選項值（JSON 陣列，用於 select、radio 類型）'
		}
	},
	required: ['ticketId', 'order', 'type', 'name']
};

export const ticketFormFieldUpdateBody = {
	type: 'object',
	properties: {
		order: {
			type: 'integer',
			minimum: 0,
			description: '欄位排序'
		},
		type: {
			type: 'string',
			enum: ['text', 'textarea', 'select', 'checkbox', 'radio'],
			description: '欄位類型'
		},
		validater: {
			type: 'string',
			description: '驗證規則（正規表達式）'
		},
		name: {
			type: 'string',
			minLength: 1,
			description: '欄位名稱'
		},
		description: {
			type: 'string',
			minLength: 1,
			description: '欄位標籤'
		},
		placeholder: {
			type: 'string',
			description: '欄位提示文字'
		},
		required: {
			type: 'boolean',
			description: '是否必填'
		},
		values: {
			type: 'string',
			description: '選項值（JSON 陣列，用於 select、radio 類型）'
		}
	}
};

export const ticketFormFieldResponse = {
	type: 'object',
	properties: {
		...successResponse.properties,
		data: {
			type: 'object',
			properties: ticketFormFieldProperties,
			required: ['id', 'ticketId', 'order', 'type', 'name']
		}
	},
	required: ['success', 'message', 'data']
};

export const ticketFormFieldsListResponse = {
	type: 'object',
	properties: {
		...successResponse.properties,
		data: {
			type: 'array',
			items: {
				type: 'object',
				properties: ticketFormFieldProperties
			}
		}
	},
	required: ['success', 'message', 'data']
};

export const ticketFormFieldSchemas = {
	createTicketFormField: {
		description: '創建票券表單欄位',
		tags: ['admin/tickets'],
		body: ticketFormFieldCreateBody,
		params: undefined,
		querystring: undefined,
		response: {
			201: ticketFormFieldResponse,
			400: {
				oneOf: [
					errorResponse,
					{
						type: 'object',
						properties: {
							statusCode: { type: 'number' },
							code: { type: 'string' },
							error: { type: 'string' },
							message: { type: 'string' },
							validation: { type: 'array' },
							validationContext: { type: 'string' }
						}
					}
				]
			},
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	getTicketFormField: {
		description: '取得票券表單欄位詳情',
		tags: ['admin/tickets'],
		body: undefined,
		params: idParam,
		querystring: undefined,
		response: {
			200: ticketFormFieldResponse,
			404: errorResponse
		}
	},

	updateTicketFormField: {
		description: '更新票券表單欄位',
		tags: ['admin/tickets'],
		body: ticketFormFieldUpdateBody,
		params: idParam,
		querystring: undefined,
		response: {
			200: ticketFormFieldResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	deleteTicketFormField: {
		description: '刪除票券表單欄位',
		tags: ['admin/tickets'],
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

	listTicketFormFields: {
		description: '取得票券表單欄位列表',
		tags: ['admin/tickets'],
		body: undefined,
		params: undefined,
		querystring: {
			type: 'object',
			properties: {
				ticketId: {
					type: 'string',
					description: '篩選票券 ID'
				}
			}
		},
		response: {
			200: ticketFormFieldsListResponse
		}
	}
};