/**
 * Unified types and schemas for SITCON tickets system
 * This package provides Zod schemas and TypeScript types for both frontend and backend
 */
import { z } from "zod/v4";
/**
 * Localized text for multi-language support
 * e.g., { "en": "SITCON 2026", "zh-Hant": "學生計算機年會 2026" }
 */
export declare const LocalizedTextSchema: z.ZodRecord<z.ZodString, z.ZodString>;
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;
/**
 * Sort order for queries
 */
export declare const SortOrderSchema: z.ZodEnum<{
    asc: "asc";
    desc: "desc";
}>;
export type SortOrder = z.infer<typeof SortOrderSchema>;
/**
 * User roles in the system
 */
export declare const UserRoleSchema: z.ZodEnum<{
    admin: "admin";
    viewer: "viewer";
    eventAdmin: "eventAdmin";
}>;
export type UserRole = z.infer<typeof UserRoleSchema>;
/**
 * Registration status
 */
export declare const RegistrationStatusSchema: z.ZodEnum<{
    pending: "pending";
    confirmed: "confirmed";
    cancelled: "cancelled";
}>;
export type RegistrationStatus = z.infer<typeof RegistrationStatusSchema>;
/**
 * Email campaign status
 */
export declare const EmailCampaignStatusSchema: z.ZodEnum<{
    cancelled: "cancelled";
    draft: "draft";
    sent: "sent";
    scheduled: "scheduled";
    sending: "sending";
}>;
export type EmailCampaignStatus = z.infer<typeof EmailCampaignStatusSchema>;
/**
 * Form field types
 */
export declare const FormFieldTypeSchema: z.ZodEnum<{
    text: "text";
    textarea: "textarea";
    select: "select";
    checkbox: "checkbox";
    radio: "radio";
}>;
export type FormFieldType = z.infer<typeof FormFieldTypeSchema>;
/**
 * Supported locales for SMS
 */
export declare const LocaleSchema: z.ZodEnum<{
    "zh-Hant": "zh-Hant";
    "zh-Hans": "zh-Hans";
    en: "en";
}>;
export type Locale = z.infer<typeof LocaleSchema>;
/**
 * Standard API response wrapper
 */
export declare const ApiResponseSchema: <T extends z.ZodType>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    data: T;
}, z.core.$strip>;
/**
 * Generic API response type
 */
export type ApiResponse<T> = {
    success: boolean;
    message: string;
    data: T;
    pagination?: Pagination | null;
};
/**
 * API error response
 */
export declare const ApiErrorSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodUnknown>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
/**
 * Pagination metadata
 */
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    limit: z.ZodNumber;
    total: z.ZodNumber;
    totalPages: z.ZodNumber;
    hasNext: z.ZodBoolean;
    hasPrev: z.ZodBoolean;
}, z.core.$strip>;
export type Pagination = z.infer<typeof PaginationSchema>;
/**
 * Paginated response wrapper
 */
export declare const PaginatedResponseSchema: <T extends z.ZodType>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    data: z.ZodArray<T>;
    pagination: z.ZodOptional<z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Pagination query parameters
 */
export declare const PaginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
/**
 * Search query parameters
 */
export declare const SearchQuerySchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
/**
 * SMS verification record
 */
export declare const SmsVerificationSchema: z.ZodObject<{
    id: z.ZodString;
    phoneNumber: z.ZodString;
    verified: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export type SmsVerification = z.infer<typeof SmsVerificationSchema>;
/**
 * User entity
 */
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    emailVerified: z.ZodBoolean;
    image: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    role: z.ZodEnum<{
        admin: "admin";
        viewer: "viewer";
        eventAdmin: "eventAdmin";
    }>;
    permissions: z.ZodArray<z.ZodString>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    smsVerifications: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        phoneNumber: z.ZodString;
        verified: z.ZodBoolean;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type User = z.infer<typeof UserSchema>;
/**
 * Session user (simplified for session context)
 */
export declare const SessionUserSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<{
        admin: "admin";
        viewer: "viewer";
        eventAdmin: "eventAdmin";
    }>;
    permissions: z.ZodArray<z.ZodString>;
    isActive: z.ZodBoolean;
}, z.core.$strip>;
export type SessionUser = z.infer<typeof SessionUserSchema>;
/**
 * User capabilities based on role and permissions
 */
