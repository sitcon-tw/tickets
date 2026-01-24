// SCHEMA DEFINITIONS (Zod)
// ============================================================================

import {
	EmailCampaignCreateRequestSchema,
	EmailCampaignSchema,
	EmailCampaignSendRequestSchema,
	EmailCampaignUpdateRequestSchema,
	EventCreateRequestSchema,
	EventFormFieldCreateRequestSchema,
	// Form field schemas
	EventFormFieldSchema,
	EventFormFieldUpdateRequestSchema,
	// Event schemas
	EventSchema,
	EventStatsSchema,
	EventUpdateRequestSchema,
	InvitationCodeCreateRequestSchema,
	// Invitation code schemas
	InvitationCodeSchema,
	InvitationCodeUpdateRequestSchema,
	InvitationCodeVerificationSchema,
	InvitationCodeVerifyRequestSchema,
	LocalizedTextSchema,
	// Referral schemas
	ReferralSchema,
	ReferralUsageSchema,
	ReferralValidateRequestSchema,
	ReferralValidationSchema,
	RegistrationCreateRequestSchema,
	// Registration schemas
	RegistrationSchema,
	RegistrationStatsSchema,
	RegistrationStatusSchema,
	RegistrationUpdateRequestSchema,
	// SMS schemas
	SendVerificationRequestSchema,
	// Common schemas
	SortOrderSchema,
	// Email campaign schemas
	TargetAudienceSchema,
	TicketCreateRequestSchema,
	// Ticket schemas
	TicketSchema,
	TicketUpdateRequestSchema,
	UserRoleSchema,
	// User schemas
	UserSchema,
	// Validation schemas
	ValidationErrorSchema,
	VerifyCodeRequestSchema
} from "@sitcontix/types";
import { z } from "zod/v4";

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

// Re-export common enums for convenience
export { UserRoleSchema as RoleEnumSchema, RegistrationStatusSchema as StatusEnumSchema };

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
			403: ErrorResponseSchema,
			422: ErrorResponseSchema
		}
	},

	getEvent: {
		description: "取得活動詳情",
		tags: ["events"],
		params: IdParamSchema,
		response: {
			200: EventResponseSchema,
			404: ErrorResponseSchema,
			500: ErrorResponseSchema
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
			404: ErrorResponseSchema,
			422: ErrorResponseSchema
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
			404: ErrorResponseSchema,
			409: ErrorResponseSchema
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
				requireInviteCode: true,
				showRemaining: true
			})
		)
	}),
	404: ErrorResponseSchema,
	500: ErrorResponseSchema
} as const;

