/**
 * Central schemas and types module for the SITCON tickets backend
 * This file contains all schema definitions and type definitions used throughout the application
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// ----------------------------------------------------------------------------
// API Types
// ----------------------------------------------------------------------------

export interface ApiResponse<T = any> {
	success: boolean;
	message: string;
	data: T;
	pagination?: Pagination | null;
}

export interface ApiErrorResponse {
	success: false;
	error: ApiError;
}

export interface ApiError {
	code: string;
	message: string;
	details?: any;
}

export interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface PaginationQuery {
	page?: number;
	limit?: number;
}

export interface EventCreateRequest {
	name: string;
	description?: string;
	plainDescription?: string;
	startDate: string;
	endDate: string;
	location?: string;
	ogImage?: string;
}

export interface EventUpdateRequest {
	name?: string;
	description?: string;
	plainDescription?: string;
	startDate?: string;
	endDate?: string;
	location?: string;
	ogImage?: string;
	isActive?: boolean;
}

export interface RegistrationCreateRequest {
	eventId: string;
	ticketId: string;
	invitationCode?: string;
	referralCode?: string;
	formData: Record<string, any>;
}

export interface RegistrationUpdateRequest {
	formData?: Record<string, any>;
	status?: RegistrationStatus;
}

export interface TicketCreateRequest {
	eventId: string;
	order?: number;
	name: string;
	description?: string;
	price: number;
	quantity: number;
	saleStart?: string;
	saleEnd?: string;
	requireInviteCode?: boolean;
	hidden?: boolean;
}

export interface TicketUpdateRequest {
	order?: number;
	name?: string;
	description?: string;
	price?: number;
	quantity?: number;
	saleStart?: string;
	saleEnd?: string;
	isActive?: boolean;
	requireInviteCode?: boolean;
}

export interface TicketReorderRequest {
	tickets: { id: string; order: number }[];
}

export interface InvitationCodeCreateRequest {
	eventId: string;
	code: string;
	name?: string;
	usageLimit?: number;
	validFrom?: string;
	validUntil?: string;
	ticketId?: string;
}

export interface InvitationCodeResponse {
	id: string;
	eventId: string;
	code: string;
	name: string;
	usageLimit: number;
	usedCount: number;
	validFrom: string | null;
	validUntil: string | null;
	isActive: boolean;
	ticketId: string;
	createdAt: string;
	updatedAt: string;
}

export interface InvitationCodeUpdateRequest {
	code?: string;
	name?: string;
	usageLimit?: number;
	validFrom?: string;
	validUntil?: string;
	isActive?: boolean;
	ticketId?: string;
}

export interface EmailCampaignCreateRequest {
	name: string;
	subject: string;
	content: string;
	eventId?: string;
	targetAudience?: TargetAudience;
	scheduledAt?: string;
}

export interface TargetAudience {
	roles?: string[];
	eventIds?: string[];
	registrationStatuses?: string[];
	tags?: string[];
}

export type SortOrder = "asc" | "desc";

export interface SearchQuery {
	q?: string;
	sortBy?: string;
	sortOrder?: SortOrder;
	filters?: Record<string, any>;
}

export interface AnalyticsData {
	totalRegistrations: number;
	confirmedRegistrations: number;
	pendingRegistrations: number;
	cancelledRegistrations: number;
	checkedInCount: number;
	registrationsByDate: Record<string, any>;
	ticketSales: Record<string, any>;
	referralStats: Record<string, any>;
}

export type FormFieldType = "text" | "textarea" | "select" | "checkbox" | "radio";

export interface EventFormFieldCreateRequest {
	eventId: string;
	order: number;
	type: FormFieldType;
	validater?: string;
	name: string;
	description: string;
	placeholder?: string;
	required?: boolean;
	values?: string;
	filters?: string;
	prompts?: string;
	enableOther?: boolean;
}

export interface EventFormFieldUpdateRequest {
	order?: number;
	type?: FormFieldType;
	validater?: string;
	name?: string;
	description?: string;
	placeholder?: string;
	required?: boolean;
	values?: string;
	filters?: string;
	prompts?: string;
	enableOther?: boolean;
}

export interface InvitationCodeVerifyRequest {
	code: string;
	ticketId: string;
}

export interface ReferralValidateRequest {
	code: string;
	eventId: string;
}

// ----------------------------------------------------------------------------
// Auth Types
// ----------------------------------------------------------------------------

export interface SessionUser {
	id: string;
	name: string;
	email: string;
	role: string;
	permissions: string[];
	isActive: boolean;
}

export interface AuthContext {
	user: SessionUser | null;
	sessionId: string | null;
	isAuthenticated: boolean;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	name: string;
	email: string;
	password: string;
}

export interface MagicLinkRequest {
	email: string;
}

export interface ResetPasswordRequest {
	email: string;
}

export interface ChangePasswordRequest {
	currentPassword: string;
	newPassword: string;
}

export interface UserUpdateRequest {
	name?: string;
	email?: string;
	image?: string;
}

export type UserRole = "admin" | "viewer" | "eventAdmin";

export interface AdminUserUpdateRequest {
	name?: string;
	email?: string;
	role?: UserRole;
	permissions?: string[];
	isActive?: boolean;
}

/**
 * Permission types
 * Common permissions:
 * - 'users.read'
 * - 'users.write'
 * - 'events.read'
 * - 'events.write'
 * - 'registrations.read'
 * - 'registrations.write'
 * - 'analytics.read'
 * - 'admin.full'
 * For eventAdmin role, permissions array contains event IDs (e.g., ['event_id_1', 'event_id_2'])
 */
