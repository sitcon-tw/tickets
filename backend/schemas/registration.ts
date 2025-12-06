/**
 * Registration-related schema definitions
 */

import { dateTimeString, errorResponse, idParam, paginationQuery, statusEnum, successResponse } from "./common";

export const registrationProperties = {
	id: {
		type: "string",
		description: "報名 ID"
	},
	eventId: {
		type: "string",
		description: "活動 ID"
	},
	ticketId: {
		type: "string",
		description: "票券 ID"
	},
	email: {
		type: "string",
		description: "電子郵件"
	},
	status: {
		type: "string",
		enum: ["confirmed", "cancelled", "pending"],
		description: "報名狀態"
	},
	referredBy: {
		type: "string",
		description: "推薦人報名 ID"
	},
	formData: {
		type: "object",
		additionalProperties: true,
		description: "表單資料"
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

export const registrationCreateBody = {
	type: "object",
	properties: {
		eventId: {
			type: "string",
			description: "活動 ID"
		},
		ticketId: {
			type: "string",
			description: "票券 ID"
		},
		invitationCode: {
			type: "string",
			description: "邀請碼"
		},
		referralCode: {
			type: "string",
			description: "推薦碼"
		},
		formData: {
			type: "object",
			description: "表單資料"
		}
	},
	required: ["eventId", "ticketId", "formData"]
} as const;

export const registrationUpdateBody = {
	type: "object",
	properties: {
		formData: {
			type: "object",
			description: "表單資料",
			additionalProperties: true
		},
		status: {
			...statusEnum,
			description: "報名狀態"
		},
		tags: {
			type: "array",
			items: { type: "string" },
			description: "標籤列表"
		}
	}
} as const;

export const registrationQuery = {
	type: "object",
	properties: {
		...paginationQuery.properties,
		eventId: {
			type: "string",
			description: "篩選活動 ID"
		},
		status: {
			...statusEnum,
			description: "篩選報名狀態"
		},
		userId: {
			type: "string",
			description: "篩選用戶 ID"
		}
	}
} as const;

export const registrationResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "object",
			properties: registrationProperties,
			required: ["id", "eventId", "ticketId", "email", "status"]
		}
	},
	required: ["success", "message", "data"]
} as const;

export const registrationsListResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "array",
			items: {
				type: "object",
				properties: registrationProperties,
				additionalProperties: true
			}
		}
	},
	required: ["success", "message", "data"]
} as const;

export const registrationSchemas = {
	createRegistration: {
		description: "創建新報名",
		tags: ["registrations"],
		body: registrationCreateBody,
		response: {
			201: registrationResponse,
			400: errorResponse,
			401: errorResponse,
			409: errorResponse
		}
	},

	getRegistration: {
		description: "取得報名詳情",
		tags: ["registrations"],
		params: idParam,
		response: {
			200: registrationResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	updateRegistration: {
		description: "更新報名",
		tags: ["registrations"],
		body: registrationUpdateBody,
		params: idParam,
		response: {
			200: registrationResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	listRegistrations: {
		description: "取得報名列表",
		tags: ["admin/registrations"],
		querystring: registrationQuery,
		response: {
			200: registrationsListResponse,
			401: errorResponse,
			403: errorResponse
		}
	}
} as const;

export const userRegistrationsResponse = {
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
						status: { type: "string" },
						formData: { type: "object", additionalProperties: true },
						createdAt: { type: "string", format: "date-time" },
						event: {
							type: "object",
							properties: {
								id: { type: "string" },
								name: { type: "object", additionalProperties: true },
								description: { type: "object", additionalProperties: true },
								location: { type: "string" },
								startDate: { type: "string", format: "date-time" },
								endDate: { type: "string", format: "date-time" },
								ogImage: { type: ["string", "null"] }
							}
						},
						ticket: {
							type: "object",
							properties: {
								id: { type: "string" },
								name: { type: "object", additionalProperties: true },
								description: { type: "object", additionalProperties: true },
								price: { type: "number" }
							}
						},
						isUpcoming: { type: "boolean" },
						isPast: { type: "boolean" },
						canEdit: { type: "boolean" },
						canCancel: { type: "boolean" }
					}
				}
			}
		}
	}
} as const;