export declare const UserCapabilitiesSchema: z.ZodObject<{
    canManageUsers: z.ZodBoolean;
    canManageAllEvents: z.ZodBoolean;
    canViewAnalytics: z.ZodBoolean;
    canManageEmailCampaigns: z.ZodBoolean;
    canManageReferrals: z.ZodBoolean;
    canManageSmsLogs: z.ZodBoolean;
    managedEventIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type UserCapabilities = z.infer<typeof UserCapabilitiesSchema>;
/**
 * Permissions response
 */
export declare const PermissionsResponseSchema: z.ZodObject<{
    role: z.ZodEnum<{
        admin: "admin";
        viewer: "viewer";
        eventAdmin: "eventAdmin";
    }>;
    permissions: z.ZodArray<z.ZodString>;
    capabilities: z.ZodObject<{
        canManageUsers: z.ZodBoolean;
        canManageAllEvents: z.ZodBoolean;
        canViewAnalytics: z.ZodBoolean;
        canManageEmailCampaigns: z.ZodBoolean;
        canManageReferrals: z.ZodBoolean;
        canManageSmsLogs: z.ZodBoolean;
        managedEventIds: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type PermissionsResponse = z.infer<typeof PermissionsResponseSchema>;
/**
 * Auth context
 */
export declare const AuthContextSchema: z.ZodObject<{
    user: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        email: z.ZodString;
        role: z.ZodEnum<{
            admin: "admin";
            viewer: "viewer";
            eventAdmin: "eventAdmin";
        }>;
        permissions: z.ZodArray<z.ZodString>;
        isActive: z.ZodBoolean;
    }, z.core.$strip>>;
    sessionId: z.ZodNullable<z.ZodString>;
    isAuthenticated: z.ZodBoolean;
}, z.core.$strip>;
export type AuthContext = z.infer<typeof AuthContextSchema>;
/**
 * Login request
 */
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
/**
 * Register request
 */
export declare const RegisterRequestSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
/**
 * Magic link request
 */
export declare const MagicLinkRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export type MagicLinkRequest = z.infer<typeof MagicLinkRequestSchema>;
/**
 * Reset password request
 */
export declare const ResetPasswordRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
/**
 * Change password request
 */
export declare const ChangePasswordRequestSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
/**
 * User update request (self-service)
 */
export declare const UserUpdateRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;
/**
 * Admin user update request
 */
export declare const AdminUserUpdateRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        admin: "admin";
        viewer: "viewer";
        eventAdmin: "eventAdmin";
    }>>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type AdminUserUpdateRequest = z.infer<typeof AdminUserUpdateRequestSchema>;
/**
 * Session response
 */
export declare const SessionSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        email: z.ZodString;
        emailVerified: z.ZodBoolean;
        name: z.ZodString;
        image: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
    session: z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        userId: z.ZodString;
        expiresAt: z.ZodString;
        token: z.ZodString;
        ipAddress: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        userAgent: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type Session = z.infer<typeof SessionSchema>;
/**
 * Event entity
 */
export declare const EventSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodRecord<z.ZodString, z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
    plainDescription: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
    location: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    ogImage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    landingPage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    googleSheetsUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isActive: z.ZodBoolean;
    hideEvent: z.ZodOptional<z.ZodBoolean>;
    useOpass: z.ZodOptional<z.ZodBoolean>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export type Event = z.infer<typeof EventSchema>;
/**
 * Event list item (with aggregated data)
 */
export declare const EventListItemSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodRecord<z.ZodString, z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
    plainDescription: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
    location: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    ogImage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    landingPage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    googleSheetsUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isActive: z.ZodBoolean;
    hideEvent: z.ZodOptional<z.ZodBoolean>;
    useOpass: z.ZodOptional<z.ZodBoolean>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    ticketCount: z.ZodNumber;
    registrationCount: z.ZodNumber;
    hasAvailableTickets: z.ZodBoolean;
}, z.core.$strip>;
export type EventListItem = z.infer<typeof EventListItemSchema>;
/**
 * Event create request
 */