export type Permission = string;

export interface RolePermissions {
	admin: "admin";
	viewer: "viewer";
	eventAdmin: "eventAdmin";
}

// ----------------------------------------------------------------------------
// Database Types
// ----------------------------------------------------------------------------

export interface User {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	permissions: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface Event {
	id: string;
	slug?: string | null;
	name: string;
	description: string | null;
	location: string | null;
	startDate: Date;
	endDate: Date;
	ogImage: string | null;
	landingPage: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export type RegistrationStatus = "pending" | "confirmed" | "cancelled";

export interface Registration {
	id: string;
	userId: string;
	eventId: string;
	ticketId: string;
	email: string;
	invitationCodeId: string | null;
	referralCodeId: string | null;
	formData: string;
	status: RegistrationStatus;
	tags: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface Ticket {
	id: string;
	eventId: string;
	name: string;
	description: string | null;
	price: number;
	quantity: number;
	sold: number;
	saleStart: Date | null;
	saleEnd: Date | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface InvitationCode {
	id: string;
	ticketId: string;
	code: string;
	name: string | null;
	usageLimit: number | null;
	usedCount: number;
	validFrom: Date | null;
	validUntil: Date | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface Referral {
	id: string;
	eventId: string;
	userId: string;
	code: string;
	description: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface ReferralUsage {
	id: string;
	referralId: string;
	eventId: string;
	userId: string;
	usedAt: Date;
}

export type EmailCampaignStatus = "draft" | "sent" | "scheduled";

export interface EmailCampaign {
	id: string;
	name: string;
	subject: string;
	content: string;
	eventId: string | null;
	targetAudience: string | null;
	status: EmailCampaignStatus;
	scheduledAt: Date | null;
	sentAt: Date | null;
	recipientCount: number;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

export type EventFormFieldType = "text" | "textarea" | "select" | "checkbox" | "radio";

export interface EventFormFields {
	id: string;
	eventId: string;
	order: number;
	type: EventFormFieldType;
	validater: string | null;
	name: string;
	description: string | null;
	placeholder: string | null;
	required: boolean;
	values: string | null;
	prompts: string | null;
	enableOther: boolean | null;
}

/**
 * @deprecated Use EventFormFields instead
 */
export type TicketFromFields = EventFormFields;

export interface RedisClientConfig {
	host: string;
	port: number;
	password?: string;
	username?: string;
	db?: number;
}

// ----------------------------------------------------------------------------
// Email Types
// ----------------------------------------------------------------------------

export interface EmailSender {
	email: string;
	name: string;
}

export interface EmailRecipient {
	email: string;
}

export interface TargetAudienceFilters {
	eventIds?: string[];
	ticketIds?: string[];
	registrationStatuses?: string[];
	hasReferrals?: boolean;
	registeredAfter?: string;
	registeredBefore?: string;
	emailDomains?: string[];
	roles?: string[];
	isReferrer?: boolean;
}

export interface RecipientData {
	email: string;
	id: string;
	formData?: string | null;
	event?: Partial<Event>;
	ticket?: Partial<Ticket>;
}

export interface EmailCampaignContent {
	subject: string;
	content: string;
}

export interface CampaignResult {
	success: boolean;
	sentCount: number;
	failedCount: number;
	totalRecipients: number;
}

// ----------------------------------------------------------------------------
// Middleware Types
// ----------------------------------------------------------------------------

export interface Session {
	user: SessionUser;
	session: {
		id: string;
		userId: string;
		expiresAt: Date;
		token: string;
		ipAddress?: string | null;
		userAgent?: string | null;
	};
}

export interface EventAccessRequest {
	eventId?: string;
	id?: string;
}

export interface TicketBody {
	ticketId?: string;
}

export interface TicketIdParams {
	ticketId?: string;
}

export interface TicketIdQuery {
	ticketId?: string;
}

export interface IdParams {
	id?: string;
}

// ----------------------------------------------------------------------------
// SMS Types
// ----------------------------------------------------------------------------

/**
 * TwSMS API response structure
 */
export interface TwSMSResponse {
	code: string;
	text: string;
	msgid?: string;
}

/**
 * SMS delivery status response
 */
export interface TwSMSStatusResponse {
	code: string;
	text: string;
	statuscode?: string;
	statustext?: string;
	donetime?: string;
}

/**
 * SMS send result
 */
export interface SMSSendResult {
	success: boolean;
	msgid: string;
	code: string;
	text: string;
}

/**
 * SMS send options
 */
export interface SMSSendOptions {
	[key: string]: string | number | undefined;
}

/**
 * Supported locales for verification codes
 */
export type Locale = "zh-Hant" | "zh-Hans" | "en";

/**
 * SMS Verification send request
 */
export interface SendVerificationRequest {
	phoneNumber: string;
	locale?: Locale;
	turnstileToken: string;
}

/**
 * SMS Verification verify request
 */
export interface VerifyCodeRequest {
	phoneNumber: string;
	code: string;
}

// ----------------------------------------------------------------------------
// Turnstile Types
// ----------------------------------------------------------------------------

/**
 * Cloudflare Turnstile API response
 */
export interface TurnstileResponse {
	success: boolean;
	challenge_ts?: string;
	hostname?: string;
	"error-codes"?: string[];
	action?: string;
	cdata?: string;
	metadata?: {
		ephemeral_id?: string;
	};
}

/**
 * Turnstile validation options
 */
export interface TurnstileValidationOptions {
	remoteip?: string;
	idempotencyKey?: string;
	expectedAction?: string;
	expectedHostname?: string;
}

/**
 * Turnstile validation result
 */
export interface TurnstileValidationResult {
	valid: boolean;
	reason?: string;
	errors?: string[];
	expected?: string;
	received?: string;
	data?: TurnstileResponse;
	tokenAge?: number;
}

// ----------------------------------------------------------------------------
// Validation Types
// ----------------------------------------------------------------------------

/**
 * A validation function that returns true if valid, or error message if invalid
 */
export type ValidationRule = (value: any) => boolean | string;

export interface ValidationSchema {
	[field: string]: ValidationRule[];
}

export interface ValidationResult {
	isValid: boolean;
	errors: Record<string, string[]>;
}

export interface FormValidationRules {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp | string;
	email?: string;
	phone?: string;
	min?: number;
	max?: number;
	options?: string[];
	customMessage?: string;
}

export interface FieldValidationError {
	field: string;
	messages: string[];
}

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

// ----------------------------------------------------------------------------
// Common Schemas
// ----------------------------------------------------------------------------

export const idParam = {
	type: "object",
	properties: {
		id: {
			type: "string",
			description: "資源 ID"
		}
	},
	required: ["id"]
} as const;

export const paginationQuery = {
	type: "object",
	properties: {
		page: {
			type: "integer",
			minimum: 1,
			default: 1,
			description: "頁數"
		},
		limit: {
			type: "integer",
			minimum: 1,
			maximum: 100,
			default: 10,
			description: "每頁項目數"
		}
	}
} as const;

export const searchQuery = {
	type: "object",
	properties: {
		q: {
			type: "string",
			description: "搜尋關鍵字"
		},
		sortBy: {
			type: "string",
			description: "排序欄位"
		},
		sortOrder: {
			type: "string",
			enum: ["asc", "desc"],
			default: "desc",
			description: "排序方向"
		}
	}
} as const;

export const successResponse = {
	type: "object",
	properties: {
		success: {
			type: "boolean",
			const: true
		},
		message: {
			type: "string",
			description: "回應訊息"
		},
		data: {
			description: "回應資料"
		}
	},
	required: ["success", "message"]
} as const;

export const errorResponse = {
	type: "object",
	properties: {
		success: {
			type: "boolean",
			const: false
		},
		error: {
			type: "object",
			properties: {
				code: {
					type: "string",
					description: "錯誤代碼"
				},
				message: {
					type: "string",
					description: "錯誤訊息"
				},
				details: {
					description: "錯誤詳細資訊"
				}
			},
			required: ["code", "message"]
		}
	},
	required: ["success", "error"]
} as const;

export const paginatedResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		pagination: {
			type: "object",
			properties: {
				page: {
					type: "integer",
					description: "當前頁數"
				},
				limit: {
					type: "integer",
					description: "每頁項目數"
				},
				total: {
					type: "integer",
					description: "總項目數"
				},
				totalPages: {
					type: "integer",
					description: "總頁數"
				},
				hasNext: {
					type: "boolean",
					description: "是否有下一頁"
				},
				hasPrev: {
					type: "boolean",
					description: "是否有上一頁"
				}
			},
			required: ["page", "limit", "total", "totalPages", "hasNext", "hasPrev"]
		}
	},
	required: ["success", "message", "pagination"]
} as const;

export const dateTimeString = {
	type: "string",
	format: "date-time",
	description: "ISO 8601 日期時間格式"
} as const;

export const statusEnum = {
	type: "string",
	enum: ["pending", "confirmed", "cancelled"],
	description: "狀態"
} as const;

export const roleEnum = {
	type: "string",
	enum: ["admin", "viewer", "eventAdmin"],
	description: "用戶角色"
} as const;

// ----------------------------------------------------------------------------
// Email Campaign Schemas
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Event Schemas
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Event Form Field Schemas
// ----------------------------------------------------------------------------

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
		description: '自動完成提示（localized object with arrays，用於 text 類型）格式：{"en": ["option1", "option2"], "zh-Hant": ["選項 1", "選項 2"]}'
	},
	enableOther: {
		type: "boolean",
		description: "是否啟用「其他」選項（僅用於 select、radio、checkbox 類型）"
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
			description: '自動完成提示（localized object with arrays，用於 text 類型）格式：{"en": ["option1", "option2"], "zh-Hant": ["選項 1", "選項 2"]}'
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
			description: '自動完成提示（localized object with arrays，用於 text 類型）格式：{"en": ["option1", "option2"], "zh-Hant": ["選項 1", "選項 2"]}'
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

// ----------------------------------------------------------------------------
// Invitation Code Schemas
// ----------------------------------------------------------------------------

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
} as const;

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
} as const;

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
} as const;

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
} as const;

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
} as const;

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
} as const;

