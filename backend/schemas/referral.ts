/**
 * Referral-related schema definitions
 */

import { dateTimeString, errorResponse, idParam, successResponse } from "./common.js";

export const referralProperties = {
	id: {
		type: "string",
		description: "推薦碼 ID"
	},
	eventId: {
		type: "string",
		description: "活動 ID"
	},
	userId: {
		type: "string",
		description: "建立者用戶 ID"
	},
	code: {
		type: "string",
		description: "推薦碼"
	},
	description: {
		type: "string",
		description: "描述"
	},
	usedCount: {
		type: "integer",
		minimum: 0,
		description: "使用次數"
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
	}
} as const;

export const referralUsageProperties = {
	id: {
		type: "string",
		description: "使用記錄 ID"
	},
	referralId: {
		type: "string",
		description: "推薦碼 ID"
	},
	eventId: {
		type: "string",
		description: "活動 ID"
	},
	userId: {
		type: "string",
		description: "使用者用戶 ID"
	},
	usedAt: {
		...dateTimeString,
		description: "使用時間"
	}
} as const;

export const referralCreateBody = {
	type: "object",
	properties: {
		eventId: {
			type: "string",
			description: "活動 ID"
		},
		code: {
			type: "string",
			description: "推薦碼",
			minLength: 1
		},
		description: {
			type: "string",
			description: "描述"
		}
	},
	required: ["eventId", "code"]
} as const;

export const referralUpdateBody = {
	type: "object",
	properties: {
		code: {
			type: "string",
			description: "推薦碼",
			minLength: 1
		},
		description: {
			type: "string",
			description: "描述"
		},
		isActive: {
			type: "boolean",
			description: "是否啟用"
		}
	}
} as const;

export const referralValidateBody = {
	type: "object",
	properties: {
		code: {
			type: "string",
			description: "推薦碼",
			minLength: 1
		},
		eventId: {
			type: "string",
			description: "活動 ID"
		}
	},
	required: ["code", "eventId"]
} as const;

export const referralResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "object",
			properties: referralProperties,
			required: ["id", "eventId", "userId", "code"]
		}
	},
	required: ["success", "message", "data"]
} as const;

export const referralsListResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "array",
			items: {
				type: "object",
				properties: referralProperties
			}
		}
	},
	required: ["success", "message", "data"]
} as const;

export const referralUsageListResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "array",
			items: {
				type: "object",
				properties: referralUsageProperties
			}
		}
	},
	required: ["success", "message", "data"]
} as const;

export const referralStatsResponse = {
	200: {
		type: "object",
		properties: {
			...successResponse.properties,
			data: {
				type: "object",
				properties: {
					totalReferrals: { type: "integer" },
					successfulReferrals: { type: "integer" },
					referralList: {
						type: "array",
						items: {
							type: "object",
							properties: {
								id: { type: "string" },
								status: { type: "string" },
								ticketName: { type: "object", additionalProperties: true },
								registeredAt: { type: "string", format: "date-time" },
								email: { type: "string" }
							}
						}
					},
					referrerInfo: {
						type: "object",
						properties: {
							id: { type: "string" },
							email: { type: "string" }
						}
					}
				}
			}
		}
	},
	404: errorResponse
} as const;

export const referralSchemas = {
	createReferral: {
		description: "創建新推薦碼",
		tags: ["referrals"],
		body: referralCreateBody,
		response: {
			201: referralResponse,
			400: errorResponse,
			401: errorResponse,
			409: errorResponse
		}
	},

	getReferral: {
		description: "取得推薦碼詳情",
		tags: ["referrals"],
		params: idParam,
		response: {
			200: referralResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	updateReferral: {
		description: "更新推薦碼",
		tags: ["referrals"],
		body: referralUpdateBody,
		params: idParam,
		response: {
			200: referralResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	deleteReferral: {
		description: "刪除推薦碼",
		tags: ["referrals"],
		params: idParam,
		response: {
			200: successResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	listReferrals: {
		description: "取得推薦碼列表",
		tags: ["referrals"],
		querystring: {
			type: "object",
			properties: {
				eventId: {
					type: "string",
					description: "篩選活動 ID"
				},
				isActive: {
					type: "boolean",
					description: "篩選啟用狀態"
				}
			}
		},
		response: {
			200: referralsListResponse,
			401: errorResponse
		}
	},

	validateReferral: {
		description: "驗證推薦碼",
		tags: ["public"],
		body: referralValidateBody,
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
								description: "推薦碼"
							},
							referralId: {
								type: "string",
								description: "推薦碼 ID"
							}
						}
					}
				}
			},
			400: errorResponse,
			404: errorResponse
		}
	},

	getReferralUsage: {
		description: "取得推薦碼使用記錄",
		tags: ["admin/referrals"],
		params: idParam,
		response: {
			200: referralUsageListResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	}
} as const;
