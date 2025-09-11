/**
 * @fileoverview Invitation code-related schema definitions
 */

import { dateTimeString, successResponse, errorResponse, idParam } from './common.js';

export const invitationCodeProperties = {
	id: {
		type: 'string',
		description: '邀請碼 ID'
	},
	eventId: {
		type: 'string',
		description: '活動 ID'
	},
	code: {
		type: 'string',
		description: '邀請碼'
	},
	description: {
		type: 'string',
		description: '描述'
	},
	usageLimit: {
		type: 'integer',
		minimum: 1,
		description: '使用次數限制'
	},
	usageCount: {
		type: 'integer',
		minimum: 0,
		description: '已使用次數'
	},
	expiresAt: {
		...dateTimeString,
		description: '到期時間'
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

export const invitationCodeCreateBody = {
	type: 'object',
	properties: {
		eventId: {
			type: 'string',
			description: '活動 ID'
		},
		code: {
			type: 'string',
			description: '邀請碼',
			minLength: 1
		},
		description: {
			type: 'string',
			description: '描述'
		},
		usageLimit: {
			type: 'integer',
			minimum: 1,
			description: '使用次數限制'
		},
		expiresAt: {
			...dateTimeString,
			description: '到期時間'
		}
	},
	required: ['eventId', 'code']
};

export const invitationCodeUpdateBody = {
	type: 'object',
	properties: {
		code: {
			type: 'string',
			description: '邀請碼',
			minLength: 1
		},
		description: {
			type: 'string',
			description: '描述'
		},
		usageLimit: {
			type: 'integer',
			minimum: 1,
			description: '使用次數限制'
		},
		expiresAt: {
			...dateTimeString,
			description: '到期時間'
		},
		isActive: {
			type: 'boolean',
			description: '是否啟用'
		}
	}
};

export const invitationCodeValidateBody = {
	type: 'object',
	properties: {
		code: {
			type: 'string',
			description: '邀請碼',
			minLength: 1
		},
		eventId: {
			type: 'string',
			description: '活動 ID'
		}
	},
	required: ['code', 'eventId']
};

export const invitationCodeResponse = {
	type: 'object',
	properties: {
		...successResponse.properties,
		data: {
			type: 'object',
			properties: invitationCodeProperties,
			required: ['id', 'eventId', 'code']
		}
	},
	required: ['success', 'message', 'data']
};

export const invitationCodesListResponse = {
	type: 'object',
	properties: {
		...successResponse.properties,
		data: {
			type: 'array',
			items: {
				type: 'object',
				properties: invitationCodeProperties
			}
		}
	},
	required: ['success', 'message', 'data']
};

export const invitationCodeSchemas = {
	createInvitationCode: {
		description: '創建新邀請碼',
		tags: ['admin/invitation-codes'],
		body: invitationCodeCreateBody,
		params: undefined,
		querystring: undefined,
		response: {
			201: invitationCodeResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			409: errorResponse
		}
	},
	
	getInvitationCode: {
		description: '取得邀請碼詳情',
		tags: ['admin/invitation-codes'],
		body: undefined,
		params: idParam,
		querystring: undefined,
		response: {
			200: invitationCodeResponse,
			404: errorResponse
		}
	},
	
	updateInvitationCode: {
		description: '更新邀請碼',
		tags: ['admin/invitation-codes'],
		body: invitationCodeUpdateBody,
		params: idParam,
		querystring: undefined,
		response: {
			200: invitationCodeResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},
	
	deleteInvitationCode: {
		description: '刪除邀請碼',
		tags: ['admin/invitation-codes'],
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
	
	listInvitationCodes: {
		description: '取得邀請碼列表',
		tags: ['admin/invitation-codes'],
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
			200: invitationCodesListResponse
		}
	},
	
	validateInvitationCode: {
		description: '驗證邀請碼',
		tags: ['public'],
		body: invitationCodeValidateBody,
		params: undefined,
		querystring: undefined,
		response: {
			200: {
				type: 'object',
				properties: {
					...successResponse.properties,
					data: {
						type: 'object',
						properties: {
							isValid: {
								type: 'boolean',
								description: '是否有效'
							},
							code: {
								type: 'string',
								description: '邀請碼'
							},
							remainingUses: {
								type: 'integer',
								description: '剩餘使用次數'
							}
						}
					}
				}
			},
			400: errorResponse,
			404: errorResponse
		}
	}
};