export const invitationCodeSchemas = {
	createInvitationCode: {
		description: "創建新邀請碼",
		tags: ["admin/invitation-codes"],
		body: invitationCodeCreateBody,
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
		params: idParam,
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
		params: idParam,
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
				},
				eventId: {
					type: "string",
					description: "篩選活動 ID"
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
} as const;

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
} as const;

// ----------------------------------------------------------------------------
// Referral Schemas
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Registration Schemas
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// SMS Verification Schemas
// ----------------------------------------------------------------------------

export const smsVerificationSchemas = {
	send: {
		description: "發送簡訊驗證碼",
		tags: ["sms-verification"],
		body: {
			type: "object",
			required: ["phoneNumber", "turnstileToken"],
			properties: {
				phoneNumber: {
					type: "string",
					pattern: "^09\\d{8}$",
					description: "Taiwan phone number (09xxxxxxxx)"
				},
				locale: {
					type: "string",
					enum: ["zh-Hant", "zh-Hans", "en"],
					description: "Preferred locale for SMS message"
				},
				turnstileToken: {
					type: "string",
					description: "Cloudflare Turnstile verification token"
				}
			}
		}
	},

	verify: {
		description: "驗證簡訊驗證碼",
		tags: ["sms-verification"],
		body: {
			type: "object",
			required: ["phoneNumber", "code"],
			properties: {
				phoneNumber: {
					type: "string",
					pattern: "^09\\d{8}$",
					description: "Taiwan phone number (09xxxxxxxx)"
				},
				code: {
					type: "string",
					pattern: "^\\d{6}$",
					description: "6-digit verification code"
				}
			}
		}
	},

	status: {
		description: "取得用戶的手機驗證狀態",
		tags: ["sms-verification"]
	}
} as const;

