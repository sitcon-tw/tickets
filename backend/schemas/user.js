/**
 * @fileoverview User-related schema definitions
 */

import { dateTimeString, errorResponse, idParam, roleEnum, successResponse } from "./common.js";

export const userProperties = {
	id: {
		type: "string",
		description: "用戶 ID"
	},
	name: {
		type: "string",
		description: "用戶名稱"
	},
	email: {
		type: "string",
		format: "email",
		description: "電子郵件"
	},
	emailVerified: {
		type: "boolean",
		description: "電子郵件是否已驗證"
	},
	image: {
		type: "string",
		description: "用戶頭像 URL"
	},
	role: {
		...roleEnum,
		description: "用戶角色"
	},
	permissions: {
		type: "array",
		items: { type: "string" },
		description: "用戶權限列表"
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
};

export const userCreateBody = {
	type: "object",
	properties: {
		name: {
			type: "string",
			description: "用戶名稱",
			minLength: 1
		},
		email: {
			type: "string",
			format: "email",
			description: "電子郵件"
		},
		role: {
			...roleEnum,
			description: "用戶角色"
		},
		permissions: {
			type: "array",
			items: { type: "string" },
			description: "用戶權限列表"
		}
	},
	required: ["name", "email", "role"]
};

export const userUpdateBody = {
	type: "object",
	properties: {
		name: {
			type: "string",
			description: "用戶名稱",
			minLength: 1
		},
		email: {
			type: "string",
			format: "email",
			description: "電子郵件"
		},
		role: {
			...roleEnum,
			description: "用戶角色"
		},
		permissions: {
			type: "array",
			items: { type: "string" },
			description: "用戶權限列表"
		},
		isActive: {
			type: "boolean",
			description: "是否啟用"
		}
	}
};

export const profileUpdateBody = {
	type: "object",
	properties: {
		name: {
			type: "string",
			description: "用戶名稱",
			minLength: 1
		},
		image: {
			type: "string",
			description: "用戶頭像 URL"
		}
	}
};

export const changePasswordBody = {
	type: "object",
	properties: {
		currentPassword: {
			type: "string",
			description: "目前密碼"
		},
		newPassword: {
			type: "string",
			minLength: 6,
			description: "新密碼"
		}
	},
	required: ["currentPassword", "newPassword"]
};

export const userResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "object",
			properties: userProperties,
			required: ["id", "name", "email", "role"]
		}
	},
	required: ["success", "message", "data"]
};

export const usersListResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "array",
			items: {
				type: "object",
				properties: userProperties
			}
		}
	},
	required: ["success", "message", "data"]
};

export const userSchemas = {
	createUser: {
		description: "創建新用戶",
		tags: ["admin/users"],
		body: userCreateBody,
		response: {
			201: userResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			409: errorResponse
		}
	},

	getUser: {
		description: "取得用戶詳情",
		tags: ["admin/users"],
		params: idParam,
		response: {
			200: userResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	updateUser: {
		description: "更新用戶",
		tags: ["admin/users"],
		body: userUpdateBody,
		params: idParam,
		response: {
			200: userResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	updateProfile: {
		description: "更新個人資料",
		tags: ["auth"],
		body: profileUpdateBody,
		response: {
			200: userResponse,
			400: errorResponse,
			401: errorResponse
		}
	},

	changePassword: {
		description: "變更密碼",
		tags: ["auth"],
		body: changePasswordBody,
		response: {
			200: successResponse,
			400: errorResponse,
			401: errorResponse
		}
	},

	listUsers: {
		description: "取得用戶列表",
		tags: ["admin/users"],
		querystring: {
			type: "object",
			properties: {
				role: {
					...roleEnum,
					description: "篩選角色"
				},
				isActive: {
					type: "boolean",
					description: "篩選啟用狀態"
				}
			}
		},
		response: {
			200: usersListResponse,
			401: errorResponse,
			403: errorResponse
		}
	}
};