export const publicEventsListResponse = {
	200: z.object({
		success: z.literal(true),
		message: z.string(),
		data: z.array(
			z.object({
				id: z.string(),
				slug: z.string().nullable().optional(),
				name: LocalizedTextSchema,
				description: LocalizedTextSchema.nullable().optional(),
				plainDescription: LocalizedTextSchema.nullable().optional(),
				locationText: LocalizedTextSchema.nullable().optional(),
				mapLink: z.string().nullable().optional(),
				startDate: z.date(),
				endDate: z.date(),
				ogImage: z.string().nullable().optional(),
				useOpass: z.boolean().optional(),
				opassEventId: z.string().nullable().optional(),
				registrationCount: z.number(),
				hasAvailableTickets: z.boolean()
			})
		)
	}),
	500: ErrorResponseSchema
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
			409: ErrorResponseSchema,
			422: ErrorResponseSchema,
			500: ErrorResponseSchema
		}
	},

	getInvitationCode: {
		description: "取得邀請碼詳情",
		tags: ["admin/invitation-codes"],
		params: IdParamSchema,
		response: {
			200: InvitationCodeResponseSchema,
			404: ErrorResponseSchema,
			500: ErrorResponseSchema
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
			404: ErrorResponseSchema,
			409: ErrorResponseSchema,
			422: ErrorResponseSchema,
			500: ErrorResponseSchema
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
			404: ErrorResponseSchema,
			409: ErrorResponseSchema,
			500: ErrorResponseSchema
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
			200: InvitationCodesListResponseSchema,
			500: ErrorResponseSchema
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

// Admin registration schema - more permissive for list endpoints
export const AdminRegistrationSchema = z.object({
	id: z.string(),
	userId: z.string(),
	eventId: z.string(),
	ticketId: z.string(),
	email: z.string(),
	status: RegistrationStatusSchema,
	referredBy: z.string().nullable().optional(),
	formData: z.record(z.string(), z.unknown()),
	createdAt: z.date(),
	updatedAt: z.date(),
	event: z
		.object({
			id: z.string(),
			name: LocalizedTextSchema,
			startDate: z.date(),
			endDate: z.date()
		})
		.optional(),
	ticket: z
		.object({
			id: z.string(),
			name: LocalizedTextSchema,
			price: z.number()
		})
		.optional()
});

export const AdminRegistrationsListResponseSchema = PaginatedResponseSchema(z.array(AdminRegistrationSchema));

export const registrationSchemas = {
	createRegistration: {
		description: "創建新報名",
		tags: ["registrations"],
		body: RegistrationCreateBodySchema,
		response: {
			201: RegistrationResponseSchema,
			400: ErrorResponseSchema,
			401: ErrorResponseSchema,
			404: ErrorResponseSchema,
			409: ErrorResponseSchema,
			422: ErrorResponseSchema,
			500: ErrorResponseSchema
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
			404: ErrorResponseSchema,
			422: ErrorResponseSchema,
			500: ErrorResponseSchema
		}
	},

	listRegistrations: {
		description: "取得報名列表",
		tags: ["admin/registrations"],
		querystring: RegistrationQuerySchema,
		response: {
			200: AdminRegistrationsListResponseSchema,
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
				createdAt: z.date(),
				updatedAt: z.date(),
				event: z.object({
					id: z.string(),
					name: z.unknown(),
					description: z.unknown().nullable().optional(),
					locationText: z.unknown().nullable().optional(),
					mapLink: z.string().nullable().optional(),
					startDate: z.date(),
					endDate: z.date(),
					ogImage: z.string().nullable().optional()
				}),
				ticket: z.object({
					id: z.string(),
					name: z.unknown(),
					description: z.unknown().nullable().optional(),
					price: z.number(),
					saleEnd: z.date().nullable().optional()
				}),
				isUpcoming: z.boolean(),
				isPast: z.boolean(),
				canEdit: z.boolean(),
				canCancel: z.boolean()
			})
		)
	}),
	500: ErrorResponseSchema
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
			403: ErrorResponseSchema,
			404: ErrorResponseSchema,
			422: ErrorResponseSchema,
			500: ErrorResponseSchema
		}
	},

	getTicket: {
		description: "取得票券詳情",
		tags: ["admin/tickets"],
		params: IdParamSchema,
		response: {
			200: TicketResponseSchema,
			404: ErrorResponseSchema,
			500: ErrorResponseSchema
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
			404: ErrorResponseSchema,
			422: ErrorResponseSchema,
			500: ErrorResponseSchema
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
			404: ErrorResponseSchema,
			409: ErrorResponseSchema,
			500: ErrorResponseSchema
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
			200: TicketsListResponseSchema,
			500: ErrorResponseSchema
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
// Public Ticket Schemas
// ----------------------------------------------------------------------------

export const PublicTicketIdParamSchema = z.object({
	id: z.string()
});

export const PublicTicketResponseDataSchema = z.object({
	id: z.string(),
	name: LocalizedTextSchema,
	description: LocalizedTextSchema.nullable(),
	plainDescription: LocalizedTextSchema.nullable(),
	price: z.number(),
	quantity: z.number().int(),
	soldCount: z.number().int(),
	available: z.number().int(),
	saleStart: z.date().optional().nullable(),
	saleEnd: z.date().optional().nullable(),
	isOnSale: z.boolean(),
	isSoldOut: z.boolean(),
	requireInviteCode: z.boolean(),
	requireSmsVerification: z.boolean()
});

export const PublicTicketResponseSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
	data: PublicTicketResponseDataSchema.optional()
});

export const PublicTicketNotFoundResponseSchema = z.object({
	success: z.boolean(),
	error: z
		.object({
			code: z.string(),
			message: z.string()
		})
		.optional()
});

export const publicTicketSchemas = {
	getPublicTicket: {
		description: "獲取票券公開資訊",
		tags: ["tickets"],
		params: PublicTicketIdParamSchema,
		response: {
			200: PublicTicketResponseSchema,
			404: PublicTicketNotFoundResponseSchema,
			500: ErrorResponseSchema
		}
	}
} as const;

// ----------------------------------------------------------------------------
// Public Events Additional Schemas
// ----------------------------------------------------------------------------

