/**
 * @fileoverview Registration-related schema definitions
 */

import { dateTimeString, successResponse, errorResponse, idParam, statusEnum, paginationQuery } from './common.js';

export const registrationProperties = {
	id: {
		type: 'string',
		description: '報名 ID'
	},
	eventId: {
		type: 'string',
		description: '活動 ID'
	},
	ticketId: {
		type: 'string',
		description: '票券 ID'
	},
	email: {
		type: 'string',
		description: '電子郵件'
	},
	phone: {
		type: 'string',
		description: '電話號碼'
	},
	status: {
		type: 'string',
		enum: ['confirmed', 'cancelled', 'pending'],
		description: '報名狀態'
	},
	referredBy: {
		type: 'string',
		description: '推薦人報名 ID'
	},
	formData: {
		type: 'object',
		description: '表單資料'
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
			properties: {
				acceptTerms: {
					type: 'boolean',
					description: '接受條款'
				},
				nickname: {
					type: 'string',
					description: '暱稱',
					minLength: 2,
					maxLength: 20
				},
				phoneNumber: {
					type: 'string',
					description: '電話號碼'
				},
				sex: {
					type: 'string',
					enum: ['male', 'female', 'other'],
					description: '性別'
				},
				foodHabits: {
					type: 'string',
					enum: ['normal', 'no-beef', 'no-pork', 'vegetarian'],
					description: '飲食習慣'
				},
				livingArea: {
					type: 'string',
					enum: ['north', 'middle', 'south', 'east'],
					description: '居住地區'
				},
				workingAt: {
					type: 'string',
					description: '工作地點',
					maxLength: 100
				},
				jobTitle: {
					type: 'string',
					description: '職位',
					maxLength: 50
				},
				grade: {
					type: 'string',
					description: '年級',
					maxLength: 20
				},
				haveEverBeenHere: {
					type: 'boolean',
					description: '是否曾經來過'
				},
				whereYouGotThis: {
					type: 'string',
					enum: ['google', 'social_media', 'friend', 'family'],
					description: '從哪裡得知此活動'
				}
			},
			required: ['acceptTerms', 'nickname', 'phoneNumber', 'sex', 'foodHabits', 'livingArea', 'workingAt', 'jobTitle', 'grade', 'haveEverBeenHere', 'whereYouGotThis']
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
	}
};

export const registrationResponse = {
	type: 'object',
	properties: {
		...successResponse.properties,
		data: {
			type: 'object',
			properties: registrationProperties,
			required: ['id', 'eventId', 'ticketId', 'email', 'status']
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
};

export const userRegistrationsResponse = {
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
						status: { type: 'string' },
						formData: { type: 'object', additionalProperties: true },
						createdAt: { type: 'string', format: 'date-time' },
						event: {
							type: 'object',
							properties: {
								id: { type: 'string' },
								name: { type: 'string' },
								description: { type: 'string' },
								location: { type: 'string' },
								startDate: { type: 'string', format: 'date-time' },
								endDate: { type: 'string', format: 'date-time' },
								ogImage: { type: ['string', 'null'] }
							}
						},
						ticket: {
							type: 'object',
							properties: {
								id: { type: 'string' },
								name: { type: 'string' },
								description: { type: 'string' },
								price: { type: 'number' }
							}
						},
						isUpcoming: { type: 'boolean' },
						isPast: { type: 'boolean' },
						canEdit: { type: 'boolean' },
						canCancel: { type: 'boolean' }
					}
				}
			}
		}
	}
};