// ----------------------------------------------------------------------------
// Ticket Schemas
// ----------------------------------------------------------------------------

export const ticketProperties = {
	id: {
		type: "string",
		description: "票券 ID"
	},
	eventId: {
		type: "string",
		description: "活動 ID"
	},
	order: {
		type: "integer",
		description: "顯示順序"
	},
	name: {
		type: "object",
		additionalProperties: true,
		description: "票券名稱 (localized JSON object)"
	},
	description: {
		type: "object",
		additionalProperties: true,
		description: "票券描述 (localized JSON object)"
	},
	plainDescription: {
		type: "object",
		additionalProperties: true,
		description: "票券純文字描述 (localized JSON object)"
	},
	price: {
		type: "number",
		description: "票價"
	},
	quantity: {
		type: "integer",
		minimum: 0,
		description: "可售數量"
	},
	soldCount: {
		type: "integer",
		minimum: 0,
		description: "已售數量"
	},
	saleStart: {
		...dateTimeString,
		description: "開售時間"
	},
	saleEnd: {
		...dateTimeString,
		description: "結束販售時間"
	},
	isActive: {
		type: "boolean",
		description: "是否啟用"
	},
	requireInviteCode: {
		type: "boolean",
		description: "是否需要邀請碼"
	},
	requireSmsVerification: {
		type: "boolean",
		description: "是否需要簡訊驗證"
	},
	hidden: {
		type: "boolean",
		description: "是否隱藏 (不顯示在公開頁面)"
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

export const ticketCreateBody = {
	type: "object",
	properties: {
		eventId: {
			type: "string",
			description: "活動 ID"
		},
		order: {
			type: "integer",
			description: "顯示順序"
		},
		name: {
			type: "object",
			additionalProperties: true,
			description: "票券名稱 (localized JSON object)"
		},
		description: {
			type: "object",
			additionalProperties: true,
			description: "票券描述 (localized JSON object)"
		},
		plainDescription: {
			type: "object",
			additionalProperties: true,
			description: "票券純文字描述 (localized JSON object)"
		},
		price: {
			type: "number",
			minimum: 0,
			description: "票價"
		},
		quantity: {
			type: "integer",
			minimum: 1,
			description: "可售數量"
		},
		saleStart: {
			...dateTimeString,
			description: "開售時間"
		},
		saleEnd: {
			...dateTimeString,
			description: "結束販售時間"
		},
		requireInviteCode: {
			type: "boolean",
			description: "是否需要邀請碼"
		},
		requireSmsVerification: {
			type: "boolean",
			description: "是否需要簡訊驗證"
		},
		hidden: {
			type: "boolean",
			description: "是否隱藏 (不顯示在公開頁面)"
		}
	},
	required: ["eventId", "name", "price", "quantity"]
} as const;

export const ticketUpdateBody = {
	type: "object",
	properties: {
		order: {
			type: "integer",
			description: "顯示順序"
		},
		name: {
			type: "object",
			additionalProperties: true,
			description: "票券名稱 (localized JSON object)"
		},
		description: {
			type: "object",
			additionalProperties: true,
			description: "票券描述 (localized JSON object)"
		},
		plainDescription: {
			type: "object",
			additionalProperties: true,
			description: "票券純文字描述 (localized JSON object)"
		},
		price: {
			type: "number",
			minimum: 0,
			description: "票價"
		},
		quantity: {
			type: "integer",
			minimum: 0,
			description: "可售數量"
		},
		saleStart: {
			...dateTimeString,
			description: "開售時間"
		},
		saleEnd: {
			...dateTimeString,
			description: "結束販售時間"
		},
		isActive: {
			type: "boolean",
			description: "是否啟用"
		},
		requireInviteCode: {
			type: "boolean",
			description: "是否需要邀請碼"
		},
		requireSmsVerification: {
			type: "boolean",
			description: "是否需要簡訊驗證"
		},
		hidden: {
			type: "boolean",
			description: "是否隱藏 (不顯示在公開頁面)"
		}
	}
} as const;

export const ticketResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "object",
			properties: ticketProperties,
			required: ["id", "eventId", "name", "price", "quantity"]
		}
	},
	required: ["success", "message", "data"]
} as const;