export const PublicEventsQuerySchema = z.object({
	isActive: z.coerce.boolean().optional(),
	upcoming: z.coerce.boolean().optional()
});

export const TicketFormFieldsResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	data: z.array(
		z.object({
			id: z.string(),
			name: z.unknown(),
			description: z.unknown().nullable(),
			type: z.string(),
			required: z.boolean(),
			options: z.array(z.unknown()),
			validater: z.string().nullable(),
			placeholder: z.string().nullable(),
			order: z.number(),
			filters: z.unknown(),
			prompts: z.unknown(),
			enableOther: z.boolean()
		})
	)
});

export const publicEventSchemas = {
	getTicketFormFields: {
		description: "獲取活動報名表單欄位（透過票券 ID）",
		tags: ["events"],
		params: PublicTicketIdParamSchema,
		response: {
			200: TicketFormFieldsResponseSchema
		}
	},
	listPublicEvents: {
		description: "獲取所有活動列表",
		tags: ["events"],
		querystring: PublicEventsQuerySchema,
		response: publicEventsListResponse
	}
} as const;

// ----------------------------------------------------------------------------
// Admin Ticket Analytics Schemas
// ----------------------------------------------------------------------------

export const TicketAnalyticsResponseSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
	data: z
		.object({
			totalSold: z.number().int(),
			totalRevenue: z.number(),
			availableQuantity: z.number().int(),
			salesByStatus: z.record(z.string(), z.unknown()),
			dailySales: z.array(z.unknown())
		})
		.optional()
});

export const TicketReorderBodySchema = z.object({
	tickets: z.array(
		z.object({
			id: z.string(),
			order: z.number()
		})
	)
});

export const TicketReorderResponseSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
	data: z.null()
});

export const adminTicketSchemas = {
	getTicketAnalytics: {
		description: "取得票券銷售分析",
		tags: ["admin/tickets"],
		params: IdParamSchema,
		response: {
			200: TicketAnalyticsResponseSchema,
			404: ErrorResponseSchema,
			500: ErrorResponseSchema
		}
	},
	reorderTickets: {
		description: "重新排序票券",
		tags: ["admin/tickets"],
		body: TicketReorderBodySchema,
		response: {
			200: TicketReorderResponseSchema,
			404: ErrorResponseSchema,
			422: ErrorResponseSchema,
			500: ErrorResponseSchema
		}
	}
} as const;

// ----------------------------------------------------------------------------
// Admin Registration Schemas
// ----------------------------------------------------------------------------

export const RegistrationExportQuerySchema = z.object({
	eventId: z.string().optional(),
	status: z.enum(["confirmed", "cancelled", "pending"]).optional(),
	format: z.enum(["csv", "excel"]).default("csv").optional()
});

export const RegistrationDeleteResponseSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
	data: z.record(z.string(), z.unknown()).optional()
});

export const GoogleSheetsServiceAccountResponseSchema = z.object({
	success: z.boolean(),
	data: z
		.object({
			email: z.string()
		})
		.optional()
});

export const GoogleSheetsSyncBodySchema = z.object({
	eventId: z.string(),
	sheetsUrl: z.string()
});

export const GoogleSheetsSyncResponseSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
	data: z
		.object({
			count: z.number(),
			sheetsUrl: z.string()
		})
		.optional()
});

export const adminRegistrationSchemas = {
	exportRegistrations: {
		description: "匯出報名資料",
		tags: ["admin/registrations"],
		querystring: RegistrationExportQuerySchema
	},
	deleteRegistration: {
		description: "刪除報名記錄",
		tags: ["admin/registrations"],
		params: IdParamSchema,
		response: {
			200: RegistrationDeleteResponseSchema,
			404: ErrorResponseSchema
		}
	},
	getGoogleSheetsServiceAccount: {
		description: "取得 Google Sheets 服務帳號 Email",
		tags: ["admin/registrations"],
		response: {
			200: GoogleSheetsServiceAccountResponseSchema
		}
	},
	syncGoogleSheets: {
		description: "同步報名資料到 Google Sheets",
		tags: ["admin/registrations"],
		body: GoogleSheetsSyncBodySchema,
		response: {
			200: GoogleSheetsSyncResponseSchema
		}
	}
} as const;

// ----------------------------------------------------------------------------
// Admin Event Form Fields Reorder Schemas
// ----------------------------------------------------------------------------

