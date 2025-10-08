/**
 * @fileoverview Event-related schema definitions
 */

import { dateTimeString, successResponse, errorResponse, idParam } from './common.js';

export const eventProperties = {
	id: {
		type: 'string',
		description: '活動 ID'
	},
	name: {
		type: 'object',
		additionalProperties: true,
		description: '活動名稱 (localized JSON object)'
	},
	description: {
		type: 'object',
		additionalProperties: true,
		description: '活動描述 (localized JSON object)'
	},
	location: {
		type: 'string',
		description: '活動地點'
	},
	startDate: {
		...dateTimeString,
		description: '開始時間'
	},
	endDate: {
		...dateTimeString,
		description: '結束時間'
	},
	ogImage: {
		type: 'string',
		description: 'Open Graph 圖片 URL'
	},
	landingPage: {
		type: 'string',
		description: '登陸頁面 JSON 內容'
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

export const eventCreateBody = {
	type: 'object',
	properties: {
		name: {
			type: 'object',
			additionalProperties: true,
			description: '活動名稱 (localized JSON object)'
		},
		description: {
			type: 'object',
			additionalProperties: true,
			description: '活動描述 (localized JSON object)'
		},
		startDate: {
			...dateTimeString,
			description: '開始時間'
		},
		endDate: {
			...dateTimeString,
			description: '結束時間'
		},
		location: {
			type: 'string',
			description: '地點'
		}
	},
	required: ['name', 'startDate', 'endDate']
};

export const eventUpdateBody = {
	type: 'object',
	properties: {
		name: {
			type: 'object',
			additionalProperties: true,
			description: '活動名稱 (localized JSON object)'
		},
		description: {
			type: 'object',
			additionalProperties: true,
			description: '活動描述 (localized JSON object)'
		},
		startDate: {
			...dateTimeString,
			description: '開始時間'
		},
		endDate: {
			...dateTimeString,
			description: '結束時間'
		},
		location: {
			type: 'string',
			description: '地點'
		},
		isActive: {
			type: 'boolean',
			description: '是否啟用'
		}
	}
};

export const eventResponse = {
	type: 'object',
	properties: {
		...successResponse.properties,
		data: {
			type: 'object',
			properties: eventProperties,
			required: ['id', 'name', 'startDate', 'endDate']
		},
	},
	required: ['success', 'message', 'data']
};

export const eventsListResponse = {
	type: 'object',
	properties: {
		...successResponse.properties,
		data: {
			type: 'array',
			items: {
				type: 'object',
				properties: eventProperties
			}
		}
	},
	required: ['success', 'message', 'data']
};

export const eventSchemas = {
	createEvent: {
		description: '創建新活動',
		tags: ['admin/events'],
		body: eventCreateBody,
		params: undefined,
		querystring: undefined,
		response: {
			201: eventResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse
		}
	},
	
	getEvent: {
		description: '取得活動詳情',
		tags: ['events'],
		body: undefined,
		params: idParam,
		querystring: undefined,
		response: {
			200: eventResponse,
			404: errorResponse
		}
	},
	
	updateEvent: {
		description: '更新活動',
		tags: ['admin/events'],
		body: eventUpdateBody,
		params: idParam,
		querystring: undefined,
		response: {
			200: eventResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},
	
	deleteEvent: {
		description: '刪除活動',
		tags: ['admin/events'],
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
	
	listEvents: {
		description: '取得活動列表',
		tags: ['events'],
		body: undefined,
		params: undefined,
		querystring: {
			type: 'object',
			properties: {
				isActive: {
					type: 'boolean',
					description: '篩選啟用狀態'
				}
			}
		},
		response: {
			200: eventsListResponse
		}
	}
};

// Public event response schemas with computed properties
export const eventTicketsResponse = {
	200: {
		type: 'object',
		properties: {
			...successResponse.properties,
			data: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						name: { type: 'object', additionalProperties: true },
						description: { type: 'object', additionalProperties: true },
						price: { type: 'number' },
						quantity: { type: 'integer' },
						soldCount: { type: 'integer' },
						available: { type: 'integer' },
						saleStart: { type: 'string', format: 'date-time' },
						saleEnd: { type: 'string', format: 'date-time' },
						isOnSale: { type: 'boolean' },
						isSoldOut: { type: 'boolean' }
					}
				}
			}
		}
	}
};

export const publicEventsListResponse = {
	200: {
		type: 'object',
		properties: {
			...successResponse.properties,
			data: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						name: { type: 'object', additionalProperties: true },
						description: { type: 'object', additionalProperties: true },
						location: { type: 'string' },
						startDate: { type: 'string', format: 'date-time' },
						endDate: { type: 'string', format: 'date-time' },
						ogImage: { type: 'string' },
						ticketCount: { type: 'integer' },
						registrationCount: { type: 'integer' },
						hasAvailableTickets: { type: 'boolean' }
					}
				}
			}
		}
	}
};

export const eventStatsResponse = {
	200: {
		type: 'object',
		properties: {
			...successResponse.properties,
			data: {
				type: 'object',
				properties: {
					eventName: { type: 'object', additionalProperties: true },
					totalRegistrations: { type: 'integer' },
					confirmedRegistrations: { type: 'integer' },
					totalTickets: { type: 'integer' },
					availableTickets: { type: 'integer' },
					registrationRate: { type: 'number' }
				}
			}
		}
	}
};