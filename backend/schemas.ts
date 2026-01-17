// SCHEMA DEFINITIONS (Zod)
// ============================================================================

import { z } from "zod/v4";
import {
	// Common schemas
	SortOrderSchema,
	UserRoleSchema,
	RegistrationStatusSchema,

	// Event schemas
	EventSchema,
	EventCreateRequestSchema,
	EventUpdateRequestSchema,
	EventStatsSchema,

	// Ticket schemas
	TicketSchema,
	TicketCreateRequestSchema,
	TicketUpdateRequestSchema,

	// User schemas
	UserSchema,

	// Registration schemas
	RegistrationSchema,
	RegistrationCreateRequestSchema,
	RegistrationUpdateRequestSchema,
	RegistrationStatsSchema,

	// Email campaign schemas
	TargetAudienceSchema,
	EmailCampaignSchema,
	EmailCampaignCreateRequestSchema,
	EmailCampaignUpdateRequestSchema,
	EmailCampaignSendRequestSchema,

	// Invitation code schemas
	InvitationCodeSchema,
	InvitationCodeCreateRequestSchema,
	InvitationCodeUpdateRequestSchema,
	InvitationCodeVerifyRequestSchema,
	InvitationCodeVerificationSchema,

	// Referral schemas
	ReferralSchema,
	ReferralValidateRequestSchema,
	ReferralValidationSchema,
	ReferralUsageSchema,

	// Form field schemas
	EventFormFieldSchema,
	EventFormFieldCreateRequestSchema,
	EventFormFieldUpdateRequestSchema,

	// SMS schemas
	SendVerificationRequestSchema,
	VerifyCodeRequestSchema,

	// Validation schemas
	ValidationErrorSchema
} from "@sitcontix/types";

// ----------------------------------------------------------------------------
// Common Schemas
// ----------------------------------------------------------------------------

export const IdParamSchema = z.object({
	id: z.string().describe("資源 ID")
});

export const PaginationQuerySchemaExtended = z.object({
	page: z.coerce.number().int().min(1).default(1).describe("頁數"),
	limit: z.coerce.number().int().min(1).max(100).default(10).describe("每頁項目數")
});

export const SearchQuerySchemaExtended = z.object({
	q: z.string().optional().describe("搜尋關鍵字"),
	sortBy: z.string().optional().describe("排序欄位"),
	sortOrder: SortOrderSchema.default("desc").describe("排序方向")
});

export const SuccessResponseSchema = z.object({
	success: z.literal(true),
	message: z.string().describe("回應訊息"),
	data: z.unknown().optional().describe("回應資料")
});

export const ErrorResponseSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.string().describe("錯誤代碼"),
		message: z.string().describe("錯誤訊息"),
		details: z.unknown().optional().describe("錯誤詳細資訊")
	})
});

export const PaginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
	z.object({
		success: z.literal(true),
		message: z.string(),
		data: dataSchema,
		pagination: z.object({
			page: z.number().int().describe("當前頁數"),
			limit: z.number().int().describe("每頁項目數"),
			total: z.number().int().describe("總項目數"),
			totalPages: z.number().int().describe("總頁數"),
			hasNext: z.boolean().describe("是否有下一頁"),
			hasPrev: z.boolean().describe("是否有上一頁")
		})
	});

export const DateTimeSchema = z.iso.datetime().describe("ISO 8601 日期時間格式");

// Re-export common enums for convenience
export { RegistrationStatusSchema as StatusEnumSchema };
export { UserRoleSchema as RoleEnumSchema };

// ----------------------------------------------------------------------------
// Email Campaign Schemas
// ----------------------------------------------------------------------------

export const CampaignStatusSchema = z.enum(["draft", "sent", "scheduled"]).describe("活動狀態");

export const EmailCampaignPropertiesSchema = EmailCampaignSchema.extend({
	eventId: z.string().optional().describe("關聯活動 ID"),
	targetAudience: TargetAudienceSchema.optional().describe("目標受眾篩選條件"),
	createdBy: z.string().optional().describe("建立者用戶 ID")
});