export const EventFormFieldReorderParamsSchema = z.object({
	eventId: z.string()
});

export const EventFormFieldReorderBodySchema = z.object({
	fieldOrders: z.array(
		z.object({
			id: z.string(),
			order: z.number().int().min(0)
		})
	)
});

export const EventFormFieldReorderResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	data: z.null()
});

export const EventFormFieldReorderErrorResponseSchema = z.object({
	success: z.boolean(),
	error: z
		.object({
			code: z.string(),
			message: z.string()
		})
		.optional()
});

export const adminEventFormFieldSchemas = {
	reorderEventFormFields: {
		description: "重新排序活動表單欄位",
		tags: ["admin/events"],
		params: EventFormFieldReorderParamsSchema,
		body: EventFormFieldReorderBodySchema,
		response: {
			200: EventFormFieldReorderResponseSchema,
			400: EventFormFieldReorderErrorResponseSchema
		}
	}
} as const;

// ----------------------------------------------------------------------------
// Admin Event Dashboard Schemas
// ----------------------------------------------------------------------------

export const EventDashboardParamsSchema = z.object({
	eventId: z.string()
});

export const EventDashboardResponseSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
	data: z
		.object({
			event: z.object({
				id: z.string(),
				name: LocalizedTextSchema,
				startDate: z.date(),
				endDate: z.date(),
				locationText: LocalizedTextSchema.nullable(),
				mapLink: z.string().nullable().optional()
			}),
			stats: z.object({
				totalRegistrations: z.number().int(),
				confirmedRegistrations: z.number().int(),
				pendingRegistrations: z.number().int(),
				cancelledRegistrations: z.number().int(),
				totalRevenue: z.number()
			}),
			tickets: z.array(
				z.object({
					id: z.string(),
					name: z.record(z.string(), z.unknown()),
					price: z.number().int(),
					quantity: z.number().int(),
					soldCount: z.number().int(),
					revenue: z.number(),
					available: z.number().int(),
					salesRate: z.number()
				})
			),
			registrationTrends: z.array(
				z.object({
					date: z.string(),
					count: z.number().int(),
					confirmed: z.number().int()
				})
			),
			referralStats: z.object({
				totalReferrals: z.number().int(),
				activeReferrers: z.number().int(),
				conversionRate: z.number()
			})
		})
		.optional()
});

export const eventDashboardSchemas = {
	getEventDashboard: {
		description: "取得活動專屬儀表板數據",
		tags: ["admin/analytics"],
		params: EventDashboardParamsSchema,
		response: {
			200: EventDashboardResponseSchema
		}
	}
} as const;

// ----------------------------------------------------------------------------
// Admin Email Campaign Additional Schemas
// ----------------------------------------------------------------------------

export const EmailCampaignListQuerySchema = z.object({
	status: z.enum(["draft", "sent", "scheduled"]).optional(),
	eventId: z.string().optional(),
	page: z.coerce.number().int().min(1).default(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).default(20).optional()
});

export const CampaignIdParamSchema = z.object({
	campaignId: z.string()
});

export const EmailCampaignSendBodySchema2 = z.object({
	sendNow: z.boolean().default(true).optional()
});

export const adminEmailCampaignSchemas = {
	listEmailCampaigns: {
		...emailCampaignSchemas.listEmailCampaigns,
		description: "獲取郵件發送記錄",
		querystring: EmailCampaignListQuerySchema
	},
	getEmailCampaignStatus: {
		description: "獲取郵件發送狀態",
		tags: ["admin/email-campaigns"],
		params: CampaignIdParamSchema
	},
	previewEmailCampaign: {
		description: "預覽郵件內容",
		tags: ["admin/email-campaigns"],
		params: CampaignIdParamSchema
	},
	calculateRecipients: {
		description: "計算收件人數量",
		tags: ["admin/email-campaigns"],
		params: CampaignIdParamSchema
	},
	sendEmailCampaign: {
		description: "發送郵件",
		tags: ["admin/email-campaigns"],
		params: CampaignIdParamSchema,
		body: EmailCampaignSendBodySchema2
	},
	cancelEmailCampaign: {
		description: "取消郵件發送任務",
		tags: ["admin/email-campaigns"],
		params: CampaignIdParamSchema
	}
} as const;

// ----------------------------------------------------------------------------
// Admin SMS Verification Logs Schemas
// ----------------------------------------------------------------------------

