/**
 * EventFormFields-related schema definitions
 */

import { errorResponse, idParam, successResponse } from "./common";

export const eventFormFieldProperties = {
	id: {
		type: "string",
		description: "表單欄位 ID"
	},
	eventId: {
		type: "string",
		description: "活動 ID"
	},
	order: {
		type: "integer",
		minimum: 0,
		description: "欄位排序"
	},
	type: {
		type: "string",
		enum: ["text", "textarea", "select", "checkbox", "radio"],
		description: "欄位類型"
	},
	validater: {
		type: "string",
		description: "驗證規則（正規表達式）"
	},
	name: {
		type: "object",
		additionalProperties: true,
		description: "欄位名稱 (localized JSON object)"
	},
	description: {
		type: "object",
		additionalProperties: true,
		description: "欄位描述 (localized JSON object)"
	},
	placeholder: {
		type: "string",
		description: "欄位提示文字"
	},
	required: {
		type: "boolean",
		description: "是否必填"
	},
	values: {
		type: "array",
		items: {
			type: "object",
			additionalProperties: true
		},
		description: "選項值（localized array of objects，用於 select、radio 類型）"
	},
	filters: {
		type: "object",
		additionalProperties: true,
		description: "顯示條件過濾器 (JSON object with filters configuration)"
	},
	prompts: {
		type: "object",
		additionalProperties: {
			type: "array",
			items: {
				type: "string"
			}
		},
		description: '自動完成提示（localized object with arrays，用於 text 類型）格式：{"en": ["option1", "option2"], "zh-Hant": ["選項1", "選項2"]}'
	}
} as const;

export const eventFormFieldCreateBody = {
	type: "object",
	properties: {
		eventId: {
			type: "string",
			description: "活動 ID"
		},
		order: {
			type: "integer",
			minimum: 0,
			description: "欄位排序"
		},
		type: {
			type: "string",
			enum: ["text", "textarea", "select", "checkbox", "radio"],
			description: "欄位類型"
		},
		validater: {
			type: "string",
			description: "驗證規則（正規表達式）"
		},
		name: {
			type: "object",
			additionalProperties: true,
			description: "欄位名稱 (localized JSON object)"
		},
		description: {
			type: "object",
			additionalProperties: true,
			description: "欄位描述 (localized JSON object)"
		},
		placeholder: {
			type: "string",
			description: "欄位提示文字"
		},
		required: {
			type: "boolean",
			default: false,
			description: "是否必填"
		},
		values: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: true
			},
			description: "選項值（localized array of objects，用於 select、radio 類型）"
		},
		filters: {
			type: "object",
			additionalProperties: true,
			description: "顯示條件過濾器 (JSON object with filters configuration)"
		},
		prompts: {
			type: "object",
			additionalProperties: {
				type: "array",
				items: {
					type: "string"
				}
			},
			description: '自動完成提示（localized object with arrays，用於 text 類型）格式：{"en": ["option1", "option2"], "zh-Hant": ["選項1", "選項2"]}'
		}
	},
	required: ["eventId", "order", "type", "name"]
} as const;

export const eventFormFieldUpdateBody = {
	type: "object",
	properties: {
		order: {
			type: "integer",
			minimum: 0,
			description: "欄位排序"
		},
		type: {
			type: "string",
			enum: ["text", "textarea", "select", "checkbox", "radio"],
			description: "欄位類型"
		},
		validater: {
			type: "string",
			description: "驗證規則（正規表達式）"
		},
		name: {
			type: "object",
			additionalProperties: true,
			description: "欄位名稱 (localized JSON object)"
		},
		description: {
			type: "object",
			additionalProperties: true,
			description: "欄位描述 (localized JSON object)"
		},
		placeholder: {
			type: "string",
			description: "欄位提示文字"
		},
		required: {
			type: "boolean",
			description: "是否必填"
		},
		values: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: true
			},
			description: "選項值（localized array of objects，用於 select、radio 類型）"
		},
		filters: {
			type: "object",
			additionalProperties: true,
			description: "顯示條件過濾器 (JSON object with filters configuration)"
		},
		prompts: {
			type: "object",
			additionalProperties: {
				type: "array",
				items: {
					type: "string"
				}
			},
			description: '自動完成提示（localized object with arrays，用於 text 類型）格式：{"en": ["option1", "option2"], "zh-Hant": ["選項1", "選項2"]}'
		}
	}
} as const;

export const eventFormFieldResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "object",
			properties: eventFormFieldProperties,
			required: ["id", "eventId", "order", "type", "name"]
		}
	},
	required: ["success", "message", "data"]
} as const;

export const eventFormFieldsListResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "array",
			items: {
				type: "object",
				properties: eventFormFieldProperties
			}
		}
	},
	required: ["success", "message", "data"]
} as const;

export const eventFormFieldSchemas = {
	createEventFormField: {
		description: "創建活動表單欄位",
		tags: ["admin/events"],
		body: eventFormFieldCreateBody,
		response: {
			201: eventFormFieldResponse,
			400: {
				oneOf: [
					errorResponse,
					{
						type: "object",
						properties: {
							statusCode: { type: "number" },
							code: { type: "string" },
							error: { type: "string" },
							message: { type: "string" },
							validation: { type: "array" },
							validationContext: { type: "string" }
						}
					}
				]
			},
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	getEventFormField: {
		description: "取得活動表單欄位詳情",
		tags: ["admin/events"],
		params: idParam,
		response: {
			200: eventFormFieldResponse,
			404: errorResponse
		}
	},

	updateEventFormField: {
		description: "更新活動表單欄位",
		tags: ["admin/events"],
		body: eventFormFieldUpdateBody,
		params: idParam,
		response: {
			200: eventFormFieldResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	deleteEventFormField: {
		description: "刪除活動表單欄位",
		tags: ["admin/events"],
		params: idParam,
		response: {
			200: successResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	listEventFormFields: {
		description: "取得活動表單欄位列表",
		tags: ["admin/events"],
		querystring: {
			type: "object",
			properties: {
				eventId: {
					type: "string",
					description: "篩選活動 ID"
				}
			}
		},
		response: {
			200: eventFormFieldsListResponse
		}
	}
} as const;
