/**
 * Unified types and schemas for SITCON tickets system
 * This package provides Zod schemas and TypeScript types for both frontend and backend
 */
import { z } from "zod/v4";
// ============================================================================
// COMMON TYPES
// ============================================================================
/**
 * Localized text for multi-language support
 * e.g., { "en": "SITCON 2026", "zh-Hant": "學生計算機年會 2026" }
 */
export const LocalizedTextSchema = z.record(z.string(), z.string());
/**
 * Sort order for queries
 */
export const SortOrderSchema = z.enum(["asc", "desc"]);
/**
 * User roles in the system
 */
export const UserRoleSchema = z.enum(["admin", "viewer", "eventAdmin"]);
/**
 * Registration status
 */
export const RegistrationStatusSchema = z.enum(["pending", "confirmed", "cancelled"]);
/**
 * Email campaign status
 */
export const EmailCampaignStatusSchema = z.enum(["draft", "sent", "scheduled", "sending", "cancelled"]);
/**
 * Form field types
 */
export const FormFieldTypeSchema = z.enum(["text", "textarea", "select", "checkbox", "radio"]);
/**
 * Supported locales for SMS
 */
export const LocaleSchema = z.enum(["zh-Hant", "zh-Hans", "en"]);
// ============================================================================
// API RESPONSE TYPES
// ============================================================================
/**
 * Standard API response wrapper
 */
export const ApiResponseSchema = (dataSchema) => z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema,
});
/**
 * API error response
 */
export const ApiErrorSchema = z.object({
    success: z.literal(false),
    error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
    }),
});
/**
 * Pagination metadata
 */
export const PaginationSchema = z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
});
/**
 * Paginated response wrapper
 */
export const PaginatedResponseSchema = (dataSchema) => z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(dataSchema),
    pagination: PaginationSchema.optional(),
});
/**
 * Pagination query parameters
 */
export const PaginationQuerySchema = z.object({
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(100).optional().default(10),
});
/**
 * Search query parameters
 */
export const SearchQuerySchema = z.object({
    q: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: SortOrderSchema.optional(),
    filters: z.record(z.string(), z.unknown()).optional(),
});
// ============================================================================
// USER TYPES
// ============================================================================
/**
 * SMS verification record
 */
export const SmsVerificationSchema = z.object({
    id: z.string(),
    phoneNumber: z.string(),
    verified: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
/**
 * User entity
 */
export const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    emailVerified: z.boolean(),
    image: z.string().nullable().optional(),
    role: UserRoleSchema,
    permissions: z.array(z.string()),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    smsVerifications: z.array(SmsVerificationSchema).optional(),
});
/**
 * Session user (simplified for session context)
 */
export const SessionUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: UserRoleSchema,
    permissions: z.array(z.string()),
    isActive: z.boolean(),
});
/**
 * User capabilities based on role and permissions
 */
export const UserCapabilitiesSchema = z.object({
    canManageUsers: z.boolean(),
    canManageAllEvents: z.boolean(),
    canViewAnalytics: z.boolean(),
    canManageEmailCampaigns: z.boolean(),
    canManageReferrals: z.boolean(),
    canManageSmsLogs: z.boolean(),
    managedEventIds: z.array(z.string()),
});
/**
 * Permissions response
 */
export const PermissionsResponseSchema = z.object({
    role: UserRoleSchema,
    permissions: z.array(z.string()),
    capabilities: UserCapabilitiesSchema,
});
// ============================================================================
// AUTH TYPES
// ============================================================================
/**
 * Auth context
 */
export const AuthContextSchema = z.object({
    user: SessionUserSchema.nullable(),
    sessionId: z.string().nullable(),
    isAuthenticated: z.boolean(),
});
/**
 * Login request
 */
export const LoginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
/**
 * Register request
 */
export const RegisterRequestSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
});
/**
 * Magic link request
 */
export const MagicLinkRequestSchema = z.object({
    email: z.string().email(),
});
/**
 * Reset password request
 */
export const ResetPasswordRequestSchema = z.object({
    email: z.string().email(),
});
/**
 * Change password request
 */
export const ChangePasswordRequestSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6),
});
/**
 * User update request (self-service)
 */
