/**
 * Event-related schema definitions
 */

import { dateTimeString, errorResponse, idParam, successResponse } from "./common";

export const eventProperties = {
	id: {
		type: "string",
		description: "活動 ID"
	},
	slug: {
		type: "string",
		description: "活動 URL slug (可選，用於自訂網址)"
	},
	name: {
		type: "object",
		additionalProperties: true,
		description: "活動名稱 (localized JSON object)"
	},
	description: {
		type: "object",
		additionalProperties: true,
		description: "活動描述 (localized JSON object)"
	},
	plainDescription: {
		type: "object",
		additionalProperties: true,
		description: "活動純文字描述 (localized JSON object)"
	},
	location: {
		type: "string",
		description: "活動地點"
	},
	startDate: {
		...dateTimeString,
		description: "開始時間"
	},
	endDate: {
		...dateTimeString,
		description: "結束時間"
	},
	ogImage: {
		type: "string",
		description: "Open Graph 圖片 URL"
	},
	landingPage: {
		type: "string",
		description: "登陸頁面 JSON 內容"
	},
	isActive: {
		type: "boolean",
		description: "是否啟用"
	},
	hideEvent: {
		type: "boolean",
		description: "是否在活動列表中隱藏"
	},
	useOpass: {
		type: "boolean",
		description: "是否在 QR Code 彈窗顯示 OPass 連結"
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

export const eventCreateBody = {
	type: "object",
	properties: {
		slug: {
			type: "string",
			description: "活動 URL slug (可選，用於自訂網址)"
		},
		name: {
			type: "object",
			additionalProperties: true,
			description: "活動名稱 (localized JSON object)"
		},
		description: {
			type: "object",
			additionalProperties: true,
			description: "活動描述 (localized JSON object)"
		},
		plainDescription: {
			type: "object",
			additionalProperties: true,
			description: "活動純文字描述 (localized JSON object)"
		},
		startDate: {
			...dateTimeString,
			description: "開始時間"
		},
		endDate: {
			...dateTimeString,
			description: "結束時間"
		},
		location: {
			type: "string",
			description: "地點"
		},
		ogImage: {
			type: "string",
			description: "Open Graph 圖片 URL"
		}
	},
	required: ["name", "startDate", "endDate"]
} as const;

export const eventUpdateBody = {
	type: "object",
	properties: {
		slug: {
			type: "string",
			description: "活動 URL slug (可選，用於自訂網址)"
		},
		name: {
			type: "object",
			additionalProperties: true,
			description: "活動名稱 (localized JSON object)"
		},
		description: {
			type: "object",
			additionalProperties: true,
			description: "活動描述 (localized JSON object)"
		},
		plainDescription: {
			type: "object",
			additionalProperties: true,
			description: "活動純文字描述 (localized JSON object)"
		},
		startDate: {
			...dateTimeString,
			description: "開始時間"
		},
		endDate: {
			...dateTimeString,
			description: "結束時間"
		},
		location: {
			type: "string",
			description: "地點"
		},
		ogImage: {
			type: "string",
			description: "Open Graph 圖片 URL"
		},
		isActive: {
			type: "boolean",
			description: "是否啟用"
		},
		hideEvent: {
			type: "boolean",
			description: "是否在活動列表中隱藏"
		},
		useOpass: {
			type: "boolean",
			description: "是否在 QR Code 彈窗顯示 OPass 連結"
		}
	}
} as const;

export const eventResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "object",
			properties: eventProperties,
			required: ["id", "name", "startDate", "endDate"]
		}
	},
	required: ["success", "message", "data"]
} as const;

export const eventsListResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "array",
			items: {
				type: "object",
				properties: eventProperties
			}
		}
	},
	required: ["success", "message", "data"]
} as const;

export const eventSchemas = {
	createEvent: {
		description: "創建新活動",
		tags: ["admin/events"],
		body: eventCreateBody,
		response: {
			201: eventResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse
		}
	},

	getEvent: {
		description: "取得活動詳情",
		tags: ["events"],
		params: idParam,
		response: {
			200: eventResponse,
			404: errorResponse
		}
	},

	updateEvent: {
		description: "更新活動",
		tags: ["admin/events"],
		body: eventUpdateBody,
		params: idParam,
		response: {
			200: eventResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	deleteEvent: {
		description: "刪除活動",
		tags: ["admin/events"],
		params: idParam,
		response: {
			200: successResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	listEvents: {
		description: "取得活動列表",
		tags: ["events"],
		querystring: {
			type: "object",
			properties: {
				isActive: {
					type: "boolean",
					description: "篩選啟用狀態"
				}
			}
		},
		response: {
			200: eventsListResponse
		}
	}
} as const;

// Public event response schemas with computed properties
export const eventTicketsResponse = {
	200: {
		type: "object",
		properties: {
			...successResponse.properties,
			data: {
				type: "array",
				items: {
					type: "object",
					properties: {
						id: { type: "string" },
						name: { type: "object", additionalProperties: true },
						description: { type: "object", additionalProperties: true },
						plainDescription: { type: "object", additionalProperties: true },
						price: { type: "number" },
						quantity: { type: "integer" },
						soldCount: { type: "integer" },
						available: { type: "integer" },
						saleStart: { type: "string", format: "date-time" },
						saleEnd: { type: "string", format: "date-time" },
						isOnSale: { type: "boolean" },
						isSoldOut: { type: "boolean" },
						requireSmsVerification: { type: "boolean" },
						requireInviteCode: { type: "boolean" }
					}
				}
			}
		}
	}
} as const;

export const publicEventsListResponse = {
	200: {
		type: "object",
		properties: {
			...successResponse.properties,
			data: {
				type: "array",
				items: {
					type: "object",
					properties: {
						id: { type: "string" },
						slug: { type: "string" },
						name: { type: "object", additionalProperties: true },
						description: { type: "object", additionalProperties: true },
						plainDescription: { type: "object", additionalProperties: true },
						location: { type: "string" },
						startDate: { type: "string", format: "date-time" },
						endDate: { type: "string", format: "date-time" },
						ogImage: { type: "string" },
						hideEvent: { type: "boolean" },
						useOpass: { type: "boolean" },
						ticketCount: { type: "integer" },
						registrationCount: { type: "integer" },
						hasAvailableTickets: { type: "boolean" }
					}
				}
			}
		}
	}
} as const;

export const eventStatsResponse = {
	200: {
		type: "object",
		properties: {
			...successResponse.properties,
			data: {
				type: "object",
				properties: {
					eventName: { type: "object", additionalProperties: true },
					totalRegistrations: { type: "integer" },
					confirmedRegistrations: { type: "integer" },
					totalTickets: { type: "integer" },
					availableTickets: { type: "integer" },
					registrationRate: { type: "number" }
				}
			}
		}
	}
} as const;
