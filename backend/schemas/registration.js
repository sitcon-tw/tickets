/**
 * @fileoverview Registration-related schema definitions
 */

import { dateTimeString, successResponse, errorResponse, idParam, statusEnum, paginationQuery } from './common.js';

export const registrationProperties = {
	id: {
		type: 'string',
		description: '報名 ID'
	},
	userId: {
		type: 'string',
		description: '用戶 ID'
	},
	eventId: {
		type: 'string',
		description: '活動 ID'
	},
	ticketId: {
		type: 'string',
		description: '票券 ID'
	},
	invitationCodeId: {
		type: 'string',
		description: '邀請碼 ID'
	},
	referralCodeId: {
		type: 'string',
		description: '推薦碼 ID'
	},
	formData: {
		type: 'object',
		description: '表單資料'
	},
	status: {
		...statusEnum,
		description: '報名狀態'
	},
	checkinAt: {
		...dateTimeString,
		description: '報到時間'
	},
	tags: {
		type: 'array',
		items: { type: 'string' },
		description: '標籤列表'
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

export const registrationCreateBody = {
	type: 'object',
	properties: {
		eventId: {
			type: 'string',
			description: '活動 ID'
		},
		ticketId: {
			type: 'string',
			description: '票券 ID'
		},
		invitationCode: {
			type: 'string',
			description: '邀請碼'
		},
		referralCode: {
			type: 'string',
			description: '推薦碼'
		},
		formData: {
			type: 'object',
			description: '表單資料',
			additionalProperties: true
		}
	},
	required: ['eventId', 'ticketId', 'formData']
};

export const registrationUpdateBody = {
	type: 'object',
	properties: {
		formData: {
			type: 'object',
			description: '表單資料',
			additionalProperties: true
		},
		status: {
			...statusEnum,
			description: '報名狀態'
		},
		tags: {
			type: 'array',
			items: { type: 'string' },
			description: '標籤列表'
		}
	}
};

export const registrationQuery = {
	type: 'object',
	properties: {
		...paginationQuery.properties,
		eventId: {
			type: 'string',
			description: '篩選活動 ID'
		},
		status: {
			...statusEnum,
			description: '篩選報名狀態'
		},
		userId: {
			type: 'string',
			description: '篩選用戶 ID'
		},
		hasCheckin: {
			type: 'boolean',
			description: '篩選是否已報到'
		}
	}
};

export const registrationResponse = {
	type: 'object',
	properties: {
		...successResponse.properties,
		data: {
			type: 'object',
			properties: registrationProperties,
			required: ['id', 'userId', 'eventId', 'ticketId', 'status']
		}
	},
	required: ['success', 'message', 'data']
};

export const registrationsListResponse = {
	type: 'object',
	properties: {
		...successResponse.properties,
		data: {
			type: 'array',
			items: {
				type: 'object',
				properties: registrationProperties
			}
		}
	},
	required: ['success', 'message', 'data']
};

export const checkinBody = {
	type: 'object',
	properties: {
		registrationId: {
			type: 'string',
			description: '報名 ID'
		}
	},
	required: ['registrationId']
};

export const registrationSchemas = {
	createRegistration: {
		description: '創建新報名',
		tags: ['registrations'],
		body: registrationCreateBody,
		params: undefined,
		querystring: undefined,
		response: {
			201: registrationResponse,
			400: errorResponse,
			401: errorResponse,
			409: errorResponse
		}
	},
	
	getRegistration: {
		description: '取得報名詳情',
		tags: ['registrations'],
		body: undefined,
		params: idParam,
		querystring: undefined,
		response: {
			200: registrationResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},
	
	updateRegistration: {
		description: '更新報名',
		tags: ['registrations'],
		body: registrationUpdateBody,
		params: idParam,
		querystring: undefined,
		response: {
			200: registrationResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},
	
	listRegistrations: {
		description: '取得報名列表',
		tags: ['admin/registrations'],
		body: undefined,
		params: undefined,
		querystring: registrationQuery,
		response: {
			200: registrationsListResponse,
			401: errorResponse,
			403: errorResponse
		}
	},
	
	checkinRegistration: {
		description: '報到作業',
		tags: ['checkin'],
		body: checkinBody,
		params: undefined,
		querystring: undefined,
		response: {
			200: registrationResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	}
};