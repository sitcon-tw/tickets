/**
 * @fileoverview Ticket-related schema definitions
 */

import { dateTimeString, successResponse, errorResponse, idParam } from './common.js';

export const ticketProperties = {
	id: {
		type: 'string',
		description: '票券 ID'
	},
	eventId: {
		type: 'string',
		description: '活動 ID'
	},
	name: {
		type: 'object',
		additionalProperties: true,
		description: '票券名稱 (localized JSON object)'
	},
	description: {
		type: 'object',
		additionalProperties: true,
		description: '票券描述 (localized JSON object)'
	},
	price: {
		type: 'number',
		description: '票價'
	},
	quantity: {
		type: 'integer',
		minimum: 0,
		description: '可售數量'
	},
	soldCount: {
		type: 'integer',
		minimum: 0,
		description: '已售數量'
	},
	saleStart: {
		...dateTimeString,
		description: '開售時間'
	},
	saleEnd: {
		...dateTimeString,
		description: '結束販售時間'
	},
	isActive: {
		type: 'boolean',
		description: '是否啟用'
	},
	requireInviteCode: {
		type: 'boolean',
		description: '是否需要邀請碼'
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

export const ticketCreateBody = {
	type: 'object',
	properties: {
		eventId: {
			type: 'string',
			description: '活動 ID'
		},
		name: {
			type: 'object',
			additionalProperties: true,
			description: '票券名稱 (localized JSON object)'
		},
		description: {
			type: 'object',
			additionalProperties: true,
			description: '票券描述 (localized JSON object)'
		},
		price: {
			type: 'number',
			minimum: 0,
			description: '票價'
		},
		quantity: {
			type: 'integer',
			minimum: 1,
			description: '可售數量'
		},
		saleStart: {
			...dateTimeString,
			description: '開售時間'
		},
		saleEnd: {
			...dateTimeString,
			description: '結束販售時間'
		},
		requireInviteCode: {
			type: 'boolean',
			description: '是否需要邀請碼'
		}
	},
	required: ['eventId', 'name', 'price', 'quantity']
};

export const ticketUpdateBody = {
	type: 'object',
	properties: {
		name: {
			type: 'object',
			additionalProperties: true,
			description: '票券名稱 (localized JSON object)'
		},
		description: {
			type: 'object',
			additionalProperties: true,
			description: '票券描述 (localized JSON object)'
		},
		price: {
			type: 'number',
			minimum: 0,
			description: '票價'
		},
		quantity: {
			type: 'integer',
			minimum: 0,
			description: '可售數量'
		},
		saleStart: {
			...dateTimeString,
			description: '開售時間'
		},
		saleEnd: {
			...dateTimeString,
			description: '結束販售時間'
		},
		isActive: {
			type: 'boolean',
			description: '是否啟用'
		},
		requireInviteCode: {
			type: 'boolean',
			description: '是否需要邀請碼'
		}
	}
};

export const ticketResponse = {
	type: 'object',
	properties: {
		...successResponse.properties,
		data: {
			type: 'object',
			properties: ticketProperties,
			required: ['id', 'eventId', 'name', 'price', 'quantity']
		}
	},
	required: ['success', 'message', 'data']
};

export const ticketsListResponse = {
	type: 'object',
	properties: {
		...successResponse.properties,
		data: {
			type: 'array',
			items: {
				type: 'object',
				properties: ticketProperties
			}
		}
	},
	required: ['success', 'message', 'data']
};

export const ticketSchemas = {
	createTicket: {
		description: '創建新票券',
		tags: ['admin/tickets'],
		body: ticketCreateBody,
		params: undefined,
		querystring: undefined,
		response: {
			201: ticketResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse
		}
	},
	
	getTicket: {
		description: '取得票券詳情',
		tags: ['admin/tickets'],
		body: undefined,
		params: idParam,
		querystring: undefined,
		response: {
			200: ticketResponse,
			404: errorResponse
		}
	},
	
	updateTicket: {
		description: '更新票券',
		tags: ['admin/tickets'],
		body: ticketUpdateBody,
		params: idParam,
		querystring: undefined,
		response: {
			200: ticketResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},
	
	deleteTicket: {
		description: '刪除票券',
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
	
	listTickets: {
		description: '取得票券列表',
		tags: ['admin/tickets'],
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
			200: ticketsListResponse
		}
	}
};