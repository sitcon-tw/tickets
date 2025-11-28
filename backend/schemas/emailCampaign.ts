/**
 * Email campaign-related schema definitions
 */

import { dateTimeString, errorResponse, idParam, successResponse } from "./common.js";

export const campaignStatusEnum = {
	type: "string",
	enum: ["draft", "sent", "scheduled"],
	description: "活動狀態"
} as const;

export const emailCampaignProperties = {
	id: {
		type: "string",
		description: "郵件活動 ID"
	},
	name: {
		type: "string",
		description: "活動名稱"
	},
	subject: {
		type: "string",
		description: "郵件主旨"
	},
	content: {
		type: "string",
		description: "郵件內容"
	},
	eventId: {
		type: "string",
		description: "關聯活動 ID"
	},
	targetAudience: {
		type: "object",
		properties: {
			roles: {
				type: "array",
				items: { type: "string" },
				description: "目標角色"
			},
			eventIds: {
				type: "array",
				items: { type: "string" },
				description: "目標活動 ID"
			},
			ticketIds: {
				type: "array",
				items: { type: "string" },
				description: "目標票種 ID"
			},
			registrationStatuses: {
				type: "array",
				items: { type: "string" },
				description: "目標報名狀態"
			},
			hasReferrals: {
				type: "boolean",
				description: "是否有推薦人"
			},
			isReferrer: {
				type: "boolean",
				description: "是否為推薦人"
			},
			registeredAfter: {
				...dateTimeString,
				description: "報名時間晚於"
			},
			registeredBefore: {
				...dateTimeString,
				description: "報名時間早於"
			},
			tags: {
				type: "array",
				items: { type: "string" },
				description: "目標標籤"
			},
			emailDomains: {
				type: "array",
				items: { type: "string" },
				description: "電子郵件網域"
			}
		},
		description: "目標受眾篩選條件"
	},
	status: {
		...campaignStatusEnum,
		description: "活動狀態"
	},
	scheduledAt: {
		...dateTimeString,
		description: "預定發送時間"
	},
	sentAt: {
		...dateTimeString,
		description: "實際發送時間"
	},
	totalCount: {
		type: "integer",
		minimum: 0,
		description: "收件人數量"
	},
	sentCount: {
		type: "integer",
		minimum: 0,
		description: "已發送數量"
	},
	createdBy: {
		type: "string",
		description: "建立者用戶 ID"
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

export const emailCampaignCreateBody = {
	type: "object",
	properties: {
		name: {
			type: "string",
			description: "活動名稱",
			minLength: 1
		},
		subject: {
			type: "string",
			description: "郵件主旨",
			minLength: 1
		},
		content: {
			type: "string",
			description: "郵件內容",
			minLength: 1
		},
		eventId: {
			type: "string",
			description: "關聯活動 ID"
		},
		targetAudience: {
			type: "object",
			properties: {
				roles: {
					type: "array",
					items: { type: "string" },
					description: "目標角色"
				},
				eventIds: {
					type: "array",
					items: { type: "string" },
					description: "目標活動 ID"
				},
				ticketIds: {
					type: "array",
					items: { type: "string" },
					description: "目標票種 ID"
				},
				registrationStatuses: {
					type: "array",
					items: { type: "string" },
					description: "目標報名狀態"
				},
				hasReferrals: {
					type: "boolean",
					description: "是否有推薦人"
				},
				isReferrer: {
					type: "boolean",
					description: "是否為推薦人"
				},
				registeredAfter: {
					...dateTimeString,
					description: "報名時間晚於"
				},
				registeredBefore: {
					...dateTimeString,
					description: "報名時間早於"
				},
				tags: {
					type: "array",
					items: { type: "string" },
					description: "目標標籤"
				},
				emailDomains: {
					type: "array",
					items: { type: "string" },
					description: "電子郵件網域"
				}
			},
			description: "目標受眾篩選條件"
		},
		scheduledAt: {
			...dateTimeString,
			description: "預定發送時間"
		}
	},
	required: ["name", "subject", "content"]
} as const;

export const emailCampaignUpdateBody = {
	type: "object",
	properties: {
		name: {
			type: "string",
			description: "活動名稱",
			minLength: 1
		},
		subject: {
			type: "string",
			description: "郵件主旨",
			minLength: 1
		},
		content: {
			type: "string",
			description: "郵件內容",
			minLength: 1
		},
		eventId: {
			type: "string",
			description: "關聯活動 ID"
		},
		targetAudience: {
			type: "object",
			properties: {
				roles: {
					type: "array",
					items: { type: "string" }
				},
				eventIds: {
					type: "array",
					items: { type: "string" }
				},
				registrationStatuses: {
					type: "array",
					items: { type: "string" }
				},
				tags: {
					type: "array",
					items: { type: "string" }
				}
			},
			description: "目標受眾篩選條件"
		},
		scheduledAt: {
			...dateTimeString,
			description: "預定發送時間"
		}
	}
} as const;

export const emailCampaignSendBody = {
	type: "object",
	properties: {
		sendNow: {
			type: "boolean",
			description: "是否立即發送",
			default: false
		},
		scheduledAt: {
			...dateTimeString,
			description: "預定發送時間（如果不立即發送）"
		}
	}
} as const;

export const emailCampaignResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "object",
			properties: emailCampaignProperties,
			required: ["id", "name", "subject", "content", "status"]
		}
	},
	required: ["success", "message", "data"]
} as const;

export const emailCampaignsListResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "array",
			items: {
				type: "object",
				properties: emailCampaignProperties
			}
		}
	},
	required: ["success", "message", "data"]
} as const;

export const emailCampaignSchemas = {
	createEmailCampaign: {
		description: "創建新郵件活動",
		tags: ["admin/email-campaigns"],
		body: emailCampaignCreateBody,
		response: {
			201: emailCampaignResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse
		}
	},

	getEmailCampaign: {
		description: "取得郵件活動詳情",
		tags: ["admin/email-campaigns"],
		params: idParam,
		response: {
			200: emailCampaignResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	updateEmailCampaign: {
		description: "更新郵件活動",
		tags: ["admin/email-campaigns"],
		body: emailCampaignUpdateBody,
		params: idParam,
		response: {
			200: emailCampaignResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	deleteEmailCampaign: {
		description: "刪除郵件活動",
		tags: ["admin/email-campaigns"],
		params: idParam,
		response: {
			200: successResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	listEmailCampaigns: {
		description: "取得郵件活動列表",
		tags: ["admin/email-campaigns"],
		querystring: {
			type: "object",
			properties: {
				status: {
					...campaignStatusEnum,
					description: "篩選活動狀態"
				},
				eventId: {
					type: "string",
					description: "篩選關聯活動 ID"
				}
			}
		},
		response: {
			200: emailCampaignsListResponse,
			401: errorResponse,
			403: errorResponse
		}
	},

	sendEmailCampaign: {
		description: "發送郵件活動",
		tags: ["admin/email-campaigns"],
		body: emailCampaignSendBody,
		params: idParam,
		response: {
			200: emailCampaignResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	}
} as const;