export const SmsVerificationLogsQuerySchema = z.object({
	userId: z.string().optional(),
	phoneNumber: z.string().optional(),
	verified: z.coerce.boolean().optional(),
	page: z.coerce.number().int().min(1).default(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).default(20).optional()
});

export const smsVerificationLogsSchemas = {
	getSmsVerificationLogs: {
		description: "取得簡訊驗證記錄",
		tags: ["admin/sms-verification"],
		querystring: SmsVerificationLogsQuerySchema
	},
	getSmsVerificationStats: {
		description: "取得簡訊驗證統計",
		tags: ["admin/sms-verification"]
	}
} as const;

// ----------------------------------------------------------------------------
// Public Referral Schemas
// ----------------------------------------------------------------------------

export const RegIdParamSchema = z.object({
	regId: z.string()
});

export const ReferralLinkResponseSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
	data: z.object({
		id: z.string(),
		referralLink: z.string(),
		referralCode: z.string(),
		eventId: z.string()
	})
});

export const publicReferralSchemas = {
	getReferralLink: {
		description: "獲取專屬推薦連結",
		tags: ["referrals"],
		params: RegIdParamSchema,
		response: {
			200: ReferralLinkResponseSchema
		}
	},
	getReferralStats: {
		description: "獲取個人推薦統計",
		tags: ["referrals"],
		params: RegIdParamSchema,
		response: referralStatsResponse
	}
} as const;

// ----------------------------------------------------------------------------
// Public Invitation Code Schemas
// ----------------------------------------------------------------------------

export const InvitationCodeParamSchema = z.object({
	code: z.string()
});

export const InvitationCodeTicketIdQuerySchema = z.object({
	ticketId: z.string()
});

export const publicInvitationCodeSchemas = {
	verifyInvitationCode: {
		...invitationCodeSchemas.validateInvitationCode,
		description: "驗證邀請碼並返回可用票種",
		tags: ["invitation-codes"],
		response: invitationCodeVerifyResponse
	},
	getInvitationCodeInfo: {
		description: "獲取邀請碼資訊",
		tags: ["invitation-codes"],
		params: InvitationCodeParamSchema,
		querystring: InvitationCodeTicketIdQuerySchema
	}
} as const;

// ----------------------------------------------------------------------------
// Admin Invitation Code Bulk Schemas
// ----------------------------------------------------------------------------

export const InvitationCodeBulkCreateBodySchema = z.object({
	ticketId: z.string(),
	name: z.string().min(1),
	count: z.number().int().min(1).max(100),
	usageLimit: z.number().int().min(1).optional(),
	validFrom: z.date().optional(),
	validUntil: z.date().optional()
});

export const InvitationCodeSendEmailBodySchema = z.object({
	email: z.email(),
	code: z.string(),
	message: z.string().default("").optional()
});

export const adminInvitationCodeSchemas = {
	bulkCreateInvitationCodes: {
		description: "批量創建邀請碼",
		tags: ["admin/invitation-codes"],
		body: InvitationCodeBulkCreateBodySchema,
		response: {
			201: z.object({
				success: z.literal(true),
				message: z.string(),
				data: z.object({
					count: z.number(),
					codes: z.array(z.string())
				})
			}),
			404: ErrorResponseSchema,
			500: ErrorResponseSchema
		}
	},
	sendInvitationCodeEmail: {
		description: "透過 Email 寄送邀請碼",
		tags: ["admin/invitation-codes"],
		body: InvitationCodeSendEmailBodySchema,
		response: {
			200: SuccessResponseSchema,
			404: ErrorResponseSchema,
			500: ErrorResponseSchema
		}
	}
} as const;

// ----------------------------------------------------------------------------
// Public Auth Schemas
// ----------------------------------------------------------------------------

export const AuthPermissionsResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	data: z.object({
		role: z.string(),
		permissions: z.array(z.string()),
		capabilities: z.object({
			canManageUsers: z.boolean(),
			canManageAllEvents: z.boolean(),
			canViewAnalytics: z.boolean(),
			canManageEmailCampaigns: z.boolean(),
			canManageReferrals: z.boolean(),
			canManageSmsLogs: z.boolean(),
			managedEventIds: z.array(z.string())
		})
	})
});

export const publicAuthSchemas = {
	getAuthPermissions: {
		description: "取得當前用戶的權限資訊",
		tags: ["auth"],
		response: {
			200: AuthPermissionsResponseSchema
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
