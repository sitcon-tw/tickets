/**
 * @fileoverview Invitation code-related schema definitions
 */

import { dateTimeString, errorResponse, idParam, successResponse } from "./common.js";

export const invitationCodeProperties = {
	id: {
		type: "string",
		description: "邀請碼 ID"
	},
	code: {
		type: "string",
		description: "邀請碼"
	},
	name: {
		type: "string",
		description: "名稱/描述"
	},
	usageLimit: {
		type: "integer",
		minimum: 1,
		description: "使用次數限制"
	},
	usedCount: {
		type: "integer",
		minimum: 0,
		description: "已使用次數"
	},
	validFrom: {
		...dateTimeString,
		description: "開始時間"
	},
	validUntil: {
		...dateTimeString,
		description: "結束時間"
	},
	isActive: {
		type: "boolean",
		description: "是否啟用"
	},
	createdAt: {
		...dateTimeString,
		description: "建立時間"
	},
	updatedAt: {
		...dateTimeString,
		description: "更新時間"
	},
	ticketId: {
		type: "string",
		description: "關聯票券 ID"
	}
};

export const invitationCodeCreateBody = {
	type: "object",
	properties: {
		code: {
			type: "string",
			description: "邀請碼",
			minLength: 1
		},
		name: {
			type: "string",
			description: "名稱/描述"
		},
		usageLimit: {
			type: "integer",
			minimum: 1,
			description: "使用次數限制"
		},
		validFrom: {
			...dateTimeString,
			description: "開始時間"
		},
		validUntil: {
			...dateTimeString,
			description: "結束時間"
		},
		ticketId: {
			type: "string",
			description: "關聯票券 ID"
		}
	},
	required: ["ticketId", "code"]
};

export const invitationCodeUpdateBody = {
	type: "object",
	properties: {
		code: {
			type: "string",
			description: "邀請碼",
			minLength: 1
		},
		name: {
			type: "string",
			description: "名稱/描述"
		},
		usageLimit: {
			type: "integer",
			minimum: 1,
			description: "使用次數限制"
		},
		validFrom: {
			...dateTimeString,
			description: "開始時間"
		},
		validUntil: {
			...dateTimeString,
			description: "結束時間"
		},
		isActive: {
			type: "boolean",
			description: "是否啟用"
		},
		ticketId: {
			type: "string",
			description: "關聯票券 ID"
		}
	}
};

export const invitationCodeValidateBody = {
	type: "object",
	properties: {
		code: {
			type: "string",
			description: "邀請碼",
			minLength: 1
		},
		ticketId: {
			type: "string",
			description: "票券 ID"
		}
	},
	required: ["code", "ticketId"]
};

export const invitationCodeResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "object",
			properties: invitationCodeProperties,
			required: ["id", "ticketId", "code"]
		}
	},
	required: ["success", "message", "data"]
};

export const invitationCodesListResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "array",
			items: {
				type: "object",
				properties: invitationCodeProperties
			}
		}
	},
	required: ["success", "message", "data"]
};

export const invitationCodeSchemas = {
	createInvitationCode: {
		description: "創建新邀請碼",
		tags: ["admin/invitation-codes"],
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
		description: "取得邀請碼詳情",
		tags: ["admin/invitation-codes"],
		body: undefined,
		params: idParam,
		querystring: undefined,
		response: {
			200: invitationCodeResponse,
			404: errorResponse
		}
	},

	updateInvitationCode: {
		description: "更新邀請碼",
		tags: ["admin/invitation-codes"],
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
		description: "刪除邀請碼",
		tags: ["admin/invitation-codes"],
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
		description: "取得邀請碼列表",
		tags: ["admin/invitation-codes"],
		body: undefined,
		params: undefined,
		querystring: {
			type: "object",
			properties: {
				ticketId: {
					type: "string",
					description: "篩選票券 ID"
				},
				isActive: {
					type: "boolean",
					description: "篩選啟用狀態"
				}
			}
		},
		response: {
			200: invitationCodesListResponse
		}
	},

	validateInvitationCode: {
		description: "驗證邀請碼",
		tags: ["public"],
		body: invitationCodeValidateBody,
		params: undefined,
		querystring: undefined,
		response: {
			200: {
				type: "object",
				properties: {
					...successResponse.properties,
					data: {
						type: "object",
						properties: {
							isValid: {
								type: "boolean",
								description: "是否有效"
							},
							code: {
								type: "string",
								description: "邀請碼"
							},
							remainingUses: {
								type: "integer",
								description: "剩餘使用次數"
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

export const invitationCodeVerifyResponse = {
	200: {
		type: "object",
		properties: {
			...successResponse.properties,
			data: {
				type: "object",
				properties: {
					valid: { type: "boolean" },
					invitationCode: {
						type: "object",
						properties: {
							id: { type: "string" },
							code: { type: "string" },
							description: { type: "string" },
							usedCount: { type: "integer" },
							usageLimit: { type: "integer" },
							expiresAt: { type: "string", format: "date-time" }
						}
					},
					availableTickets: {
						type: "array",
						items: {
							type: "object",
							properties: {
								id: { type: "string" },
								name: { type: "string" },
								description: { type: "string" },
								price: { type: "number" },
								quantity: { type: "integer" },
								soldCount: { type: "integer" },
								available: { type: "integer" },
								isOnSale: { type: "boolean" }
							}
						}
					}
				}
			}
		}
	}
};