export const ticketsListResponse = {
	type: "object",
	properties: {
		...successResponse.properties,
		data: {
			type: "array",
			items: {
				type: "object",
				properties: ticketProperties
			}
		}
	},
	required: ["success", "message", "data"]
} as const;

export const ticketSchemas = {
	createTicket: {
		description: "創建新票券",
		tags: ["admin/tickets"],
		body: ticketCreateBody,
		response: {
			201: ticketResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse
		}
	},

	getTicket: {
		description: "取得票券詳情",
		tags: ["admin/tickets"],
		params: idParam,
		response: {
			200: ticketResponse,
			404: errorResponse
		}
	},

	updateTicket: {
		description: "更新票券",
		tags: ["admin/tickets"],
		body: ticketUpdateBody,
		params: idParam,
		response: {
			200: ticketResponse,
			400: errorResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	deleteTicket: {
		description: "刪除票券",
		tags: ["admin/tickets"],
		params: idParam,
		response: {
			200: successResponse,
			401: errorResponse,
			403: errorResponse,
			404: errorResponse
		}
	},

	listTickets: {
		description: "取得票券列表",
		tags: ["admin/tickets"],
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
			200: ticketsListResponse
		}
	}
} as const;

// ----------------------------------------------------------------------------
// User Schemas
// ----------------------------------------------------------------------------

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
	},
	smsVerifications: {
		type: "array",
		items: {
			type: "object",
			properties: {
				id: {
					type: "string",
					description: "SMS 驗證記錄 ID"
				},
				phoneNumber: {
					type: "string",
					description: "電話號碼"
				},
				verified: {
					type: "boolean",
					description: "是否已驗證"
				},
				createdAt: {
					...dateTimeString,
					description: "建立時間"
				},
				updatedAt: {
					...dateTimeString,
					description: "更新時間"
				}
			},
			required: ["id", "phoneNumber", "verified", "createdAt", "updatedAt"]
		},
		description: "用戶的 SMS 驗證記錄列表"
	}
} as const;

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
} as const;

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
} as const;

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
} as const;

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
} as const;

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
} as const;

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
} as const;

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
} as const;