export const UserUpdateRequestSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    image: z.string().optional(),
});
/**
 * Admin user update request
 */
export const AdminUserUpdateRequestSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: UserRoleSchema.optional(),
    permissions: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});
/**
 * Session response
 */
export const SessionSchema = z.object({
    user: z.object({
        id: z.string(),
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime(),
        email: z.string().email(),
        emailVerified: z.boolean(),
        name: z.string(),
        image: z.string().nullable().optional(),
    }),
    session: z.object({
        id: z.string(),
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime(),
        userId: z.string(),
        expiresAt: z.string().datetime(),
        token: z.string(),
        ipAddress: z.string().nullable().optional(),
        userAgent: z.string().nullable().optional(),
    }),
});
// ============================================================================
// EVENT TYPES
// ============================================================================
/**
 * Event entity
 */
export const EventSchema = z.object({
    id: z.string(),
    slug: z.string().nullable().optional(),
    name: LocalizedTextSchema,
    description: LocalizedTextSchema.nullable().optional(),
    plainDescription: LocalizedTextSchema.nullable().optional(),
    location: z.string().nullable().optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    ogImage: z.string().nullable().optional(),
    landingPage: z.string().nullable().optional(),
    googleSheetsUrl: z.string().nullable().optional(),
    isActive: z.boolean(),
    hideEvent: z.boolean().optional(),
    useOpass: z.boolean().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
/**
 * Event list item (with aggregated data)
 */
export const EventListItemSchema = EventSchema.extend({
    ticketCount: z.number().int().min(0),
    registrationCount: z.number().int().min(0),
    hasAvailableTickets: z.boolean(),
});
/**
 * Event create request
 */
export const EventCreateRequestSchema = z.object({
    slug: z.string().optional(),
    name: LocalizedTextSchema,
    description: LocalizedTextSchema.optional(),
    plainDescription: LocalizedTextSchema.optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    location: z.string().optional(),
    ogImage: z.string().optional(),
});
/**
 * Event update request
 */
export const EventUpdateRequestSchema = z.object({
    slug: z.string().optional(),
    name: LocalizedTextSchema.optional(),
    description: LocalizedTextSchema.optional(),
    plainDescription: LocalizedTextSchema.optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    location: z.string().optional(),
    ogImage: z.string().optional(),
    isActive: z.boolean().optional(),
    hideEvent: z.boolean().optional(),
    useOpass: z.boolean().optional(),
});
/**
 * Event statistics
 */
export const EventStatsSchema = z.object({
    eventName: LocalizedTextSchema,
    totalRegistrations: z.number().int().min(0),
    confirmedRegistrations: z.number().int().min(0),
    totalTickets: z.number().int().min(0),
    availableTickets: z.number().int().min(0),
    registrationRate: z.number().min(0).max(100),
});
// ============================================================================
// TICKET TYPES
// ============================================================================
/**
 * Ticket entity
 */
export const TicketSchema = z.object({
    id: z.string(),
    eventId: z.string(),
    order: z.number().int().min(0).optional(),
    name: LocalizedTextSchema,
    description: LocalizedTextSchema.nullable().optional(),
    plainDescription: LocalizedTextSchema.nullable().optional(),
    price: z.number().min(0),
    quantity: z.number().int().min(0),
    soldCount: z.number().int().min(0),
    available: z.number().int().min(0).optional(),
    saleStart: z.string().datetime().nullable().optional(),
    saleEnd: z.string().datetime().nullable().optional(),
    isOnSale: z.boolean().optional(),
    isSoldOut: z.boolean().optional(),
    isActive: z.boolean().optional(),
    hidden: z.boolean().optional(),
    requireInviteCode: z.boolean().optional(),
    requireSmsVerification: z.boolean().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
});
/**
 * Ticket create request
 */
export const TicketCreateRequestSchema = z.object({
    eventId: z.string(),
    order: z.number().int().min(0).optional(),
    name: LocalizedTextSchema,
    description: LocalizedTextSchema.optional(),
    plainDescription: LocalizedTextSchema.optional(),
    price: z.number().min(0),
    quantity: z.number().int().min(1),
    saleStart: z.string().datetime().optional(),
    saleEnd: z.string().datetime().optional(),
    requireInviteCode: z.boolean().optional(),
    requireSmsVerification: z.boolean().optional(),
    hidden: z.boolean().optional(),
});
/**
 * Ticket update request
 */
export const TicketUpdateRequestSchema = z.object({
    order: z.number().int().min(0).optional(),
    name: LocalizedTextSchema.optional(),
    description: LocalizedTextSchema.optional(),
    plainDescription: LocalizedTextSchema.optional(),
    price: z.number().min(0).optional(),
    quantity: z.number().int().min(0).optional(),
    saleStart: z.string().datetime().optional(),
    saleEnd: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
    requireInviteCode: z.boolean().optional(),
    requireSmsVerification: z.boolean().optional(),
    hidden: z.boolean().optional(),
});
/**
 * Ticket reorder request
 */
export const TicketReorderRequestSchema = z.object({
    tickets: z.array(z.object({
        id: z.string(),
        order: z.number().int().min(0),
    })),
});
/**
 * Ticket analytics
 */
export const TicketAnalyticsSchema = z.object({
    totalSoldCount: z.number().int().min(0),
    totalRevenue: z.number().min(0),
    availableQuantity: z.number().int().min(0),
    salesByStatus: z.record(z.string(), z.number().int().min(0)),
    dailySales: z.array(z.object({
        date: z.string(),
        count: z.number().int().min(0),
        revenue: z.number().min(0),
    })),
});
// ============================================================================
// FORM FIELD TYPES
// ============================================================================
/**
 * Filter condition for form fields
 */
export const FilterConditionSchema = z.object({
    type: z.enum(["ticket", "field", "time"]),
    ticketId: z.string().optional(),
    fieldId: z.string().optional(),
    operator: z.enum(["equals", "filled", "notFilled"]).optional(),
    value: z.string().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
});
/**
 * Field filter configuration
 */
export const FieldFilterSchema = z.object({
    enabled: z.boolean(),
    action: z.enum(["display", "hide"]),
    operator: z.enum(["and", "or"]),
    conditions: z.array(FilterConditionSchema),
});
/**
 * Event form field entity
 */
export const EventFormFieldSchema = z.object({
    id: z.string(),
    eventId: z.string(),
    order: z.number().int().min(0),
    type: FormFieldTypeSchema,
    validater: z.string().nullable().optional(),
    name: LocalizedTextSchema,
    description: LocalizedTextSchema.nullable().optional(),
    placeholder: z.string().nullable().optional(),
    required: z.boolean(),
    values: z.array(LocalizedTextSchema).nullable().optional(),
    options: z.array(LocalizedTextSchema).nullable().optional(), // Parsed options for frontend use
    filters: FieldFilterSchema.nullable().optional(),
    prompts: z.record(z.string(), z.array(z.string())).nullable().optional(),
    enableOther: z.boolean().nullable().optional(),
});
/**
 * Event form field create request
 */
export const EventFormFieldCreateRequestSchema = z.object({
    eventId: z.string(),
    order: z.number().int().min(0),
    type: FormFieldTypeSchema,
    validater: z.string().optional(),
    name: LocalizedTextSchema,
    description: LocalizedTextSchema.optional(),
    placeholder: z.string().optional(),
    required: z.boolean().optional().default(false),
    values: z.array(LocalizedTextSchema).optional(),
    filters: FieldFilterSchema.optional(),
    prompts: z.record(z.string(), z.array(z.string())).optional(),
    enableOther: z.boolean().optional(),
});
/**
 * Event form field update request
 */
export const EventFormFieldUpdateRequestSchema = z.object({
    order: z.number().int().min(0).optional(),
    type: FormFieldTypeSchema.optional(),
    validater: z.string().optional(),
    name: LocalizedTextSchema.optional(),
    description: LocalizedTextSchema.optional(),
    placeholder: z.string().optional(),
    required: z.boolean().optional(),
    values: z.array(LocalizedTextSchema).optional(),
    filters: FieldFilterSchema.optional(),
    prompts: z.record(z.string(), z.array(z.string())).optional(),
    enableOther: z.boolean().optional(),
});
/**
 * Event form field reorder request
 */
export const EventFormFieldReorderRequestSchema = z.object({
    fieldOrders: z.array(z.object({
        id: z.string(),
        order: z.number().int().min(0),
    })),
});
// ============================================================================
// REGISTRATION TYPES
// ============================================================================
/**
 * Registration entity
 */
export const RegistrationSchema = z.object({
    id: z.string(),
    eventId: z.string(),
    ticketId: z.string(),
    email: z.string().email(),
    status: RegistrationStatusSchema,
    referredBy: z.string().nullable().optional(),
    formData: z.record(z.string(), z.unknown()),
    tags: z.array(z.string()).nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    event: z
        .object({
        id: z.string(),
        name: LocalizedTextSchema,
        description: LocalizedTextSchema.nullable().optional(),
        plainDescription: LocalizedTextSchema.nullable().optional(),
        location: z.string().nullable().optional(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        slug: z.string().nullable().optional(),
    })
        .optional(),
    ticket: z
        .object({
        id: z.string(),
        name: LocalizedTextSchema,
        description: LocalizedTextSchema.nullable().optional(),
        plainDescription: LocalizedTextSchema.nullable().optional(),
        price: z.number().min(0),
    })
        .optional(),
    isUpcoming: z.boolean().optional(),
    isPast: z.boolean().optional(),
    canEdit: z.boolean().optional(),
    canCancel: z.boolean().optional(),
});
/**
 * Registration create request
 */
export const RegistrationCreateRequestSchema = z.object({
    eventId: z.string(),
    ticketId: z.string(),
    invitationCode: z.string().optional(),
    referralCode: z.string().optional(),
    formData: z.record(z.string(), z.unknown()),
});
/**
 * Registration update request
 */
export const RegistrationUpdateRequestSchema = z.object({
    formData: z.record(z.string(), z.unknown()).optional(),
    status: RegistrationStatusSchema.optional(),
    tags: z.array(z.string()).optional(),
});
/**
 * Registration statistics
 */
export const RegistrationStatsSchema = z.object({
    totalReferrals: z.number().int().min(0),
    successfulReferrals: z.number().int().min(0),
    referralList: z.array(z.object({
        id: z.string(),
        status: z.string(),
        ticketName: LocalizedTextSchema,
        registeredAt: z.string().datetime(),
        email: z.string().email(),
    })),
    referrerInfo: z.object({
        id: z.string(),
        email: z.string().email(),
    }),
});
// ============================================================================
// REFERRAL TYPES
// ============================================================================
/**
 * Referral entity
 */
export const ReferralSchema = z.object({
    id: z.string(),
    eventId: z.string(),
    userId: z.string(),
    code: z.string(),
    description: z.string().nullable().optional(),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
/**
 * Referral link response
 */
export const ReferralLinkSchema = z.object({
    id: z.string(),
    referralLink: z.string().url(),
    referralCode: z.string(),
    eventId: z.string(),
});
/**
 * Referral validation request
 */
export const ReferralValidateRequestSchema = z.object({
    code: z.string().min(1),
    eventId: z.string(),
});
/**
 * Referral validation response
 */
export const ReferralValidationSchema = z.object({
    isValid: z.boolean(),
    code: z.string(),
    referralId: z.string(),
});
/**
 * Referral usage entity
 */
export const ReferralUsageSchema = z.object({
    id: z.string(),
    referralId: z.string(),
    eventId: z.string(),
    userId: z.string(),
    usedAt: z.string().datetime(),
});
/**
 * Referral overview
 */
export const ReferralOverviewSchema = z.object({
    totalReferrals: z.number().int().min(0),
    successfulReferrals: z.number().int().min(0),
    conversionRate: z.number().min(0).max(100),
    topReferrers: z.array(z.object({
        id: z.string(),
        email: z.string().email(),
        referralCount: z.number().int().min(0),
    })),
});
/**
 * Referral leaderboard
 */
export const ReferralLeaderboardSchema = z.object({
    ranking: z.array(z.object({
        rank: z.number().int().min(1),
        registrationId: z.string(),
        email: z.string().email(),
        referralCount: z.number().int().min(0),
        successfulReferrals: z.number().int().min(0),
    })),
});
/**
 * Referral tree
 */
export const ReferralTreeSchema = z.object({
    root: z.object({
        id: z.string(),
        email: z.string().email(),
        status: z.string(),
    }),
    children: z.array(z.object({
        id: z.string(),
        email: z.string().email(),
        status: z.string(),
        registeredAt: z.string().datetime(),
        children: z.array(z.unknown()).optional(),
    })),
});
/**
 * Qualified referrer
 */
export const QualifiedReferrerSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    referralCount: z.number().int().min(0),
    isQualified: z.boolean(),
    qualificationThreshold: z.number().int().min(0),
});
/**
 * Draw result
 */
export const DrawResultSchema = z.object({
    winners: z.array(z.object({
        id: z.string(),
        email: z.string().email(),
        referralCount: z.number().int().min(0),
    })),
    drawDate: z.string().datetime(),
    totalParticipants: z.number().int().min(0),
});
// ============================================================================
// INVITATION CODE TYPES
// ============================================================================
/**
 * Invitation code entity
 */
export const InvitationCodeSchema = z.object({
    id: z.string(),
    ticketId: z.string(),
    code: z.string(),
    name: z.string().nullable().optional(),
    usageLimit: z.number().int().min(1).nullable().optional(),
    usedCount: z.number().int().min(0),
    validFrom: z.string().datetime().nullable().optional(),
    validUntil: z.string().datetime().nullable().optional(),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
/**
 * Invitation code with extra info
 */
export const InvitationCodeInfoSchema = InvitationCodeSchema.extend({
    description: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
});
/**
 * Invitation code create request
 */
export const InvitationCodeCreateRequestSchema = z.object({
    ticketId: z.string(),
    code: z.string().min(1),
    name: z.string().optional(),
    usageLimit: z.number().int().min(1).optional(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
});
/**
 * Invitation code update request
 */
export const InvitationCodeUpdateRequestSchema = z.object({
    code: z.string().min(1).optional(),
    name: z.string().optional(),
    usageLimit: z.number().int().min(1).optional(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
    ticketId: z.string().optional(),
});
/**
 * Invitation code verify request
 */
export const InvitationCodeVerifyRequestSchema = z.object({
    code: z.string().min(1),
    ticketId: z.string(),
});
/**
 * Invitation code verification response
 */
export const InvitationCodeVerificationSchema = z.object({
    valid: z.boolean(),
    invitationCode: z.object({
        id: z.string(),
        code: z.string(),
        description: z.string().optional(),
        usedCount: z.number().int().min(0),
        usageLimit: z.number().int().min(1).optional(),
        expiresAt: z.string().datetime().optional(),
    }),
    availableTickets: z.array(z.object({
        id: z.string(),
        name: LocalizedTextSchema,
        description: LocalizedTextSchema.nullable().optional(),
        plainDescription: LocalizedTextSchema.nullable().optional(),
        price: z.number().min(0),
        quantity: z.number().int().min(0),
        soldCount: z.number().int().min(0),
        available: z.number().int().min(0),
        isOnSale: z.boolean(),
    })),
});
// ============================================================================
// EMAIL CAMPAIGN TYPES
// ============================================================================
/**
 * Target audience filters
 */
export const TargetAudienceSchema = z.object({
    roles: z.array(z.string()).optional(),
    eventIds: z.array(z.string()).optional(),
    ticketIds: z.array(z.string()).optional(),
    registrationStatuses: z.array(z.string()).optional(),
    hasReferrals: z.boolean().optional(),
    isReferrer: z.boolean().optional(),
    registeredAfter: z.string().datetime().optional(),
    registeredBefore: z.string().datetime().optional(),
    tags: z.array(z.string()).optional(),
    emailDomains: z.array(z.string()).optional(),
});
/**
 * Email campaign entity
 */
export const EmailCampaignSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    subject: z.string(),
    content: z.string(),
    eventId: z.string().nullable().optional(),
    recipientFilter: z.string().nullable().optional(),
    targetAudience: TargetAudienceSchema.nullable().optional(),
    status: EmailCampaignStatusSchema,
    sentCount: z.number().int().min(0),
    totalCount: z.number().int().min(0),
    scheduledAt: z.string().datetime().nullable().optional(),
    sentAt: z.string().datetime().nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    user: z
        .object({
        name: z.string(),
        email: z.string().email(),
    })
        .optional(),
});
/**
 * Email campaign create request
 */
export const EmailCampaignCreateRequestSchema = z.object({
    name: z.string().min(1),
    subject: z.string().min(1),
    content: z.string().min(1),
    eventId: z.string().optional(),
    targetAudience: TargetAudienceSchema.optional(),
    scheduledAt: z.string().datetime().optional(),
});
/**
 * Email campaign update request
 */
export const EmailCampaignUpdateRequestSchema = z.object({
    name: z.string().min(1).optional(),
    subject: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    eventId: z.string().optional(),
    targetAudience: TargetAudienceSchema.optional(),
    scheduledAt: z.string().datetime().optional(),
});
/**
 * Email campaign send request
 */
export const EmailCampaignSendRequestSchema = z.object({
    sendNow: z.boolean().optional().default(false),
    scheduledAt: z.string().datetime().optional(),
});
/**
 * Email campaign status response
 */
export const EmailCampaignStatusResponseSchema = z.object({
    id: z.string(),
    status: z.enum(["draft", "sent", "scheduled", "sending", "failed"]),
    totalRecipients: z.number().int().min(0),
    sentCount: z.number().int().min(0),
    failedCount: z.number().int().min(0),
    openCount: z.number().int().min(0).optional(),
    clickCount: z.number().int().min(0).optional(),
});
/**
 * Campaign result
 */
export const CampaignResultSchema = z.object({
    success: z.boolean(),
    sentCount: z.number().int().min(0),
    failedCount: z.number().int().min(0),
    totalRecipients: z.number().int().min(0),
});
/**
 * Email sender
 */
export const EmailSenderSchema = z.object({
    email: z.string().email(),
    name: z.string(),
});
/**
 * Email recipient
 */
export const EmailRecipientSchema = z.object({
    email: z.string().email(),
});
/**
 * Recipient data
 */
export const RecipientDataSchema = z.object({
    email: z.string().email(),
    id: z.string(),
    formData: z.string().nullable().optional(),
    event: EventSchema.partial().optional(),
    ticket: TicketSchema.partial().optional(),
});
// ============================================================================
// SMS VERIFICATION TYPES
// ============================================================================
/**
 * Send verification request
 */
export const SendVerificationRequestSchema = z.object({
    phoneNumber: z.string().regex(/^09\d{8}$/, "Invalid Taiwan phone number"),
    locale: LocaleSchema.optional(),
    turnstileToken: z.string(),
});
/**
 * Verify code request
 */
export const VerifyCodeRequestSchema = z.object({
    phoneNumber: z.string().regex(/^09\d{8}$/, "Invalid Taiwan phone number"),
    code: z.string().regex(/^\d{6}$/, "Invalid verification code"),
});
/**
 * TwSMS API response
 */
export const TwSMSResponseSchema = z.object({
    code: z.string(),
    text: z.string(),
    msgid: z.string().optional(),
});
/**
 * TwSMS status response
 */
export const TwSMSStatusResponseSchema = z.object({
    code: z.string(),
    text: z.string(),
    statuscode: z.string().optional(),
    statustext: z.string().optional(),
    donetime: z.string().optional(),
});
/**
 * SMS send result
 */
export const SMSSendResultSchema = z.object({
    success: z.boolean(),
    msgid: z.string(),
    code: z.string(),
    text: z.string(),
});
// ============================================================================
// TURNSTILE TYPES
// ============================================================================
/**
 * Cloudflare Turnstile response
 */
export const TurnstileResponseSchema = z.object({
    success: z.boolean(),
    challenge_ts: z.string().optional(),
    hostname: z.string().optional(),
    "error-codes": z.array(z.string()).optional(),
    action: z.string().optional(),
    cdata: z.string().optional(),
    metadata: z
        .object({
        ephemeral_id: z.string().optional(),
    })
        .optional(),
});
/**
 * Turnstile validation options
 */
export const TurnstileValidationOptionsSchema = z.object({
    remoteip: z.string().optional(),
    idempotencyKey: z.string().optional(),
    expectedAction: z.string().optional(),
    expectedHostname: z.string().optional(),
});
/**
 * Turnstile validation result
 */
export const TurnstileValidationResultSchema = z.object({
    valid: z.boolean(),
    reason: z.string().optional(),
    errors: z.array(z.string()).optional(),
    expected: z.string().optional(),
    received: z.string().optional(),
    data: TurnstileResponseSchema.optional(),
    tokenAge: z.number().optional(),
});
// ============================================================================
// ANALYTICS TYPES
// ============================================================================
/**
 * Analytics data
 */
export const AnalyticsDataSchema = z.object({
    totalRegistrations: z.number().int().min(0),
    confirmedRegistrations: z.number().int().min(0),
    pendingRegistrations: z.number().int().min(0),
    cancelledRegistrations: z.number().int().min(0),
    checkedInCount: z.number().int().min(0),
    registrationsByDate: z.record(z.string(), z.unknown()),
    ticketSales: z.record(z.string(), z.unknown()),
    referralStats: z.record(z.string(), z.unknown()),
});
/**
 * Event dashboard data
 */
export const EventDashboardDataSchema = z.object({
    event: z.object({
        id: z.string(),
        name: LocalizedTextSchema,
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        location: z.string().nullable(),
    }),
    stats: z.object({
        totalRegistrations: z.number().int().min(0),
        confirmedRegistrations: z.number().int().min(0),
        pendingRegistrations: z.number().int().min(0),
        cancelledRegistrations: z.number().int().min(0),
        totalRevenue: z.number().min(0),
    }),
    tickets: z.array(z.object({
        id: z.string(),
        name: LocalizedTextSchema,
        price: z.number().min(0),
        quantity: z.number().int().min(0),
        soldCount: z.number().int().min(0),
        revenue: z.number().min(0),
        available: z.number().int().min(0),
        salesRate: z.number().min(0).max(100),
    })),
    registrationTrends: z.array(z.object({
        date: z.string(),
        count: z.number().int().min(0),
        confirmed: z.number().int().min(0),
    })),
    referralStats: z.object({
        totalReferrals: z.number().int().min(0),
        activeReferrers: z.number().int().min(0),
        conversionRate: z.number().min(0).max(100),
    }),
});
// ============================================================================
// VALIDATION TYPES
// ============================================================================
/**
 * Validation error
 */
export const ValidationErrorSchema = z.object({
    statusCode: z.number().int(),
    code: z.string(),
    error: z.string(),
    message: z.string(),
    validation: z
        .array(z.object({
        field: z.string(),
        message: z.string(),
    }))
        .optional(),
    validationContext: z.string().optional(),
});
/**
 * Form validation rules
 */
export const FormValidationRulesSchema = z.object({
    required: z.boolean().optional(),
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(0).optional(),
    pattern: z.union([z.instanceof(RegExp), z.string()]).optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    options: z.array(z.string()).optional(),
    customMessage: z.string().optional(),
});
/**
 * Field validation error
 */
export const FieldValidationErrorSchema = z.object({
    field: z.string(),
    messages: z.array(z.string()),
});
/**
 * Validation result
 */
export const ValidationResultSchema = z.object({
    isValid: z.boolean(),
    errors: z.record(z.string(), z.array(z.string())),
});
// ============================================================================
// EXPORT DATA TYPES
// ============================================================================
/**
 * Export data response
 */
export const ExportDataSchema = z.object({
    downloadUrl: z.string().url(),
    filename: z.string(),
    count: z.number().int().min(0),
});
// ============================================================================
// SYSTEM TYPES
// ============================================================================
/**
 * Health status
 */
export const HealthStatusSchema = z.object({
    status: z.enum(["ok", "error"]),
    timestamp: z.string().datetime(),
    version: z.string().optional(),
});
/**
 * Redis client config
 */
export const RedisClientConfigSchema = z.object({
    host: z.string(),
    port: z.number().int().min(1).max(65535),
    password: z.string().optional(),
    username: z.string().optional(),
    db: z.number().int().min(0).optional(),
});