export declare const EventCreateRequestSchema: z.ZodObject<{
    slug: z.ZodOptional<z.ZodString>;
    name: z.ZodRecord<z.ZodString, z.ZodString>;
    description: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    plainDescription: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    location: z.ZodOptional<z.ZodString>;
    ogImage: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type EventCreateRequest = z.infer<typeof EventCreateRequestSchema>;
/**
 * Event update request
 */
export declare const EventUpdateRequestSchema: z.ZodObject<{
    slug: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    description: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    plainDescription: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    ogImage: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    hideEvent: z.ZodOptional<z.ZodBoolean>;
    useOpass: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type EventUpdateRequest = z.infer<typeof EventUpdateRequestSchema>;
/**
 * Event statistics
 */
export declare const EventStatsSchema: z.ZodObject<{
    eventName: z.ZodRecord<z.ZodString, z.ZodString>;
    totalRegistrations: z.ZodNumber;
    confirmedRegistrations: z.ZodNumber;
    totalTickets: z.ZodNumber;
    availableTickets: z.ZodNumber;
    registrationRate: z.ZodNumber;
}, z.core.$strip>;
export type EventStats = z.infer<typeof EventStatsSchema>;
/**
 * Ticket entity
 */
export declare const TicketSchema: z.ZodObject<{
    id: z.ZodString;
    eventId: z.ZodString;
    order: z.ZodOptional<z.ZodNumber>;
    name: z.ZodRecord<z.ZodString, z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
    plainDescription: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
    price: z.ZodNumber;
    quantity: z.ZodNumber;
    soldCount: z.ZodNumber;
    available: z.ZodOptional<z.ZodNumber>;
    saleStart: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    saleEnd: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isOnSale: z.ZodOptional<z.ZodBoolean>;
    isSoldOut: z.ZodOptional<z.ZodBoolean>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    hidden: z.ZodOptional<z.ZodBoolean>;
    requireInviteCode: z.ZodOptional<z.ZodBoolean>;
    requireSmsVerification: z.ZodOptional<z.ZodBoolean>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Ticket = z.infer<typeof TicketSchema>;
/**
 * Ticket create request
 */
export declare const TicketCreateRequestSchema: z.ZodObject<{
    eventId: z.ZodString;
    order: z.ZodOptional<z.ZodNumber>;
    name: z.ZodRecord<z.ZodString, z.ZodString>;
    description: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    plainDescription: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    price: z.ZodNumber;
    quantity: z.ZodNumber;
    saleStart: z.ZodOptional<z.ZodString>;
    saleEnd: z.ZodOptional<z.ZodString>;
    requireInviteCode: z.ZodOptional<z.ZodBoolean>;
    requireSmsVerification: z.ZodOptional<z.ZodBoolean>;
    hidden: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type TicketCreateRequest = z.infer<typeof TicketCreateRequestSchema>;
/**
 * Ticket update request
 */
export declare const TicketUpdateRequestSchema: z.ZodObject<{
    order: z.ZodOptional<z.ZodNumber>;
    name: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    description: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    plainDescription: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    price: z.ZodOptional<z.ZodNumber>;
    quantity: z.ZodOptional<z.ZodNumber>;
    saleStart: z.ZodOptional<z.ZodString>;
    saleEnd: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    requireInviteCode: z.ZodOptional<z.ZodBoolean>;
    requireSmsVerification: z.ZodOptional<z.ZodBoolean>;
    hidden: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type TicketUpdateRequest = z.infer<typeof TicketUpdateRequestSchema>;
/**
 * Ticket reorder request
 */
export declare const TicketReorderRequestSchema: z.ZodObject<{
    tickets: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type TicketReorderRequest = z.infer<typeof TicketReorderRequestSchema>;
/**
 * Ticket analytics
 */
export declare const TicketAnalyticsSchema: z.ZodObject<{
    totalSoldCount: z.ZodNumber;
    totalRevenue: z.ZodNumber;
    availableQuantity: z.ZodNumber;
    salesByStatus: z.ZodRecord<z.ZodString, z.ZodNumber>;
    dailySales: z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        count: z.ZodNumber;
        revenue: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type TicketAnalytics = z.infer<typeof TicketAnalyticsSchema>;
/**
 * Filter condition for form fields
 */
export declare const FilterConditionSchema: z.ZodObject<{
    type: z.ZodEnum<{
        ticket: "ticket";
        field: "field";
        time: "time";
    }>;
    ticketId: z.ZodOptional<z.ZodString>;
    fieldId: z.ZodOptional<z.ZodString>;
    operator: z.ZodOptional<z.ZodEnum<{
        equals: "equals";
        filled: "filled";
        notFilled: "notFilled";
    }>>;
    value: z.ZodOptional<z.ZodString>;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type FilterCondition = z.infer<typeof FilterConditionSchema>;
/**
 * Field filter configuration
 */
export declare const FieldFilterSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    action: z.ZodEnum<{
        display: "display";
        hide: "hide";
    }>;
    operator: z.ZodEnum<{
        and: "and";
        or: "or";
    }>;
    conditions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            ticket: "ticket";
            field: "field";
            time: "time";
        }>;
        ticketId: z.ZodOptional<z.ZodString>;
        fieldId: z.ZodOptional<z.ZodString>;
        operator: z.ZodOptional<z.ZodEnum<{
            equals: "equals";
            filled: "filled";
            notFilled: "notFilled";
        }>>;
        value: z.ZodOptional<z.ZodString>;
        startTime: z.ZodOptional<z.ZodString>;
        endTime: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type FieldFilter = z.infer<typeof FieldFilterSchema>;
/**
 * Event form field entity
 */
export declare const EventFormFieldSchema: z.ZodObject<{
    id: z.ZodString;
    eventId: z.ZodString;
    order: z.ZodNumber;
    type: z.ZodEnum<{
        text: "text";
        textarea: "textarea";
        select: "select";
        checkbox: "checkbox";
        radio: "radio";
    }>;
    validater: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodRecord<z.ZodString, z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
    placeholder: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    required: z.ZodBoolean;
    values: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>>;
    options: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>>;
    filters: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        enabled: z.ZodBoolean;
        action: z.ZodEnum<{
            display: "display";
            hide: "hide";
        }>;
        operator: z.ZodEnum<{
            and: "and";
            or: "or";
        }>;
        conditions: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<{
                ticket: "ticket";
                field: "field";
                time: "time";
            }>;
            ticketId: z.ZodOptional<z.ZodString>;
            fieldId: z.ZodOptional<z.ZodString>;
            operator: z.ZodOptional<z.ZodEnum<{
                equals: "equals";
                filled: "filled";
                notFilled: "notFilled";
            }>>;
            value: z.ZodOptional<z.ZodString>;
            startTime: z.ZodOptional<z.ZodString>;
            endTime: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    prompts: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>>>;
    enableOther: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
}, z.core.$strip>;
export type EventFormField = z.infer<typeof EventFormFieldSchema>;
/**
 * Event form field create request
 */
export declare const EventFormFieldCreateRequestSchema: z.ZodObject<{
    eventId: z.ZodString;
    order: z.ZodNumber;
    type: z.ZodEnum<{
        text: "text";
        textarea: "textarea";
        select: "select";
        checkbox: "checkbox";
        radio: "radio";
    }>;
    validater: z.ZodOptional<z.ZodString>;
    name: z.ZodRecord<z.ZodString, z.ZodString>;
    description: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    placeholder: z.ZodOptional<z.ZodString>;
    required: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    values: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
    filters: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        action: z.ZodEnum<{
            display: "display";
            hide: "hide";
        }>;
        operator: z.ZodEnum<{
            and: "and";
            or: "or";
        }>;
        conditions: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<{
                ticket: "ticket";
                field: "field";
                time: "time";
            }>;
            ticketId: z.ZodOptional<z.ZodString>;
            fieldId: z.ZodOptional<z.ZodString>;
            operator: z.ZodOptional<z.ZodEnum<{
                equals: "equals";
                filled: "filled";
                notFilled: "notFilled";
            }>>;
            value: z.ZodOptional<z.ZodString>;
            startTime: z.ZodOptional<z.ZodString>;
            endTime: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    prompts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>>;
    enableOther: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type EventFormFieldCreateRequest = z.infer<typeof EventFormFieldCreateRequestSchema>;
/**
 * Event form field update request
 */
export declare const EventFormFieldUpdateRequestSchema: z.ZodObject<{
    order: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<{
        text: "text";
        textarea: "textarea";
        select: "select";
        checkbox: "checkbox";
        radio: "radio";
    }>>;
    validater: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    description: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    placeholder: z.ZodOptional<z.ZodString>;
    required: z.ZodOptional<z.ZodBoolean>;
    values: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
    filters: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        action: z.ZodEnum<{
            display: "display";
            hide: "hide";
        }>;
        operator: z.ZodEnum<{
            and: "and";
            or: "or";
        }>;
        conditions: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<{
                ticket: "ticket";
                field: "field";
                time: "time";
            }>;
            ticketId: z.ZodOptional<z.ZodString>;
            fieldId: z.ZodOptional<z.ZodString>;
            operator: z.ZodOptional<z.ZodEnum<{
                equals: "equals";
                filled: "filled";
                notFilled: "notFilled";
            }>>;
            value: z.ZodOptional<z.ZodString>;
            startTime: z.ZodOptional<z.ZodString>;
            endTime: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    prompts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>>;
    enableOther: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type EventFormFieldUpdateRequest = z.infer<typeof EventFormFieldUpdateRequestSchema>;
/**
 * Event form field reorder request
 */
export declare const EventFormFieldReorderRequestSchema: z.ZodObject<{
    fieldOrders: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type EventFormFieldReorderRequest = z.infer<typeof EventFormFieldReorderRequestSchema>;
export type TicketFormField = EventFormField;
export type TicketFormFieldReorder = EventFormFieldReorderRequest;
/**
 * Registration entity
 */
export declare const RegistrationSchema: z.ZodObject<{
    id: z.ZodString;
    eventId: z.ZodString;
    ticketId: z.ZodString;
    email: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        confirmed: "confirmed";
        cancelled: "cancelled";
    }>;
    referredBy: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    formData: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    tags: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    event: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodRecord<z.ZodString, z.ZodString>;
        description: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
        plainDescription: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
        location: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        startDate: z.ZodString;
        endDate: z.ZodString;
        slug: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
    ticket: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodRecord<z.ZodString, z.ZodString>;
        description: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
        plainDescription: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
        price: z.ZodNumber;
    }, z.core.$strip>>;
    isUpcoming: z.ZodOptional<z.ZodBoolean>;
    isPast: z.ZodOptional<z.ZodBoolean>;
    canEdit: z.ZodOptional<z.ZodBoolean>;
    canCancel: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type Registration = z.infer<typeof RegistrationSchema>;
/**
 * Registration create request
 */
export declare const RegistrationCreateRequestSchema: z.ZodObject<{
    eventId: z.ZodString;
    ticketId: z.ZodString;
    invitationCode: z.ZodOptional<z.ZodString>;
    referralCode: z.ZodOptional<z.ZodString>;
    formData: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>;
export type RegistrationCreateRequest = z.infer<typeof RegistrationCreateRequestSchema>;
/**
 * Registration update request
 */
export declare const RegistrationUpdateRequestSchema: z.ZodObject<{
    formData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        confirmed: "confirmed";
        cancelled: "cancelled";
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type RegistrationUpdateRequest = z.infer<typeof RegistrationUpdateRequestSchema>;
/**
 * Registration statistics
 */
export declare const RegistrationStatsSchema: z.ZodObject<{
    totalReferrals: z.ZodNumber;
    successfulReferrals: z.ZodNumber;
    referralList: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        status: z.ZodString;
        ticketName: z.ZodRecord<z.ZodString, z.ZodString>;
        registeredAt: z.ZodString;
        email: z.ZodString;
    }, z.core.$strip>>;
    referrerInfo: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type RegistrationStats = z.infer<typeof RegistrationStatsSchema>;
/**
 * Referral entity
 */
export declare const ReferralSchema: z.ZodObject<{
    id: z.ZodString;
    eventId: z.ZodString;
    userId: z.ZodString;
    code: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export type Referral = z.infer<typeof ReferralSchema>;
/**
 * Referral link response
 */
export declare const ReferralLinkSchema: z.ZodObject<{
    id: z.ZodString;
    referralLink: z.ZodString;
    referralCode: z.ZodString;
    eventId: z.ZodString;
}, z.core.$strip>;
export type ReferralLink = z.infer<typeof ReferralLinkSchema>;
/**
 * Referral validation request
 */
export declare const ReferralValidateRequestSchema: z.ZodObject<{
    code: z.ZodString;
    eventId: z.ZodString;
}, z.core.$strip>;
export type ReferralValidateRequest = z.infer<typeof ReferralValidateRequestSchema>;
/**
 * Referral validation response
 */
export declare const ReferralValidationSchema: z.ZodObject<{
    isValid: z.ZodBoolean;
    code: z.ZodString;
    referralId: z.ZodString;
}, z.core.$strip>;
export type ReferralValidation = z.infer<typeof ReferralValidationSchema>;
/**
 * Referral usage entity
 */
export declare const ReferralUsageSchema: z.ZodObject<{
    id: z.ZodString;
    referralId: z.ZodString;
    eventId: z.ZodString;
    userId: z.ZodString;
    usedAt: z.ZodString;
}, z.core.$strip>;
export type ReferralUsage = z.infer<typeof ReferralUsageSchema>;
/**
 * Referral overview
 */
export declare const ReferralOverviewSchema: z.ZodObject<{
    totalReferrals: z.ZodNumber;
    successfulReferrals: z.ZodNumber;
    conversionRate: z.ZodNumber;
    topReferrers: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        referralCount: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ReferralOverview = z.infer<typeof ReferralOverviewSchema>;
/**
 * Referral leaderboard
 */
export declare const ReferralLeaderboardSchema: z.ZodObject<{
    ranking: z.ZodArray<z.ZodObject<{
        rank: z.ZodNumber;
        registrationId: z.ZodString;
        email: z.ZodString;
        referralCount: z.ZodNumber;
        successfulReferrals: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ReferralLeaderboard = z.infer<typeof ReferralLeaderboardSchema>;
/**
 * Referral tree
 */
export declare const ReferralTreeSchema: z.ZodObject<{
    root: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        status: z.ZodString;
    }, z.core.$strip>;
    children: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        status: z.ZodString;
        registeredAt: z.ZodString;
        children: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ReferralTree = z.infer<typeof ReferralTreeSchema>;
/**
 * Qualified referrer
 */
export declare const QualifiedReferrerSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    referralCount: z.ZodNumber;
    isQualified: z.ZodBoolean;
    qualificationThreshold: z.ZodNumber;
}, z.core.$strip>;
export type QualifiedReferrer = z.infer<typeof QualifiedReferrerSchema>;
/**
 * Draw result
 */
export declare const DrawResultSchema: z.ZodObject<{
    winners: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        referralCount: z.ZodNumber;
    }, z.core.$strip>>;
    drawDate: z.ZodString;
    totalParticipants: z.ZodNumber;
}, z.core.$strip>;
export type DrawResult = z.infer<typeof DrawResultSchema>;
/**
 * Invitation code entity
 */
export declare const InvitationCodeSchema: z.ZodObject<{
    id: z.ZodString;
    ticketId: z.ZodString;
    code: z.ZodString;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    usageLimit: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    usedCount: z.ZodNumber;
    validFrom: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    validUntil: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export type InvitationCode = z.infer<typeof InvitationCodeSchema>;
/**
 * Invitation code with extra info
 */
export declare const InvitationCodeInfoSchema: z.ZodObject<{
    id: z.ZodString;
    ticketId: z.ZodString;
    code: z.ZodString;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    usageLimit: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    usedCount: z.ZodNumber;
    validFrom: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    validUntil: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type InvitationCodeInfo = z.infer<typeof InvitationCodeInfoSchema>;
/**
 * Invitation code create request
 */
export declare const InvitationCodeCreateRequestSchema: z.ZodObject<{
    ticketId: z.ZodString;
    code: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    usageLimit: z.ZodOptional<z.ZodNumber>;
    validFrom: z.ZodOptional<z.ZodString>;
    validUntil: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type InvitationCodeCreateRequest = z.infer<typeof InvitationCodeCreateRequestSchema>;
/**
 * Invitation code update request
 */
export declare const InvitationCodeUpdateRequestSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    usageLimit: z.ZodOptional<z.ZodNumber>;
    validFrom: z.ZodOptional<z.ZodString>;
    validUntil: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    ticketId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type InvitationCodeUpdateRequest = z.infer<typeof InvitationCodeUpdateRequestSchema>;
/**
 * Invitation code verify request
 */
export declare const InvitationCodeVerifyRequestSchema: z.ZodObject<{
    code: z.ZodString;
    ticketId: z.ZodString;
}, z.core.$strip>;
export type InvitationCodeVerifyRequest = z.infer<typeof InvitationCodeVerifyRequestSchema>;
/**
 * Invitation code verification response
 */
export declare const InvitationCodeVerificationSchema: z.ZodObject<{
    valid: z.ZodBoolean;
    invitationCode: z.ZodObject<{
        id: z.ZodString;
        code: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        usedCount: z.ZodNumber;
        usageLimit: z.ZodOptional<z.ZodNumber>;
        expiresAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    availableTickets: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodRecord<z.ZodString, z.ZodString>;
        description: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
        plainDescription: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
        price: z.ZodNumber;
        quantity: z.ZodNumber;
        soldCount: z.ZodNumber;
        available: z.ZodNumber;
        isOnSale: z.ZodBoolean;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type InvitationCodeVerification = z.infer<typeof InvitationCodeVerificationSchema>;
/**
 * Target audience filters
 */
export declare const TargetAudienceSchema: z.ZodObject<{
    roles: z.ZodOptional<z.ZodArray<z.ZodString>>;
    eventIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    ticketIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    registrationStatuses: z.ZodOptional<z.ZodArray<z.ZodString>>;
    hasReferrals: z.ZodOptional<z.ZodBoolean>;
    isReferrer: z.ZodOptional<z.ZodBoolean>;
    registeredAfter: z.ZodOptional<z.ZodString>;
    registeredBefore: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    emailDomains: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type TargetAudience = z.infer<typeof TargetAudienceSchema>;
/**
 * Email campaign entity
 */
export declare const EmailCampaignSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    subject: z.ZodString;
    content: z.ZodString;
    eventId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    recipientFilter: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    targetAudience: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        roles: z.ZodOptional<z.ZodArray<z.ZodString>>;
        eventIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        ticketIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        registrationStatuses: z.ZodOptional<z.ZodArray<z.ZodString>>;
        hasReferrals: z.ZodOptional<z.ZodBoolean>;
        isReferrer: z.ZodOptional<z.ZodBoolean>;
        registeredAfter: z.ZodOptional<z.ZodString>;
        registeredBefore: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        emailDomains: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
    status: z.ZodEnum<{
        cancelled: "cancelled";
        draft: "draft";
        sent: "sent";
        scheduled: "scheduled";
        sending: "sending";
    }>;
    sentCount: z.ZodNumber;
    totalCount: z.ZodNumber;
    scheduledAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sentAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    user: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type EmailCampaign = z.infer<typeof EmailCampaignSchema>;
/**
 * Email campaign create request
 */
export declare const EmailCampaignCreateRequestSchema: z.ZodObject<{
    name: z.ZodString;
    subject: z.ZodString;
    content: z.ZodString;
    eventId: z.ZodOptional<z.ZodString>;
    targetAudience: z.ZodOptional<z.ZodObject<{
        roles: z.ZodOptional<z.ZodArray<z.ZodString>>;
        eventIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        ticketIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        registrationStatuses: z.ZodOptional<z.ZodArray<z.ZodString>>;
        hasReferrals: z.ZodOptional<z.ZodBoolean>;
        isReferrer: z.ZodOptional<z.ZodBoolean>;
        registeredAfter: z.ZodOptional<z.ZodString>;
        registeredBefore: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        emailDomains: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    scheduledAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type EmailCampaignCreateRequest = z.infer<typeof EmailCampaignCreateRequestSchema>;
/**
 * Email campaign update request
 */
export declare const EmailCampaignUpdateRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    subject: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    eventId: z.ZodOptional<z.ZodString>;
    targetAudience: z.ZodOptional<z.ZodObject<{
        roles: z.ZodOptional<z.ZodArray<z.ZodString>>;
        eventIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        ticketIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        registrationStatuses: z.ZodOptional<z.ZodArray<z.ZodString>>;
        hasReferrals: z.ZodOptional<z.ZodBoolean>;
        isReferrer: z.ZodOptional<z.ZodBoolean>;
        registeredAfter: z.ZodOptional<z.ZodString>;
        registeredBefore: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        emailDomains: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    scheduledAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type EmailCampaignUpdateRequest = z.infer<typeof EmailCampaignUpdateRequestSchema>;
/**
 * Email campaign send request
 */
export declare const EmailCampaignSendRequestSchema: z.ZodObject<{
    sendNow: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    scheduledAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type EmailCampaignSendRequest = z.infer<typeof EmailCampaignSendRequestSchema>;
/**
 * Email campaign status response
 */
export declare const EmailCampaignStatusResponseSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<{
        draft: "draft";
        sent: "sent";
        scheduled: "scheduled";
        sending: "sending";
        failed: "failed";
    }>;
    totalRecipients: z.ZodNumber;
    sentCount: z.ZodNumber;
    failedCount: z.ZodNumber;
    openCount: z.ZodOptional<z.ZodNumber>;
    clickCount: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type EmailCampaignStatusResponse = z.infer<typeof EmailCampaignStatusResponseSchema>;
/**
 * Campaign result
 */
export declare const CampaignResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    sentCount: z.ZodNumber;
    failedCount: z.ZodNumber;
    totalRecipients: z.ZodNumber;
}, z.core.$strip>;
export type CampaignResult = z.infer<typeof CampaignResultSchema>;
/**
 * Email sender
 */
export declare const EmailSenderSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export type EmailSender = z.infer<typeof EmailSenderSchema>;
/**
 * Email recipient
 */
export declare const EmailRecipientSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export type EmailRecipient = z.infer<typeof EmailRecipientSchema>;
/**
 * Recipient data
 */
export declare const RecipientDataSchema: z.ZodObject<{
    email: z.ZodString;
    id: z.ZodString;
    formData: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    event: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        slug: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
        name: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>>;
        plainDescription: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>>;
        location: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
        ogImage: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
        landingPage: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
        googleSheetsUrl: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        hideEvent: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        useOpass: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        createdAt: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    ticket: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        eventId: z.ZodOptional<z.ZodString>;
        order: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        name: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>>;
        plainDescription: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>>;
        price: z.ZodOptional<z.ZodNumber>;
        quantity: z.ZodOptional<z.ZodNumber>;
        soldCount: z.ZodOptional<z.ZodNumber>;
        available: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        saleStart: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
        saleEnd: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
        isOnSale: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        isSoldOut: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        isActive: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        hidden: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        requireInviteCode: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        requireSmsVerification: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        createdAt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        updatedAt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type RecipientData = z.infer<typeof RecipientDataSchema>;
/**
 * Send verification request
 */
export declare const SendVerificationRequestSchema: z.ZodObject<{
    phoneNumber: z.ZodString;
    locale: z.ZodOptional<z.ZodEnum<{
        "zh-Hant": "zh-Hant";
        "zh-Hans": "zh-Hans";
        en: "en";
    }>>;
    turnstileToken: z.ZodString;
}, z.core.$strip>;
export type SendVerificationRequest = z.infer<typeof SendVerificationRequestSchema>;
/**
 * Verify code request
 */
export declare const VerifyCodeRequestSchema: z.ZodObject<{
    phoneNumber: z.ZodString;
    code: z.ZodString;
}, z.core.$strip>;
export type VerifyCodeRequest = z.infer<typeof VerifyCodeRequestSchema>;
/**
 * TwSMS API response
 */
export declare const TwSMSResponseSchema: z.ZodObject<{
    code: z.ZodString;
    text: z.ZodString;
    msgid: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TwSMSResponse = z.infer<typeof TwSMSResponseSchema>;
/**
 * TwSMS status response
 */
export declare const TwSMSStatusResponseSchema: z.ZodObject<{
    code: z.ZodString;
    text: z.ZodString;
    statuscode: z.ZodOptional<z.ZodString>;
    statustext: z.ZodOptional<z.ZodString>;
    donetime: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TwSMSStatusResponse = z.infer<typeof TwSMSStatusResponseSchema>;
/**
 * SMS send result
 */
export declare const SMSSendResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    msgid: z.ZodString;
    code: z.ZodString;
    text: z.ZodString;
}, z.core.$strip>;
export type SMSSendResult = z.infer<typeof SMSSendResultSchema>;
/**
 * Cloudflare Turnstile response
 */
export declare const TurnstileResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    challenge_ts: z.ZodOptional<z.ZodString>;
    hostname: z.ZodOptional<z.ZodString>;
    "error-codes": z.ZodOptional<z.ZodArray<z.ZodString>>;
    action: z.ZodOptional<z.ZodString>;
    cdata: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        ephemeral_id: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type TurnstileResponse = z.infer<typeof TurnstileResponseSchema>;
/**
 * Turnstile validation options
 */
export declare const TurnstileValidationOptionsSchema: z.ZodObject<{
    remoteip: z.ZodOptional<z.ZodString>;
    idempotencyKey: z.ZodOptional<z.ZodString>;
    expectedAction: z.ZodOptional<z.ZodString>;
    expectedHostname: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TurnstileValidationOptions = z.infer<typeof TurnstileValidationOptionsSchema>;
/**
 * Turnstile validation result
 */
export declare const TurnstileValidationResultSchema: z.ZodObject<{
    valid: z.ZodBoolean;
    reason: z.ZodOptional<z.ZodString>;
    errors: z.ZodOptional<z.ZodArray<z.ZodString>>;
    expected: z.ZodOptional<z.ZodString>;
    received: z.ZodOptional<z.ZodString>;
    data: z.ZodOptional<z.ZodObject<{
        success: z.ZodBoolean;
        challenge_ts: z.ZodOptional<z.ZodString>;
        hostname: z.ZodOptional<z.ZodString>;
        "error-codes": z.ZodOptional<z.ZodArray<z.ZodString>>;
        action: z.ZodOptional<z.ZodString>;
        cdata: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            ephemeral_id: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    tokenAge: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type TurnstileValidationResult = z.infer<typeof TurnstileValidationResultSchema>;
/**
 * Analytics data
 */
export declare const AnalyticsDataSchema: z.ZodObject<{
    totalRegistrations: z.ZodNumber;
    confirmedRegistrations: z.ZodNumber;
    pendingRegistrations: z.ZodNumber;
    cancelledRegistrations: z.ZodNumber;
    checkedInCount: z.ZodNumber;
    registrationsByDate: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    ticketSales: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    referralStats: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>;
export type AnalyticsData = z.infer<typeof AnalyticsDataSchema>;
/**
 * Event dashboard data
 */
export declare const EventDashboardDataSchema: z.ZodObject<{
    event: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodRecord<z.ZodString, z.ZodString>;
        startDate: z.ZodString;
        endDate: z.ZodString;
        location: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
    stats: z.ZodObject<{
        totalRegistrations: z.ZodNumber;
        confirmedRegistrations: z.ZodNumber;
        pendingRegistrations: z.ZodNumber;
        cancelledRegistrations: z.ZodNumber;
        totalRevenue: z.ZodNumber;
    }, z.core.$strip>;
    tickets: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodRecord<z.ZodString, z.ZodString>;
        price: z.ZodNumber;
        quantity: z.ZodNumber;
        soldCount: z.ZodNumber;
        revenue: z.ZodNumber;
        available: z.ZodNumber;
        salesRate: z.ZodNumber;
    }, z.core.$strip>>;
    registrationTrends: z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        count: z.ZodNumber;
        confirmed: z.ZodNumber;
    }, z.core.$strip>>;
    referralStats: z.ZodObject<{
        totalReferrals: z.ZodNumber;
        activeReferrers: z.ZodNumber;
        conversionRate: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export type EventDashboardData = z.infer<typeof EventDashboardDataSchema>;
/**
 * Validation error
 */
export declare const ValidationErrorSchema: z.ZodObject<{
    statusCode: z.ZodNumber;
    code: z.ZodString;
    error: z.ZodString;
    message: z.ZodString;
    validation: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        message: z.ZodString;
    }, z.core.$strip>>>;
    validationContext: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
/**
 * Form validation rules
 */
export declare const FormValidationRulesSchema: z.ZodObject<{
    required: z.ZodOptional<z.ZodBoolean>;
    minLength: z.ZodOptional<z.ZodNumber>;
    maxLength: z.ZodOptional<z.ZodNumber>;
    pattern: z.ZodOptional<z.ZodUnion<readonly [z.ZodCustom<RegExp, RegExp>, z.ZodString]>>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    min: z.ZodOptional<z.ZodNumber>;
    max: z.ZodOptional<z.ZodNumber>;
    options: z.ZodOptional<z.ZodArray<z.ZodString>>;
    customMessage: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type FormValidationRules = z.infer<typeof FormValidationRulesSchema>;
/**
 * Field validation error
 */
export declare const FieldValidationErrorSchema: z.ZodObject<{
    field: z.ZodString;
    messages: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type FieldValidationError = z.infer<typeof FieldValidationErrorSchema>;
/**
 * Validation result
 */
export declare const ValidationResultSchema: z.ZodObject<{
    isValid: z.ZodBoolean;
    errors: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
/**
 * Export data response
 */
export declare const ExportDataSchema: z.ZodObject<{
    downloadUrl: z.ZodString;
    filename: z.ZodString;
    count: z.ZodNumber;
}, z.core.$strip>;
export type ExportData = z.infer<typeof ExportDataSchema>;
/**
 * Health status
 */
export declare const HealthStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        error: "error";
        ok: "ok";
    }>;
    timestamp: z.ZodString;
    version: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type HealthStatus = z.infer<typeof HealthStatusSchema>;
/**
 * Redis client config
 */
export declare const RedisClientConfigSchema: z.ZodObject<{
    host: z.ZodString;
    port: z.ZodNumber;
    password: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    db: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type RedisClientConfig = z.infer<typeof RedisClientConfigSchema>;
/**
 * SMS send options
 */
export interface SMSSendOptions {
    expirytime?: number;
    [key: string]: string | number | undefined;
}
/**
 * Event access request (for middleware)
 */
export interface EventAccessRequest {
    eventId?: string;
    id?: string;
}
/**
 * ID params (for route parameters)
 */
export interface IdParams {
    id: string;
}
/**
 * Ticket body (for ticket-related requests)
 */
export interface TicketBody {
    ticketId: string;
    [key: string]: unknown;
}
/**
 * Ticket ID params (for route parameters)
 */
export interface TicketIdParams {
    ticketId: string;
}
/**
 * Ticket ID query (for query parameters)
 */
export interface TicketIdQuery {
    ticketId: string;
}
/**
 * Email campaign content
 */
export interface EmailCampaignContent {
    subject: string;
    content: string;
    html?: string;
}
/**
 * Target audience filters (alias for backwards compatibility)
 */
export type TargetAudienceFilters = TargetAudience;
/**
 * Event form fields (alias for backwards compatibility)
 */
export type EventFormFields = EventFormField;