export const EmailCampaignCreateBodySchema = EmailCampaignCreateRequestSchema.extend({
	eventId: z.string().optional().describe("關聯活動 ID"),
	targetAudience: TargetAudienceSchema.optional().describe("目標受眾篩選條件")
});

export const EmailCampaignUpdateBodySchema = EmailCampaignUpdateRequestSchema.extend({
	eventId: z.string().optional().describe("關聯活動 ID"),
	targetAudience: TargetAudienceSchema.optional().describe("目標受眾篩選條件")
});

export const EmailCampaignSendBodySchema = EmailCampaignSendRequestSchema;

export const EmailCampaignResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: EmailCampaignPropertiesSchema
});

export const EmailCampaignsListResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: z.array(EmailCampaignPropertiesSchema)
});

export const emailCampaignSchemas = {
	createEmailCampaign: {
		description: "創建新郵件活動",
		tags: ["admin/email-campaigns"],
		body: EmailCampaignCreateBodySchema,
		response: {
			201: EmailCampaignResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema
		}
	},

	getEmailCampaign: {
		description: "取得郵件活動詳情",
		tags: ["admin/email-campaigns"],
		params: IdParamSchema,
		response: {
			200: EmailCampaignResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	updateEmailCampaign: {
		description: "更新郵件活動",
		tags: ["admin/email-campaigns"],
		body: EmailCampaignUpdateBodySchema,
		params: IdParamSchema,
		response: {
			200: EmailCampaignResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	deleteEmailCampaign: {
		description: "刪除郵件活動",
		tags: ["admin/email-campaigns"],
		params: IdParamSchema,
		response: {
			200: SuccessResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	listEmailCampaigns: {
		description: "取得郵件活動列表",
		tags: ["admin/email-campaigns"],
		querystring: z.object({
			status: CampaignStatusSchema.optional().describe("篩選活動狀態"),
			eventId: z.string().optional().describe("篩選關聯活動 ID")
		}),
		response: {
			200: EmailCampaignsListResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema
		}
	},

	sendEmailCampaign: {
		description: "發送郵件活動",
		tags: ["admin/email-campaigns"],
		body: EmailCampaignSendBodySchema,
		params: IdParamSchema,
		response: {
			200: EmailCampaignResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	}
} as const;

// ----------------------------------------------------------------------------
// Event Schemas
// ----------------------------------------------------------------------------

export const EventPropertiesSchema = EventSchema;

export const EventCreateBodySchema = EventCreateRequestSchema;

export const EventUpdateBodySchema = EventUpdateRequestSchema;

export const EventResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: EventSchema
});

export const EventsListResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: z.array(EventSchema)
});

export const eventSchemas = {
	createEvent: {
		description: "創建新活動",
		tags: ["admin/events"],
		body: EventCreateBodySchema,
		response: {
			201: EventResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema
		}
	},

	getEvent: {
		description: "取得活動詳情",
		tags: ["events"],
		params: IdParamSchema,
		response: {
			200: EventResponseSchema,
			404: ErrorResponseSchema
		}
	},

	updateEvent: {
		description: "更新活動",
		tags: ["admin/events"],
		body: EventUpdateBodySchema,
		params: IdParamSchema,
		response: {
			200: EventResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	deleteEvent: {
		description: "刪除活動",
		tags: ["admin/events"],
		params: IdParamSchema,
		response: {
			200: SuccessResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	listEvents: {
		description: "取得活動列表",
		tags: ["events"],
		querystring: z.object({
			isActive: z.coerce.boolean().optional().describe("篩選啟用狀態")
		}),
		response: {
			200: EventsListResponseSchema
		}
	}
} as const;

export const eventTicketsResponse = {
	200: z.object({
		success: z.literal(true),
		message: z.string(),
		data: z.array(
			TicketSchema.pick({
				id: true,
				name: true,
				description: true,
				plainDescription: true,
				price: true,
				quantity: true,
				available: true,
				saleStart: true,
				saleEnd: true,
				isOnSale: true,
				isSoldOut: true,
				requireSmsVerification: true,
				requireInviteCode: true
			}).extend({
				formFields: z.array(z.object({
					id: z.string(),
					name: z.unknown(),
					description: z.unknown().nullable(),
					type: z.string(),
					required: z.boolean(),
					validater: z.string().nullable(),
					placeholder: z.string().nullable(),
					options: z.array(z.unknown()),
					order: z.number()
				}))
			})
		)
	})
} as const;

export const publicEventsListResponse = {
	200: z.object({
		success: z.literal(true),
		message: z.string(),
		data: z.array(
			z.object({
				id: z.string(),
				slug: z.string().nullable().optional(),
				name: z.unknown(),
				description: z.unknown().nullable().optional(),
				plainDescription: z.unknown().nullable().optional(),
				location: z.string().nullable().optional(),
				startDate: z.string(),
				endDate: z.string(),
				ogImage: z.string().nullable().optional(),
				hideEvent: z.boolean().optional(),
				useOpass: z.boolean().optional(),
				ticketCount: z.number(),
				registrationCount: z.number(),
				hasAvailableTickets: z.boolean()
			})
		)
	})
} as const;

export const eventStatsResponse = {
	200: z.object({
		success: z.literal(true),
		message: z.string(),
		data: EventStatsSchema
	})
} as const;

// ----------------------------------------------------------------------------
// Event Form Field Schemas
// ----------------------------------------------------------------------------

export const EventFormFieldPropertiesSchema = EventFormFieldSchema;

export const EventFormFieldCreateBodySchema = EventFormFieldCreateRequestSchema;

export const EventFormFieldUpdateBodySchema = EventFormFieldUpdateRequestSchema;

export const EventFormFieldResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: EventFormFieldSchema
});

export const EventFormFieldsListResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: z.array(EventFormFieldSchema)
});

export const eventFormFieldSchemas = {
	createEventFormField: {
		description: "創建活動表單欄位",
		tags: ["admin/events"],
		body: EventFormFieldCreateBodySchema,
		response: {
			201: EventFormFieldResponseSchema,
			400: z.union([ErrorResponseSchema, ValidationErrorSchema]),
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	getEventFormField: {
		description: "取得活動表單欄位詳情",
		tags: ["admin/events"],
		params: IdParamSchema,
		response: {
			200: EventFormFieldResponseSchema,
			404: ErrorResponseSchema
		}
	},

	updateEventFormField: {
		description: "更新活動表單欄位",
		tags: ["admin/events"],
		body: EventFormFieldUpdateBodySchema,
		params: IdParamSchema,
		response: {
			200: EventFormFieldResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	deleteEventFormField: {
		description: "刪除活動表單欄位",
		tags: ["admin/events"],
		params: IdParamSchema,
		response: {
			200: SuccessResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	listEventFormFields: {
		description: "取得活動表單欄位列表",
		tags: ["admin/events"],
		querystring: z.object({
			eventId: z.string().optional().describe("篩選活動 ID")
		}),
		response: {
			200: EventFormFieldsListResponseSchema
		}
	}
} as const;

// ----------------------------------------------------------------------------
// Invitation Code Schemas
// ----------------------------------------------------------------------------

export const InvitationCodePropertiesSchema = InvitationCodeSchema;

export const InvitationCodeCreateBodySchema = InvitationCodeCreateRequestSchema;

export const InvitationCodeUpdateBodySchema = InvitationCodeUpdateRequestSchema;

export const InvitationCodeValidateBodySchema = InvitationCodeVerifyRequestSchema;

export const InvitationCodeResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: InvitationCodeSchema
});

export const InvitationCodesListResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: z.array(InvitationCodeSchema)
});

export const invitationCodeSchemas = {
	createInvitationCode: {
		description: "創建新邀請碼",
		tags: ["admin/invitation-codes"],
		body: InvitationCodeCreateBodySchema,
		response: {
			201: InvitationCodeResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			409: ErrorResponseSchema
		}
	},

	getInvitationCode: {
		description: "取得邀請碼詳情",
		tags: ["admin/invitation-codes"],
		params: IdParamSchema,
		response: {
			200: InvitationCodeResponseSchema,
			404: ErrorResponseSchema
		}
	},

	updateInvitationCode: {
		description: "更新邀請碼",
		tags: ["admin/invitation-codes"],
		body: InvitationCodeUpdateBodySchema,
		params: IdParamSchema,
		response: {
			200: InvitationCodeResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	deleteInvitationCode: {
		description: "刪除邀請碼",
		tags: ["admin/invitation-codes"],
		params: IdParamSchema,
		response: {
			200: SuccessResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	listInvitationCodes: {
		description: "取得邀請碼列表",
		tags: ["admin/invitation-codes"],
		querystring: z.object({
			ticketId: z.string().optional().describe("篩選票券 ID"),
			isActive: z.coerce.boolean().optional().describe("篩選啟用狀態"),
			eventId: z.string().optional().describe("篩選活動 ID")
		}),
		response: {
			200: InvitationCodesListResponseSchema
		}
	},

	validateInvitationCode: {
		description: "驗證邀請碼",
		tags: ["public"],
		body: InvitationCodeValidateBodySchema,
		response: {
			200: z.object({
				success: z.literal(true),
				message: z.string(),
				data: z.object({
					isValid: z.boolean().describe("是否有效"),
					code: z.string().describe("邀請碼"),
					remainingUses: z.number().int().optional().describe("剩餘使用次數")
				})
			}),
			400: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	}
} as const;

export const invitationCodeVerifyResponse = {
	200: z.object({
		success: z.literal(true),
		message: z.string(),
		data: InvitationCodeVerificationSchema
	})
} as const;

// ----------------------------------------------------------------------------
// Referral Schemas
// ----------------------------------------------------------------------------

export const ReferralPropertiesSchema = ReferralSchema.extend({
	userId: z.string().optional().describe("建立者用戶 ID"),
	description: z.string().optional().describe("描述"),
	usedCount: z.number().int().min(0).optional().describe("使用次數")
});

export const ReferralCreateBodySchema = z.object({
	eventId: z.string().describe("活動 ID"),
	code: z.string().min(1).describe("推薦碼"),
	description: z.string().optional().describe("描述")
});

export const ReferralUpdateBodySchema = z.object({
	code: z.string().min(1).optional().describe("推薦碼"),
	description: z.string().optional().describe("描述"),
	isActive: z.boolean().optional().describe("是否啟用")
});

export const ReferralValidateBodySchema = ReferralValidateRequestSchema;

export const ReferralResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: ReferralPropertiesSchema
});

export const ReferralsListResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: z.array(ReferralPropertiesSchema)
});

export const ReferralUsageListResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: z.array(ReferralUsageSchema)
});

export const referralStatsResponse = {
	200: z.object({
		success: z.literal(true),
		message: z.string(),
		data: RegistrationStatsSchema
	}),
	404: ErrorResponseSchema
} as const;

export const referralSchemas = {
	createReferral: {
		description: "創建新推薦碼",
		tags: ["referrals"],
		body: ReferralCreateBodySchema,
		response: {
			201: ReferralResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			409: ErrorResponseSchema
		}
	},

	getReferral: {
		description: "取得推薦碼詳情",
		tags: ["referrals"],
		params: IdParamSchema,
		response: {
			200: ReferralResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	updateReferral: {
		description: "更新推薦碼",
		tags: ["referrals"],
		body: ReferralUpdateBodySchema,
		params: IdParamSchema,
		response: {
			200: ReferralResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	deleteReferral: {
		description: "刪除推薦碼",
		tags: ["referrals"],
		params: IdParamSchema,
		response: {
			200: SuccessResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	listReferrals: {
		description: "取得推薦碼列表",
		tags: ["referrals"],
		querystring: z.object({
			eventId: z.string().optional().describe("篩選活動 ID"),
			isActive: z.coerce.boolean().optional().describe("篩選啟用狀態")
		}),
		response: {
			200: ReferralsListResponseSchema,
			401: ErrorResponseSchema
		}
	},

	validateReferral: {
		description: "驗證推薦碼",
		tags: ["public"],
		body: ReferralValidateBodySchema,
		response: {
			200: z.object({
				success: z.literal(true),
				message: z.string(),
				data: ReferralValidationSchema
			}),
			400: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	getReferralUsage: {
		description: "取得推薦碼使用記錄",
		tags: ["admin/referrals"],
		params: IdParamSchema,
		response: {
			200: ReferralUsageListResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	}
} as const;

// ----------------------------------------------------------------------------
// Registration Schemas
// ----------------------------------------------------------------------------

export const RegistrationPropertiesSchema = RegistrationSchema;

export const RegistrationCreateBodySchema = RegistrationCreateRequestSchema;

export const RegistrationUpdateBodySchema = RegistrationUpdateRequestSchema;

export const RegistrationQuerySchema = z.object({
	...PaginationQuerySchemaExtended.shape,
	eventId: z.string().optional().describe("篩選活動 ID"),
	status: RegistrationStatusSchema.optional().describe("篩選報名狀態"),
	userId: z.string().optional().describe("篩選用戶 ID")
});

export const RegistrationResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: RegistrationSchema
});

export const RegistrationsListResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: z.array(RegistrationSchema)
});

export const registrationSchemas = {
	createRegistration: {
		description: "創建新報名",
		tags: ["registrations"],
		body: RegistrationCreateBodySchema,
		response: {
			201: RegistrationResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			409: ErrorResponseSchema
		}
	},

	getRegistration: {
		description: "取得報名詳情",
		tags: ["registrations"],
		params: IdParamSchema,
		response: {
			200: RegistrationResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	updateRegistration: {
		description: "更新報名",
		tags: ["registrations"],
		body: RegistrationUpdateBodySchema,
		params: IdParamSchema,
		response: {
			200: RegistrationResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	listRegistrations: {
		description: "取得報名列表",
		tags: ["admin/registrations"],
		querystring: RegistrationQuerySchema,
		response: {
			200: RegistrationsListResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema
		}
	}
} as const;

export const userRegistrationsResponse = {
	200: z.object({
		success: z.literal(true),
		message: z.string(),
		data: z.array(
			z.object({
				id: z.string(),
				userId: z.string(),
				eventId: z.string(),
				ticketId: z.string(),
				email: z.string(),
				status: z.string(),
				referredBy: z.string().nullable().optional(),
				formData: z.unknown(),
				createdAt: z.string(),
				updatedAt: z.string(),
				event: z.object({
					id: z.string(),
					name: z.unknown(),
					description: z.unknown().nullable().optional(),
					location: z.string().nullable().optional(),
					startDate: z.string(),
					endDate: z.string(),
					ogImage: z.string().nullable().optional()
				}),
				ticket: z.object({
					id: z.string(),
					name: z.unknown(),
					description: z.unknown().nullable().optional(),
					price: z.number(),
					saleEnd: z.string().nullable().optional()
				}),
				isUpcoming: z.boolean(),
				isPast: z.boolean(),
				canEdit: z.boolean(),
				canCancel: z.boolean()
			})
		)
	})
} as const;

// ----------------------------------------------------------------------------
// SMS Verification Schemas
// ----------------------------------------------------------------------------

export const smsVerificationSchemas = {
	send: {
		description: "發送簡訊驗證碼",
		tags: ["sms-verification"],
		body: SendVerificationRequestSchema
	},

	verify: {
		description: "驗證簡訊驗證碼",
		tags: ["sms-verification"],
		body: VerifyCodeRequestSchema
	},

	status: {
		description: "取得用戶的手機驗證狀態",
		tags: ["sms-verification"]
	}
} as const;

// ----------------------------------------------------------------------------
// Ticket Schemas
// ----------------------------------------------------------------------------

export const TicketPropertiesSchema = TicketSchema;

export const TicketCreateBodySchema = TicketCreateRequestSchema;

export const TicketUpdateBodySchema = TicketUpdateRequestSchema;

export const TicketResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: TicketSchema
});

export const TicketsListResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: z.array(TicketSchema)
});

export const ticketSchemas = {
	createTicket: {
		description: "創建新票券",
		tags: ["admin/tickets"],
		body: TicketCreateBodySchema,
		response: {
			201: TicketResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema
		}
	},

	getTicket: {
		description: "取得票券詳情",
		tags: ["admin/tickets"],
		params: IdParamSchema,
		response: {
			200: TicketResponseSchema,
			404: ErrorResponseSchema
		}
	},

	updateTicket: {
		description: "更新票券",
		tags: ["admin/tickets"],
		body: TicketUpdateBodySchema,
		params: IdParamSchema,
		response: {
			200: TicketResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	deleteTicket: {
		description: "刪除票券",
		tags: ["admin/tickets"],
		params: IdParamSchema,
		response: {
			200: SuccessResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	listTickets: {
		description: "取得票券列表",
		tags: ["admin/tickets"],
		querystring: z.object({
			eventId: z.string().optional().describe("篩選活動 ID"),
			isActive: z.coerce.boolean().optional().describe("篩選啟用狀態")
		}),
		response: {
			200: TicketsListResponseSchema
		}
	}
} as const;

// ----------------------------------------------------------------------------
// User Schemas
// ----------------------------------------------------------------------------

export const UserPropertiesSchema = UserSchema;

export const UserCreateBodySchema = z.object({
	name: z.string().min(1).describe("用戶名稱"),
	email: z.email().describe("電子郵件"),
	role: UserRoleSchema.describe("用戶角色"),
	permissions: z.array(z.string()).optional().describe("用戶權限列表")
});

export const UserUpdateBodySchema = z.object({
	name: z.string().min(1).optional().describe("用戶名稱"),
	email: z.email().optional().describe("電子郵件"),
	role: UserRoleSchema.optional().describe("用戶角色"),
	permissions: z.array(z.string()).optional().describe("用戶權限列表"),
	isActive: z.boolean().optional().describe("是否啟用")
});

export const ProfileUpdateBodySchema = z.object({
	name: z.string().min(1).optional().describe("用戶名稱"),
	image: z.string().optional().describe("用戶頭像 URL")
});

export const ChangePasswordBodySchema = z.object({
	currentPassword: z.string().describe("目前密碼"),
	newPassword: z.string().min(6).describe("新密碼")
});

export const UserResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: UserSchema
});

export const UsersListResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	data: z.array(UserSchema)
});

export const userSchemas = {
	createUser: {
		description: "創建新用戶",
		tags: ["admin/users"],
		body: UserCreateBodySchema,
		response: {
			201: UserResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			409: ErrorResponseSchema
		}
	},

	getUser: {
		description: "取得用戶詳情",
		tags: ["admin/users"],
		params: IdParamSchema,
		response: {
			200: UserResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	updateUser: {
		description: "更新用戶",
		tags: ["admin/users"],
		body: UserUpdateBodySchema,
		params: IdParamSchema,
		response: {
			200: UserResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema,
			404: ErrorResponseSchema
		}
	},

	updateProfile: {
		description: "更新個人資料",
		tags: ["auth"],
		body: ProfileUpdateBodySchema,
		response: {
			200: UserResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema
		}
	},

	changePassword: {
		description: "變更密碼",
		tags: ["auth"],
		body: ChangePasswordBodySchema,
		response: {
			200: SuccessResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema
		}
	},

	listUsers: {
		description: "取得用戶列表",
		tags: ["admin/users"],
		querystring: z.object({
			role: UserRoleSchema.optional().describe("篩選角色"),
			isActive: z.coerce.boolean().optional().describe("篩選啟用狀態")
		}),
		response: {
			200: UsersListResponseSchema,
			401: ErrorResponseSchema,
			403: ErrorResponseSchema
		}
	}
} as const;

// ----------------------------------------------------------------------------
// Legacy exports for backwards compatibility
// ----------------------------------------------------------------------------

export const idParam = IdParamSchema;
export const paginationQuery = PaginationQuerySchemaExtended;
export const searchQuery = SearchQuerySchemaExtended;
export const successResponse = SuccessResponseSchema;
export const errorResponse = ErrorResponseSchema;
export const paginatedResponse = PaginatedResponseSchema;
export const dateTimeString = DateTimeSchema;
export const statusEnum = RegistrationStatusSchema;
export const roleEnum = UserRoleSchema;
export const campaignStatusEnum = CampaignStatusSchema;

// Email Campaign
export const emailCampaignProperties = EmailCampaignPropertiesSchema;
export const emailCampaignCreateBody = EmailCampaignCreateBodySchema;
export const emailCampaignUpdateBody = EmailCampaignUpdateBodySchema;
export const emailCampaignSendBody = EmailCampaignSendBodySchema;
export const emailCampaignResponse = EmailCampaignResponseSchema;
export const emailCampaignsListResponse = EmailCampaignsListResponseSchema;

// Event
export const eventProperties = EventPropertiesSchema;
export const eventCreateBody = EventCreateBodySchema;
export const eventUpdateBody = EventUpdateBodySchema;
export const eventResponse = EventResponseSchema;
export const eventsListResponse = EventsListResponseSchema;

// Event Form Field
export const eventFormFieldProperties = EventFormFieldPropertiesSchema;
export const eventFormFieldCreateBody = EventFormFieldCreateBodySchema;
export const eventFormFieldUpdateBody = EventFormFieldUpdateBodySchema;
export const eventFormFieldResponse = EventFormFieldResponseSchema;
export const eventFormFieldsListResponse = EventFormFieldsListResponseSchema;

// Invitation Code
export const invitationCodeProperties = InvitationCodePropertiesSchema;
export const invitationCodeCreateBody = InvitationCodeCreateBodySchema;
export const invitationCodeUpdateBody = InvitationCodeUpdateBodySchema;
export const invitationCodeValidateBody = InvitationCodeValidateBodySchema;
export const invitationCodeResponse = InvitationCodeResponseSchema;
export const invitationCodesListResponse = InvitationCodesListResponseSchema;

// Referral
export const referralProperties = ReferralPropertiesSchema;
export const referralCreateBody = ReferralCreateBodySchema;
export const referralUpdateBody = ReferralUpdateBodySchema;
export const referralValidateBody = ReferralValidateBodySchema;
export const referralResponse = ReferralResponseSchema;
export const referralsListResponse = ReferralsListResponseSchema;
export const referralUsageListResponse = ReferralUsageListResponseSchema;

// Registration
export const registrationProperties = RegistrationPropertiesSchema;
export const registrationCreateBody = RegistrationCreateBodySchema;
export const registrationUpdateBody = RegistrationUpdateBodySchema;
export const registrationQuery = RegistrationQuerySchema;
export const registrationResponse = RegistrationResponseSchema;
export const registrationsListResponse = RegistrationsListResponseSchema;

// Ticket
export const ticketProperties = TicketPropertiesSchema;
export const ticketCreateBody = TicketCreateBodySchema;
export const ticketUpdateBody = TicketUpdateBodySchema;
export const ticketResponse = TicketResponseSchema;
export const ticketsListResponse = TicketsListResponseSchema;

// User
export const userProperties = UserPropertiesSchema;
export const userCreateBody = UserCreateBodySchema;
export const userUpdateBody = UserUpdateBodySchema;
export const profileUpdateBody = ProfileUpdateBodySchema;
export const changePasswordBody = ChangePasswordBodySchema;
export const userResponse = UserResponseSchema;
export const usersListResponse = UsersListResponseSchema;
