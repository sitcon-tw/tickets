/**
 * Unified types and schemas for SITCON tickets system
 * This package provides Zod schemas and TypeScript types for both frontend and backend
 */
import { z } from "zod";
/**
 * Localized text for multi-language support
 * e.g., { "en": "SITCON 2026", "zh-Hant": "學生計算機年會 2026" }
 */
export declare const LocalizedTextSchema: z.ZodRecord<z.ZodString, z.ZodString>;
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;
/**
 * Sort order for queries
 */
export declare const SortOrderSchema: z.ZodEnum<["asc", "desc"]>;
export type SortOrder = z.infer<typeof SortOrderSchema>;
/**
 * User roles in the system
 */
export declare const UserRoleSchema: z.ZodEnum<["admin", "viewer", "eventAdmin"]>;
export type UserRole = z.infer<typeof UserRoleSchema>;
/**
 * Registration status
 */
export declare const RegistrationStatusSchema: z.ZodEnum<["pending", "confirmed", "cancelled"]>;
export type RegistrationStatus = z.infer<typeof RegistrationStatusSchema>;
/**
 * Email campaign status
 */
export declare const EmailCampaignStatusSchema: z.ZodEnum<["draft", "sent", "scheduled", "sending", "cancelled"]>;
export type EmailCampaignStatus = z.infer<typeof EmailCampaignStatusSchema>;
/**
 * Form field types
 */
export declare const FormFieldTypeSchema: z.ZodEnum<["text", "textarea", "select", "checkbox", "radio"]>;
export type FormFieldType = z.infer<typeof FormFieldTypeSchema>;
/**
 * Supported locales for SMS
 */
export declare const LocaleSchema: z.ZodEnum<["zh-Hant", "zh-Hans", "en"]>;
export type Locale = z.infer<typeof LocaleSchema>;
/**
 * Standard API response wrapper
 */
export declare const ApiResponseSchema: <T extends z.ZodType>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    data: T;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    message: z.ZodString;
    data: T;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    success: z.ZodBoolean;
    message: z.ZodString;
    data: T;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
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
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: unknown;
    }, {
        code: string;
        message: string;
        details?: unknown;
    }>;
}, "strip", z.ZodTypeAny, {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}, {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}>;
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
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}, {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}>;
export type Pagination = z.infer<typeof PaginationSchema>;
/**
 * Paginated response wrapper
 */
export declare const PaginatedResponseSchema: <T extends z.ZodType>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    data: z.ZodArray<T, "many">;
    pagination: z.ZodOptional<z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    data: T["_output"][];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    } | undefined;
}, {
    message: string;
    success: boolean;
    data: T["_input"][];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    } | undefined;
}>;
/**
 * Pagination query parameters
 */
export declare const PaginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
/**
 * Search query parameters
 */
export declare const SearchQuerySchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    q?: string | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    filters?: Record<string, unknown> | undefined;
}, {
    q?: string | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    filters?: Record<string, unknown> | undefined;
}>;
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
}, "strip", z.ZodTypeAny, {
    id: string;
    phoneNumber: string;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
}, {
    id: string;
    phoneNumber: string;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
}>;
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
    role: z.ZodEnum<["admin", "viewer", "eventAdmin"]>;
    permissions: z.ZodArray<z.ZodString, "many">;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    smsVerifications: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        phoneNumber: z.ZodString;
        verified: z.ZodBoolean;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        phoneNumber: string;
        verified: boolean;
        createdAt: string;
        updatedAt: string;
    }, {
        id: string;
        phoneNumber: string;
        verified: boolean;
        createdAt: string;
        updatedAt: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    email: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    emailVerified: boolean;
    role: "admin" | "viewer" | "eventAdmin";
    permissions: string[];
    isActive: boolean;
    image?: string | null | undefined;
    smsVerifications?: {
        id: string;
        phoneNumber: string;
        verified: boolean;
        createdAt: string;
        updatedAt: string;
    }[] | undefined;
}, {
    email: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    emailVerified: boolean;
    role: "admin" | "viewer" | "eventAdmin";
    permissions: string[];
    isActive: boolean;
    image?: string | null | undefined;
    smsVerifications?: {
        id: string;
        phoneNumber: string;
        verified: boolean;
        createdAt: string;
        updatedAt: string;
    }[] | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
/**
 * Session user (simplified for session context)
 */
export declare const SessionUserSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<["admin", "viewer", "eventAdmin"]>;
    permissions: z.ZodArray<z.ZodString, "many">;
    isActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    email: string;
    id: string;
    name: string;
    role: "admin" | "viewer" | "eventAdmin";
    permissions: string[];
    isActive: boolean;
}, {
    email: string;
    id: string;
    name: string;
    role: "admin" | "viewer" | "eventAdmin";
    permissions: string[];
    isActive: boolean;
}>;
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
    managedEventIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    canManageUsers: boolean;
    canManageAllEvents: boolean;
    canViewAnalytics: boolean;
    canManageEmailCampaigns: boolean;
    canManageReferrals: boolean;
    canManageSmsLogs: boolean;
    managedEventIds: string[];
}, {
    canManageUsers: boolean;
    canManageAllEvents: boolean;
    canViewAnalytics: boolean;
    canManageEmailCampaigns: boolean;
    canManageReferrals: boolean;
    canManageSmsLogs: boolean;
    managedEventIds: string[];
}>;
export type UserCapabilities = z.infer<typeof UserCapabilitiesSchema>;
/**
 * Permissions response
 */
export declare const PermissionsResponseSchema: z.ZodObject<{
    role: z.ZodEnum<["admin", "viewer", "eventAdmin"]>;
    permissions: z.ZodArray<z.ZodString, "many">;
    capabilities: z.ZodObject<{
        canManageUsers: z.ZodBoolean;
        canManageAllEvents: z.ZodBoolean;
        canViewAnalytics: z.ZodBoolean;
        canManageEmailCampaigns: z.ZodBoolean;
        canManageReferrals: z.ZodBoolean;
        canManageSmsLogs: z.ZodBoolean;
        managedEventIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        canManageUsers: boolean;
        canManageAllEvents: boolean;
        canViewAnalytics: boolean;
        canManageEmailCampaigns: boolean;
        canManageReferrals: boolean;
        canManageSmsLogs: boolean;
        managedEventIds: string[];
    }, {
        canManageUsers: boolean;
        canManageAllEvents: boolean;
        canViewAnalytics: boolean;
        canManageEmailCampaigns: boolean;
        canManageReferrals: boolean;
        canManageSmsLogs: boolean;
        managedEventIds: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    role: "admin" | "viewer" | "eventAdmin";
    permissions: string[];
    capabilities: {
        canManageUsers: boolean;
        canManageAllEvents: boolean;
        canViewAnalytics: boolean;
        canManageEmailCampaigns: boolean;
        canManageReferrals: boolean;
        canManageSmsLogs: boolean;
        managedEventIds: string[];
    };
}, {
    role: "admin" | "viewer" | "eventAdmin";
    permissions: string[];
    capabilities: {
        canManageUsers: boolean;
        canManageAllEvents: boolean;
        canViewAnalytics: boolean;
        canManageEmailCampaigns: boolean;
        canManageReferrals: boolean;
        canManageSmsLogs: boolean;
        managedEventIds: string[];
    };
}>;
export type PermissionsResponse = z.infer<typeof PermissionsResponseSchema>;
/**
 * Auth context
 */
export declare const AuthContextSchema: z.ZodObject<{
    user: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        email: z.ZodString;
        role: z.ZodEnum<["admin", "viewer", "eventAdmin"]>;
        permissions: z.ZodArray<z.ZodString, "many">;
        isActive: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: string;
        name: string;
        role: "admin" | "viewer" | "eventAdmin";
        permissions: string[];
        isActive: boolean;
    }, {
        email: string;
        id: string;
        name: string;
        role: "admin" | "viewer" | "eventAdmin";
        permissions: string[];
        isActive: boolean;
    }>>;
    sessionId: z.ZodNullable<z.ZodString>;
    isAuthenticated: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    user: {
        email: string;
        id: string;
        name: string;
        role: "admin" | "viewer" | "eventAdmin";
        permissions: string[];
        isActive: boolean;
    } | null;
    sessionId: string | null;
    isAuthenticated: boolean;
}, {
    user: {
        email: string;
        id: string;
        name: string;
        role: "admin" | "viewer" | "eventAdmin";
        permissions: string[];
        isActive: boolean;
    } | null;
    sessionId: string | null;
    isAuthenticated: boolean;
}>;
export type AuthContext = z.infer<typeof AuthContextSchema>;
/**
 * Login request
 */
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
/**
 * Register request
 */
export declare const RegisterRequestSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    password: string;
}, {
    email: string;
    name: string;
    password: string;
}>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
/**
 * Magic link request
 */
export declare const MagicLinkRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export type MagicLinkRequest = z.infer<typeof MagicLinkRequestSchema>;
/**
 * Reset password request
 */
export declare const ResetPasswordRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
/**
 * Change password request
 */
export declare const ChangePasswordRequestSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
/**
 * User update request (self-service)
 */
export declare const UserUpdateRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    name?: string | undefined;
    image?: string | undefined;
}, {
    email?: string | undefined;
    name?: string | undefined;
    image?: string | undefined;
}>;
export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;
/**
 * Admin user update request
 */
export declare const AdminUserUpdateRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["admin", "viewer", "eventAdmin"]>>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    name?: string | undefined;
    role?: "admin" | "viewer" | "eventAdmin" | undefined;
    permissions?: string[] | undefined;
    isActive?: boolean | undefined;
}, {
    email?: string | undefined;
    name?: string | undefined;
    role?: "admin" | "viewer" | "eventAdmin" | undefined;
    permissions?: string[] | undefined;
    isActive?: boolean | undefined;
}>;
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
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        emailVerified: boolean;
        image?: string | null | undefined;
    }, {
        email: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        emailVerified: boolean;
        image?: string | null | undefined;
    }>;
    session: z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        userId: z.ZodString;
        expiresAt: z.ZodString;
        token: z.ZodString;
        ipAddress: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        userAgent: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        updatedAt: string;
        userId: string;
        expiresAt: string;
        token: string;
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
    }, {
        id: string;
        createdAt: string;
        updatedAt: string;
        userId: string;
        expiresAt: string;
        token: string;
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    user: {
        email: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        emailVerified: boolean;
        image?: string | null | undefined;
    };
    session: {
        id: string;
        createdAt: string;
        updatedAt: string;
        userId: string;
        expiresAt: string;
        token: string;
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
    };
}, {
    user: {
        email: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        name: string;
        emailVerified: boolean;
        image?: string | null | undefined;
    };
    session: {
        id: string;
        createdAt: string;
        updatedAt: string;
        userId: string;
        expiresAt: string;
        token: string;
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
    };
}>;
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
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    updatedAt: string;
    name: Record<string, string>;
    isActive: boolean;
    startDate: string;
    endDate: string;
    slug?: string | null | undefined;
    description?: Record<string, string> | null | undefined;
    plainDescription?: Record<string, string> | null | undefined;
    location?: string | null | undefined;
    ogImage?: string | null | undefined;
    landingPage?: string | null | undefined;
    googleSheetsUrl?: string | null | undefined;
    hideEvent?: boolean | undefined;
    useOpass?: boolean | undefined;
}, {
    id: string;
    createdAt: string;
    updatedAt: string;
    name: Record<string, string>;
    isActive: boolean;
    startDate: string;
    endDate: string;
    slug?: string | null | undefined;
    description?: Record<string, string> | null | undefined;
    plainDescription?: Record<string, string> | null | undefined;
    location?: string | null | undefined;
    ogImage?: string | null | undefined;
    landingPage?: string | null | undefined;
    googleSheetsUrl?: string | null | undefined;
    hideEvent?: boolean | undefined;
    useOpass?: boolean | undefined;
}>;
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
} & {
    ticketCount: z.ZodNumber;
    registrationCount: z.ZodNumber;
    hasAvailableTickets: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    updatedAt: string;
    name: Record<string, string>;
    isActive: boolean;
    startDate: string;
    endDate: string;
    ticketCount: number;
    registrationCount: number;
    hasAvailableTickets: boolean;
    slug?: string | null | undefined;
    description?: Record<string, string> | null | undefined;
    plainDescription?: Record<string, string> | null | undefined;
    location?: string | null | undefined;
    ogImage?: string | null | undefined;
    landingPage?: string | null | undefined;
    googleSheetsUrl?: string | null | undefined;
    hideEvent?: boolean | undefined;
    useOpass?: boolean | undefined;
}, {
    id: string;
    createdAt: string;
    updatedAt: string;
    name: Record<string, string>;
    isActive: boolean;
    startDate: string;
    endDate: string;
    ticketCount: number;
    registrationCount: number;
    hasAvailableTickets: boolean;
    slug?: string | null | undefined;
    description?: Record<string, string> | null | undefined;
    plainDescription?: Record<string, string> | null | undefined;
    location?: string | null | undefined;
    ogImage?: string | null | undefined;
    landingPage?: string | null | undefined;
    googleSheetsUrl?: string | null | undefined;
    hideEvent?: boolean | undefined;
    useOpass?: boolean | undefined;
}>;
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
}, "strip", z.ZodTypeAny, {
    name: Record<string, string>;
    startDate: string;
    endDate: string;
    slug?: string | undefined;
    description?: Record<string, string> | undefined;
    plainDescription?: Record<string, string> | undefined;
    location?: string | undefined;
    ogImage?: string | undefined;
}, {
    name: Record<string, string>;
    startDate: string;
    endDate: string;
    slug?: string | undefined;
    description?: Record<string, string> | undefined;
    plainDescription?: Record<string, string> | undefined;
    location?: string | undefined;
    ogImage?: string | undefined;
}>;
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
}, "strip", z.ZodTypeAny, {
    name?: Record<string, string> | undefined;
    isActive?: boolean | undefined;
    slug?: string | undefined;
    description?: Record<string, string> | undefined;
    plainDescription?: Record<string, string> | undefined;
    location?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    ogImage?: string | undefined;
    hideEvent?: boolean | undefined;
    useOpass?: boolean | undefined;
}, {
    name?: Record<string, string> | undefined;
    isActive?: boolean | undefined;
    slug?: string | undefined;
    description?: Record<string, string> | undefined;
    plainDescription?: Record<string, string> | undefined;
    location?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    ogImage?: string | undefined;
    hideEvent?: boolean | undefined;
    useOpass?: boolean | undefined;
}>;
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
}, "strip", z.ZodTypeAny, {
    eventName: Record<string, string>;
    totalRegistrations: number;
    confirmedRegistrations: number;
    totalTickets: number;
    availableTickets: number;
    registrationRate: number;
}, {
    eventName: Record<string, string>;
    totalRegistrations: number;
    confirmedRegistrations: number;
    totalTickets: number;
    availableTickets: number;
    registrationRate: number;
}>;
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
}, "strip", z.ZodTypeAny, {
    id: string;
    name: Record<string, string>;
    eventId: string;
    price: number;
    quantity: number;
    soldCount: number;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    isActive?: boolean | undefined;
    description?: Record<string, string> | null | undefined;
    plainDescription?: Record<string, string> | null | undefined;
    order?: number | undefined;
    available?: number | undefined;
    saleStart?: string | null | undefined;
    saleEnd?: string | null | undefined;
    isOnSale?: boolean | undefined;
    isSoldOut?: boolean | undefined;
    hidden?: boolean | undefined;
    requireInviteCode?: boolean | undefined;
    requireSmsVerification?: boolean | undefined;
}, {
    id: string;
    name: Record<string, string>;
    eventId: string;
    price: number;
    quantity: number;
    soldCount: number;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    isActive?: boolean | undefined;
    description?: Record<string, string> | null | undefined;
    plainDescription?: Record<string, string> | null | undefined;
    order?: number | undefined;
    available?: number | undefined;
    saleStart?: string | null | undefined;
    saleEnd?: string | null | undefined;
    isOnSale?: boolean | undefined;
    isSoldOut?: boolean | undefined;
    hidden?: boolean | undefined;
    requireInviteCode?: boolean | undefined;
    requireSmsVerification?: boolean | undefined;
}>;
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
}, "strip", z.ZodTypeAny, {
    name: Record<string, string>;
    eventId: string;
    price: number;
    quantity: number;
    description?: Record<string, string> | undefined;
    plainDescription?: Record<string, string> | undefined;
    order?: number | undefined;
    saleStart?: string | undefined;
    saleEnd?: string | undefined;
    hidden?: boolean | undefined;
    requireInviteCode?: boolean | undefined;
    requireSmsVerification?: boolean | undefined;
}, {
    name: Record<string, string>;
    eventId: string;
    price: number;
    quantity: number;
    description?: Record<string, string> | undefined;
    plainDescription?: Record<string, string> | undefined;
    order?: number | undefined;
    saleStart?: string | undefined;
    saleEnd?: string | undefined;
    hidden?: boolean | undefined;
    requireInviteCode?: boolean | undefined;
    requireSmsVerification?: boolean | undefined;
}>;
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
}, "strip", z.ZodTypeAny, {
    name?: Record<string, string> | undefined;
    isActive?: boolean | undefined;
    description?: Record<string, string> | undefined;
    plainDescription?: Record<string, string> | undefined;
    order?: number | undefined;
    price?: number | undefined;
    quantity?: number | undefined;
    saleStart?: string | undefined;
    saleEnd?: string | undefined;
    hidden?: boolean | undefined;
    requireInviteCode?: boolean | undefined;
    requireSmsVerification?: boolean | undefined;
}, {
    name?: Record<string, string> | undefined;
    isActive?: boolean | undefined;
    description?: Record<string, string> | undefined;
    plainDescription?: Record<string, string> | undefined;
    order?: number | undefined;
    price?: number | undefined;
    quantity?: number | undefined;
    saleStart?: string | undefined;
    saleEnd?: string | undefined;
    hidden?: boolean | undefined;
    requireInviteCode?: boolean | undefined;
    requireSmsVerification?: boolean | undefined;
}>;
export type TicketUpdateRequest = z.infer<typeof TicketUpdateRequestSchema>;
/**
 * Ticket reorder request
 */
export declare const TicketReorderRequestSchema: z.ZodObject<{
    tickets: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        order: number;
    }, {
        id: string;
        order: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    tickets: {
        id: string;
        order: number;
    }[];
}, {
    tickets: {
        id: string;
        order: number;
    }[];
}>;
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
    }, "strip", z.ZodTypeAny, {
        date: string;
        count: number;
        revenue: number;
    }, {
        date: string;
        count: number;
        revenue: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    totalSoldCount: number;
    totalRevenue: number;
    availableQuantity: number;
    salesByStatus: Record<string, number>;
    dailySales: {
        date: string;
        count: number;
        revenue: number;
    }[];
}, {
    totalSoldCount: number;
    totalRevenue: number;
    availableQuantity: number;
    salesByStatus: Record<string, number>;
    dailySales: {
        date: string;
        count: number;
        revenue: number;
    }[];
}>;
export type TicketAnalytics = z.infer<typeof TicketAnalyticsSchema>;
/**
 * Filter condition for form fields
 */
export declare const FilterConditionSchema: z.ZodObject<{
    type: z.ZodEnum<["ticket", "field", "time"]>;
    ticketId: z.ZodOptional<z.ZodString>;
    fieldId: z.ZodOptional<z.ZodString>;
    operator: z.ZodOptional<z.ZodEnum<["equals", "filled", "notFilled"]>>;
    value: z.ZodOptional<z.ZodString>;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "time" | "ticket" | "field";
    value?: string | undefined;
    ticketId?: string | undefined;
    fieldId?: string | undefined;
    operator?: "equals" | "filled" | "notFilled" | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
}, {
    type: "time" | "ticket" | "field";
    value?: string | undefined;
    ticketId?: string | undefined;
    fieldId?: string | undefined;
    operator?: "equals" | "filled" | "notFilled" | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
}>;
export type FilterCondition = z.infer<typeof FilterConditionSchema>;
/**
 * Field filter configuration
 */
export declare const FieldFilterSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    action: z.ZodEnum<["display", "hide"]>;
    operator: z.ZodEnum<["and", "or"]>;
    conditions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["ticket", "field", "time"]>;
        ticketId: z.ZodOptional<z.ZodString>;
        fieldId: z.ZodOptional<z.ZodString>;
        operator: z.ZodOptional<z.ZodEnum<["equals", "filled", "notFilled"]>>;
        value: z.ZodOptional<z.ZodString>;
        startTime: z.ZodOptional<z.ZodString>;
        endTime: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "time" | "ticket" | "field";
        value?: string | undefined;
        ticketId?: string | undefined;
        fieldId?: string | undefined;
        operator?: "equals" | "filled" | "notFilled" | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
    }, {
        type: "time" | "ticket" | "field";
        value?: string | undefined;
        ticketId?: string | undefined;
        fieldId?: string | undefined;
        operator?: "equals" | "filled" | "notFilled" | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    operator: "and" | "or";
    enabled: boolean;
    action: "display" | "hide";
    conditions: {
        type: "time" | "ticket" | "field";
        value?: string | undefined;
        ticketId?: string | undefined;
        fieldId?: string | undefined;
        operator?: "equals" | "filled" | "notFilled" | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
    }[];
}, {
    operator: "and" | "or";
    enabled: boolean;
    action: "display" | "hide";
    conditions: {
        type: "time" | "ticket" | "field";
        value?: string | undefined;
        ticketId?: string | undefined;
        fieldId?: string | undefined;
        operator?: "equals" | "filled" | "notFilled" | undefined;
        startTime?: string | undefined;
        endTime?: string | undefined;
    }[];
}>;
export type FieldFilter = z.infer<typeof FieldFilterSchema>;
/**
 * Event form field entity
 */
export declare const EventFormFieldSchema: z.ZodObject<{
    id: z.ZodString;
    eventId: z.ZodString;
    order: z.ZodNumber;
    type: z.ZodEnum<["text", "textarea", "select", "checkbox", "radio"]>;
    validater: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodRecord<z.ZodString, z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
    placeholder: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    required: z.ZodBoolean;
    values: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>, "many">>>;
    filters: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        enabled: z.ZodBoolean;
        action: z.ZodEnum<["display", "hide"]>;
        operator: z.ZodEnum<["and", "or"]>;
        conditions: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["ticket", "field", "time"]>;
            ticketId: z.ZodOptional<z.ZodString>;
            fieldId: z.ZodOptional<z.ZodString>;
            operator: z.ZodOptional<z.ZodEnum<["equals", "filled", "notFilled"]>>;
            value: z.ZodOptional<z.ZodString>;
            startTime: z.ZodOptional<z.ZodString>;
            endTime: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }, {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        operator: "and" | "or";
        enabled: boolean;
        action: "display" | "hide";
        conditions: {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }[];
    }, {
        operator: "and" | "or";
        enabled: boolean;
        action: "display" | "hide";
        conditions: {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }[];
    }>>>;
    prompts: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>>;
    enableOther: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    type: "text" | "textarea" | "select" | "checkbox" | "radio";
    id: string;
    name: Record<string, string>;
    eventId: string;
    order: number;
    required: boolean;
    values?: Record<string, string>[] | null | undefined;
    filters?: {
        operator: "and" | "or";
        enabled: boolean;
        action: "display" | "hide";
        conditions: {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }[];
    } | null | undefined;
    description?: Record<string, string> | null | undefined;
    validater?: string | null | undefined;
    placeholder?: string | null | undefined;
    prompts?: Record<string, string[]> | null | undefined;
    enableOther?: boolean | null | undefined;
}, {
    type: "text" | "textarea" | "select" | "checkbox" | "radio";
    id: string;
    name: Record<string, string>;
    eventId: string;
    order: number;
    required: boolean;
    values?: Record<string, string>[] | null | undefined;
    filters?: {
        operator: "and" | "or";
        enabled: boolean;
        action: "display" | "hide";
        conditions: {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }[];
    } | null | undefined;
    description?: Record<string, string> | null | undefined;
    validater?: string | null | undefined;
    placeholder?: string | null | undefined;
    prompts?: Record<string, string[]> | null | undefined;
    enableOther?: boolean | null | undefined;
}>;
export type EventFormField = z.infer<typeof EventFormFieldSchema>;
/**
 * Event form field create request
 */
export declare const EventFormFieldCreateRequestSchema: z.ZodObject<{
    eventId: z.ZodString;
    order: z.ZodNumber;
    type: z.ZodEnum<["text", "textarea", "select", "checkbox", "radio"]>;
    validater: z.ZodOptional<z.ZodString>;
    name: z.ZodRecord<z.ZodString, z.ZodString>;
    description: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    placeholder: z.ZodOptional<z.ZodString>;
    required: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    values: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>, "many">>;
    filters: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        action: z.ZodEnum<["display", "hide"]>;
        operator: z.ZodEnum<["and", "or"]>;
        conditions: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["ticket", "field", "time"]>;
            ticketId: z.ZodOptional<z.ZodString>;
            fieldId: z.ZodOptional<z.ZodString>;
            operator: z.ZodOptional<z.ZodEnum<["equals", "filled", "notFilled"]>>;
            value: z.ZodOptional<z.ZodString>;
            startTime: z.ZodOptional<z.ZodString>;
            endTime: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }, {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        operator: "and" | "or";
        enabled: boolean;
        action: "display" | "hide";
        conditions: {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }[];
    }, {
        operator: "and" | "or";
        enabled: boolean;
        action: "display" | "hide";
        conditions: {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }[];
    }>>;
    prompts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
    enableOther: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "text" | "textarea" | "select" | "checkbox" | "radio";
    name: Record<string, string>;
    eventId: string;
    order: number;
    required: boolean;
    values?: Record<string, string>[] | undefined;
    filters?: {
        operator: "and" | "or";
        enabled: boolean;
        action: "display" | "hide";
        conditions: {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }[];
    } | undefined;
    description?: Record<string, string> | undefined;
    validater?: string | undefined;
    placeholder?: string | undefined;
    prompts?: Record<string, string[]> | undefined;
    enableOther?: boolean | undefined;
}, {
    type: "text" | "textarea" | "select" | "checkbox" | "radio";
    name: Record<string, string>;
    eventId: string;
    order: number;
    values?: Record<string, string>[] | undefined;
    filters?: {
        operator: "and" | "or";
        enabled: boolean;
        action: "display" | "hide";
        conditions: {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }[];
    } | undefined;
    description?: Record<string, string> | undefined;
    validater?: string | undefined;
    placeholder?: string | undefined;
    required?: boolean | undefined;
    prompts?: Record<string, string[]> | undefined;
    enableOther?: boolean | undefined;
}>;
export type EventFormFieldCreateRequest = z.infer<typeof EventFormFieldCreateRequestSchema>;
/**
 * Event form field update request
 */
export declare const EventFormFieldUpdateRequestSchema: z.ZodObject<{
    order: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["text", "textarea", "select", "checkbox", "radio"]>>;
    validater: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    description: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    placeholder: z.ZodOptional<z.ZodString>;
    required: z.ZodOptional<z.ZodBoolean>;
    values: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>, "many">>;
    filters: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        action: z.ZodEnum<["display", "hide"]>;
        operator: z.ZodEnum<["and", "or"]>;
        conditions: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["ticket", "field", "time"]>;
            ticketId: z.ZodOptional<z.ZodString>;
            fieldId: z.ZodOptional<z.ZodString>;
            operator: z.ZodOptional<z.ZodEnum<["equals", "filled", "notFilled"]>>;
            value: z.ZodOptional<z.ZodString>;
            startTime: z.ZodOptional<z.ZodString>;
            endTime: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }, {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        operator: "and" | "or";
        enabled: boolean;
        action: "display" | "hide";
        conditions: {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }[];
    }, {
        operator: "and" | "or";
        enabled: boolean;
        action: "display" | "hide";
        conditions: {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }[];
    }>>;
    prompts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
    enableOther: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    values?: Record<string, string>[] | undefined;
    type?: "text" | "textarea" | "select" | "checkbox" | "radio" | undefined;
    filters?: {
        operator: "and" | "or";
        enabled: boolean;
        action: "display" | "hide";
        conditions: {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }[];
    } | undefined;
    name?: Record<string, string> | undefined;
    description?: Record<string, string> | undefined;
    order?: number | undefined;
    validater?: string | undefined;
    placeholder?: string | undefined;
    required?: boolean | undefined;
    prompts?: Record<string, string[]> | undefined;
    enableOther?: boolean | undefined;
}, {
    values?: Record<string, string>[] | undefined;
    type?: "text" | "textarea" | "select" | "checkbox" | "radio" | undefined;
    filters?: {
        operator: "and" | "or";
        enabled: boolean;
        action: "display" | "hide";
        conditions: {
            type: "time" | "ticket" | "field";
            value?: string | undefined;
            ticketId?: string | undefined;
            fieldId?: string | undefined;
            operator?: "equals" | "filled" | "notFilled" | undefined;
            startTime?: string | undefined;
            endTime?: string | undefined;
        }[];
    } | undefined;
    name?: Record<string, string> | undefined;
    description?: Record<string, string> | undefined;
    order?: number | undefined;
    validater?: string | undefined;
    placeholder?: string | undefined;
    required?: boolean | undefined;
    prompts?: Record<string, string[]> | undefined;
    enableOther?: boolean | undefined;
}>;
export type EventFormFieldUpdateRequest = z.infer<typeof EventFormFieldUpdateRequestSchema>;
/**
 * Event form field reorder request
 */
export declare const EventFormFieldReorderRequestSchema: z.ZodObject<{
    fieldOrders: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        order: number;
    }, {
        id: string;
        order: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    fieldOrders: {
        id: string;
        order: number;
    }[];
}, {
    fieldOrders: {
        id: string;
        order: number;
    }[];
}>;
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
    status: z.ZodEnum<["pending", "confirmed", "cancelled"]>;
    referredBy: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    formData: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    tags: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
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
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: Record<string, string>;
        startDate: string;
        endDate: string;
        slug?: string | null | undefined;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
        location?: string | null | undefined;
    }, {
        id: string;
        name: Record<string, string>;
        startDate: string;
        endDate: string;
        slug?: string | null | undefined;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
        location?: string | null | undefined;
    }>>;
    ticket: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodRecord<z.ZodString, z.ZodString>;
        description: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
        plainDescription: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>;
        price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: Record<string, string>;
        price: number;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
    }, {
        id: string;
        name: Record<string, string>;
        price: number;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
    }>>;
    isUpcoming: z.ZodOptional<z.ZodBoolean>;
    isPast: z.ZodOptional<z.ZodBoolean>;
    canEdit: z.ZodOptional<z.ZodBoolean>;
    canCancel: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "confirmed" | "cancelled";
    email: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    eventId: string;
    ticketId: string;
    formData: Record<string, unknown>;
    ticket?: {
        id: string;
        name: Record<string, string>;
        price: number;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
    } | undefined;
    referredBy?: string | null | undefined;
    tags?: string[] | null | undefined;
    event?: {
        id: string;
        name: Record<string, string>;
        startDate: string;
        endDate: string;
        slug?: string | null | undefined;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
        location?: string | null | undefined;
    } | undefined;
    isUpcoming?: boolean | undefined;
    isPast?: boolean | undefined;
    canEdit?: boolean | undefined;
    canCancel?: boolean | undefined;
}, {
    status: "pending" | "confirmed" | "cancelled";
    email: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    eventId: string;
    ticketId: string;
    formData: Record<string, unknown>;
    ticket?: {
        id: string;
        name: Record<string, string>;
        price: number;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
    } | undefined;
    referredBy?: string | null | undefined;
    tags?: string[] | null | undefined;
    event?: {
        id: string;
        name: Record<string, string>;
        startDate: string;
        endDate: string;
        slug?: string | null | undefined;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
        location?: string | null | undefined;
    } | undefined;
    isUpcoming?: boolean | undefined;
    isPast?: boolean | undefined;
    canEdit?: boolean | undefined;
    canCancel?: boolean | undefined;
}>;
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
}, "strip", z.ZodTypeAny, {
    eventId: string;
    ticketId: string;
    formData: Record<string, unknown>;
    invitationCode?: string | undefined;
    referralCode?: string | undefined;
}, {
    eventId: string;
    ticketId: string;
    formData: Record<string, unknown>;
    invitationCode?: string | undefined;
    referralCode?: string | undefined;
}>;
export type RegistrationCreateRequest = z.infer<typeof RegistrationCreateRequestSchema>;
/**
 * Registration update request
 */
export declare const RegistrationUpdateRequestSchema: z.ZodObject<{
    formData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    status: z.ZodOptional<z.ZodEnum<["pending", "confirmed", "cancelled"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "confirmed" | "cancelled" | undefined;
    formData?: Record<string, unknown> | undefined;
    tags?: string[] | undefined;
}, {
    status?: "pending" | "confirmed" | "cancelled" | undefined;
    formData?: Record<string, unknown> | undefined;
    tags?: string[] | undefined;
}>;
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
    }, "strip", z.ZodTypeAny, {
        status: string;
        email: string;
        id: string;
        ticketName: Record<string, string>;
        registeredAt: string;
    }, {
        status: string;
        email: string;
        id: string;
        ticketName: Record<string, string>;
        registeredAt: string;
    }>, "many">;
    referrerInfo: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: string;
    }, {
        email: string;
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    totalReferrals: number;
    successfulReferrals: number;
    referralList: {
        status: string;
        email: string;
        id: string;
        ticketName: Record<string, string>;
        registeredAt: string;
    }[];
    referrerInfo: {
        email: string;
        id: string;
    };
}, {
    totalReferrals: number;
    successfulReferrals: number;
    referralList: {
        status: string;
        email: string;
        id: string;
        ticketName: Record<string, string>;
        registeredAt: string;
    }[];
    referrerInfo: {
        email: string;
        id: string;
    };
}>;
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
}, "strip", z.ZodTypeAny, {
    code: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    userId: string;
    eventId: string;
    description?: string | null | undefined;
}, {
    code: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    userId: string;
    eventId: string;
    description?: string | null | undefined;
}>;
export type Referral = z.infer<typeof ReferralSchema>;
/**
 * Referral link response
 */
export declare const ReferralLinkSchema: z.ZodObject<{
    id: z.ZodString;
    referralLink: z.ZodString;
    referralCode: z.ZodString;
    eventId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    eventId: string;
    referralCode: string;
    referralLink: string;
}, {
    id: string;
    eventId: string;
    referralCode: string;
    referralLink: string;
}>;
export type ReferralLink = z.infer<typeof ReferralLinkSchema>;
/**
 * Referral validation request
 */
export declare const ReferralValidateRequestSchema: z.ZodObject<{
    code: z.ZodString;
    eventId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    eventId: string;
}, {
    code: string;
    eventId: string;
}>;
export type ReferralValidateRequest = z.infer<typeof ReferralValidateRequestSchema>;
/**
 * Referral validation response
 */
export declare const ReferralValidationSchema: z.ZodObject<{
    isValid: z.ZodBoolean;
    code: z.ZodString;
    referralId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    isValid: boolean;
    referralId: string;
}, {
    code: string;
    isValid: boolean;
    referralId: string;
}>;
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
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    eventId: string;
    referralId: string;
    usedAt: string;
}, {
    id: string;
    userId: string;
    eventId: string;
    referralId: string;
    usedAt: string;
}>;
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
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: string;
        referralCount: number;
    }, {
        email: string;
        id: string;
        referralCount: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    totalReferrals: number;
    successfulReferrals: number;
    conversionRate: number;
    topReferrers: {
        email: string;
        id: string;
        referralCount: number;
    }[];
}, {
    totalReferrals: number;
    successfulReferrals: number;
    conversionRate: number;
    topReferrers: {
        email: string;
        id: string;
        referralCount: number;
    }[];
}>;
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
    }, "strip", z.ZodTypeAny, {
        email: string;
        successfulReferrals: number;
        referralCount: number;
        rank: number;
        registrationId: string;
    }, {
        email: string;
        successfulReferrals: number;
        referralCount: number;
        rank: number;
        registrationId: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    ranking: {
        email: string;
        successfulReferrals: number;
        referralCount: number;
        rank: number;
        registrationId: string;
    }[];
}, {
    ranking: {
        email: string;
        successfulReferrals: number;
        referralCount: number;
        rank: number;
        registrationId: string;
    }[];
}>;
export type ReferralLeaderboard = z.infer<typeof ReferralLeaderboardSchema>;
/**
 * Referral tree
 */
export declare const ReferralTreeSchema: z.ZodObject<{
    root: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        status: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: string;
        email: string;
        id: string;
    }, {
        status: string;
        email: string;
        id: string;
    }>;
    children: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        status: z.ZodString;
        registeredAt: z.ZodString;
        children: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    }, "strip", z.ZodTypeAny, {
        status: string;
        email: string;
        id: string;
        registeredAt: string;
        children?: unknown[] | undefined;
    }, {
        status: string;
        email: string;
        id: string;
        registeredAt: string;
        children?: unknown[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    root: {
        status: string;
        email: string;
        id: string;
    };
    children: {
        status: string;
        email: string;
        id: string;
        registeredAt: string;
        children?: unknown[] | undefined;
    }[];
}, {
    root: {
        status: string;
        email: string;
        id: string;
    };
    children: {
        status: string;
        email: string;
        id: string;
        registeredAt: string;
        children?: unknown[] | undefined;
    }[];
}>;
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
}, "strip", z.ZodTypeAny, {
    email: string;
    id: string;
    referralCount: number;
    isQualified: boolean;
    qualificationThreshold: number;
}, {
    email: string;
    id: string;
    referralCount: number;
    isQualified: boolean;
    qualificationThreshold: number;
}>;
export type QualifiedReferrer = z.infer<typeof QualifiedReferrerSchema>;
/**
 * Draw result
 */
export declare const DrawResultSchema: z.ZodObject<{
    winners: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        referralCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: string;
        referralCount: number;
    }, {
        email: string;
        id: string;
        referralCount: number;
    }>, "many">;
    drawDate: z.ZodString;
    totalParticipants: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    winners: {
        email: string;
        id: string;
        referralCount: number;
    }[];
    drawDate: string;
    totalParticipants: number;
}, {
    winners: {
        email: string;
        id: string;
        referralCount: number;
    }[];
    drawDate: string;
    totalParticipants: number;
}>;
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
}, "strip", z.ZodTypeAny, {
    code: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    ticketId: string;
    usedCount: number;
    name?: string | null | undefined;
    usageLimit?: number | null | undefined;
    validFrom?: string | null | undefined;
    validUntil?: string | null | undefined;
}, {
    code: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    ticketId: string;
    usedCount: number;
    name?: string | null | undefined;
    usageLimit?: number | null | undefined;
    validFrom?: string | null | undefined;
    validUntil?: string | null | undefined;
}>;
export type InvitationCode = z.infer<typeof InvitationCodeSchema>;
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
}, "strip", z.ZodTypeAny, {
    code: string;
    ticketId: string;
    name?: string | undefined;
    usageLimit?: number | undefined;
    validFrom?: string | undefined;
    validUntil?: string | undefined;
}, {
    code: string;
    ticketId: string;
    name?: string | undefined;
    usageLimit?: number | undefined;
    validFrom?: string | undefined;
    validUntil?: string | undefined;
}>;
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
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    ticketId?: string | undefined;
    usageLimit?: number | undefined;
    validFrom?: string | undefined;
    validUntil?: string | undefined;
}, {
    code?: string | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    ticketId?: string | undefined;
    usageLimit?: number | undefined;
    validFrom?: string | undefined;
    validUntil?: string | undefined;
}>;
export type InvitationCodeUpdateRequest = z.infer<typeof InvitationCodeUpdateRequestSchema>;
/**
 * Invitation code verify request
 */
export declare const InvitationCodeVerifyRequestSchema: z.ZodObject<{
    code: z.ZodString;
    ticketId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    ticketId: string;
}, {
    code: string;
    ticketId: string;
}>;
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
    }, "strip", z.ZodTypeAny, {
        code: string;
        id: string;
        usedCount: number;
        expiresAt?: string | undefined;
        description?: string | undefined;
        usageLimit?: number | undefined;
    }, {
        code: string;
        id: string;
        usedCount: number;
        expiresAt?: string | undefined;
        description?: string | undefined;
        usageLimit?: number | undefined;
    }>;
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
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: Record<string, string>;
        price: number;
        quantity: number;
        soldCount: number;
        available: number;
        isOnSale: boolean;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
    }, {
        id: string;
        name: Record<string, string>;
        price: number;
        quantity: number;
        soldCount: number;
        available: number;
        isOnSale: boolean;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    valid: boolean;
    availableTickets: {
        id: string;
        name: Record<string, string>;
        price: number;
        quantity: number;
        soldCount: number;
        available: number;
        isOnSale: boolean;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
    }[];
    invitationCode: {
        code: string;
        id: string;
        usedCount: number;
        expiresAt?: string | undefined;
        description?: string | undefined;
        usageLimit?: number | undefined;
    };
}, {
    valid: boolean;
    availableTickets: {
        id: string;
        name: Record<string, string>;
        price: number;
        quantity: number;
        soldCount: number;
        available: number;
        isOnSale: boolean;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
    }[];
    invitationCode: {
        code: string;
        id: string;
        usedCount: number;
        expiresAt?: string | undefined;
        description?: string | undefined;
        usageLimit?: number | undefined;
    };
}>;
export type InvitationCodeVerification = z.infer<typeof InvitationCodeVerificationSchema>;
/**
 * Target audience filters
 */
export declare const TargetAudienceSchema: z.ZodObject<{
    roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    eventIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    ticketIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    registrationStatuses: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    hasReferrals: z.ZodOptional<z.ZodBoolean>;
    isReferrer: z.ZodOptional<z.ZodBoolean>;
    registeredAfter: z.ZodOptional<z.ZodString>;
    registeredBefore: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    emailDomains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    tags?: string[] | undefined;
    roles?: string[] | undefined;
    eventIds?: string[] | undefined;
    ticketIds?: string[] | undefined;
    registrationStatuses?: string[] | undefined;
    hasReferrals?: boolean | undefined;
    isReferrer?: boolean | undefined;
    registeredAfter?: string | undefined;
    registeredBefore?: string | undefined;
    emailDomains?: string[] | undefined;
}, {
    tags?: string[] | undefined;
    roles?: string[] | undefined;
    eventIds?: string[] | undefined;
    ticketIds?: string[] | undefined;
    registrationStatuses?: string[] | undefined;
    hasReferrals?: boolean | undefined;
    isReferrer?: boolean | undefined;
    registeredAfter?: string | undefined;
    registeredBefore?: string | undefined;
    emailDomains?: string[] | undefined;
}>;
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
        roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        eventIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        ticketIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registrationStatuses: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        hasReferrals: z.ZodOptional<z.ZodBoolean>;
        isReferrer: z.ZodOptional<z.ZodBoolean>;
        registeredAfter: z.ZodOptional<z.ZodString>;
        registeredBefore: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        emailDomains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[] | undefined;
        roles?: string[] | undefined;
        eventIds?: string[] | undefined;
        ticketIds?: string[] | undefined;
        registrationStatuses?: string[] | undefined;
        hasReferrals?: boolean | undefined;
        isReferrer?: boolean | undefined;
        registeredAfter?: string | undefined;
        registeredBefore?: string | undefined;
        emailDomains?: string[] | undefined;
    }, {
        tags?: string[] | undefined;
        roles?: string[] | undefined;
        eventIds?: string[] | undefined;
        ticketIds?: string[] | undefined;
        registrationStatuses?: string[] | undefined;
        hasReferrals?: boolean | undefined;
        isReferrer?: boolean | undefined;
        registeredAfter?: string | undefined;
        registeredBefore?: string | undefined;
        emailDomains?: string[] | undefined;
    }>>>;
    status: z.ZodEnum<["draft", "sent", "scheduled", "sending", "cancelled"]>;
    sentCount: z.ZodNumber;
    totalCount: z.ZodNumber;
    scheduledAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sentAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    user: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        name: string;
    }, {
        email: string;
        name: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    status: "cancelled" | "draft" | "sent" | "scheduled" | "sending";
    id: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    userId: string;
    subject: string;
    content: string;
    sentCount: number;
    totalCount: number;
    user?: {
        email: string;
        name: string;
    } | undefined;
    eventId?: string | null | undefined;
    recipientFilter?: string | null | undefined;
    targetAudience?: {
        tags?: string[] | undefined;
        roles?: string[] | undefined;
        eventIds?: string[] | undefined;
        ticketIds?: string[] | undefined;
        registrationStatuses?: string[] | undefined;
        hasReferrals?: boolean | undefined;
        isReferrer?: boolean | undefined;
        registeredAfter?: string | undefined;
        registeredBefore?: string | undefined;
        emailDomains?: string[] | undefined;
    } | null | undefined;
    scheduledAt?: string | null | undefined;
    sentAt?: string | null | undefined;
}, {
    status: "cancelled" | "draft" | "sent" | "scheduled" | "sending";
    id: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    userId: string;
    subject: string;
    content: string;
    sentCount: number;
    totalCount: number;
    user?: {
        email: string;
        name: string;
    } | undefined;
    eventId?: string | null | undefined;
    recipientFilter?: string | null | undefined;
    targetAudience?: {
        tags?: string[] | undefined;
        roles?: string[] | undefined;
        eventIds?: string[] | undefined;
        ticketIds?: string[] | undefined;
        registrationStatuses?: string[] | undefined;
        hasReferrals?: boolean | undefined;
        isReferrer?: boolean | undefined;
        registeredAfter?: string | undefined;
        registeredBefore?: string | undefined;
        emailDomains?: string[] | undefined;
    } | null | undefined;
    scheduledAt?: string | null | undefined;
    sentAt?: string | null | undefined;
}>;
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
        roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        eventIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        ticketIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registrationStatuses: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        hasReferrals: z.ZodOptional<z.ZodBoolean>;
        isReferrer: z.ZodOptional<z.ZodBoolean>;
        registeredAfter: z.ZodOptional<z.ZodString>;
        registeredBefore: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        emailDomains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[] | undefined;
        roles?: string[] | undefined;
        eventIds?: string[] | undefined;
        ticketIds?: string[] | undefined;
        registrationStatuses?: string[] | undefined;
        hasReferrals?: boolean | undefined;
        isReferrer?: boolean | undefined;
        registeredAfter?: string | undefined;
        registeredBefore?: string | undefined;
        emailDomains?: string[] | undefined;
    }, {
        tags?: string[] | undefined;
        roles?: string[] | undefined;
        eventIds?: string[] | undefined;
        ticketIds?: string[] | undefined;
        registrationStatuses?: string[] | undefined;
        hasReferrals?: boolean | undefined;
        isReferrer?: boolean | undefined;
        registeredAfter?: string | undefined;
        registeredBefore?: string | undefined;
        emailDomains?: string[] | undefined;
    }>>;
    scheduledAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    subject: string;
    content: string;
    eventId?: string | undefined;
    targetAudience?: {
        tags?: string[] | undefined;
        roles?: string[] | undefined;
        eventIds?: string[] | undefined;
        ticketIds?: string[] | undefined;
        registrationStatuses?: string[] | undefined;
        hasReferrals?: boolean | undefined;
        isReferrer?: boolean | undefined;
        registeredAfter?: string | undefined;
        registeredBefore?: string | undefined;
        emailDomains?: string[] | undefined;
    } | undefined;
    scheduledAt?: string | undefined;
}, {
    name: string;
    subject: string;
    content: string;
    eventId?: string | undefined;
    targetAudience?: {
        tags?: string[] | undefined;
        roles?: string[] | undefined;
        eventIds?: string[] | undefined;
        ticketIds?: string[] | undefined;
        registrationStatuses?: string[] | undefined;
        hasReferrals?: boolean | undefined;
        isReferrer?: boolean | undefined;
        registeredAfter?: string | undefined;
        registeredBefore?: string | undefined;
        emailDomains?: string[] | undefined;
    } | undefined;
    scheduledAt?: string | undefined;
}>;
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
        roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        eventIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        ticketIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registrationStatuses: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        hasReferrals: z.ZodOptional<z.ZodBoolean>;
        isReferrer: z.ZodOptional<z.ZodBoolean>;
        registeredAfter: z.ZodOptional<z.ZodString>;
        registeredBefore: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        emailDomains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[] | undefined;
        roles?: string[] | undefined;
        eventIds?: string[] | undefined;
        ticketIds?: string[] | undefined;
        registrationStatuses?: string[] | undefined;
        hasReferrals?: boolean | undefined;
        isReferrer?: boolean | undefined;
        registeredAfter?: string | undefined;
        registeredBefore?: string | undefined;
        emailDomains?: string[] | undefined;
    }, {
        tags?: string[] | undefined;
        roles?: string[] | undefined;
        eventIds?: string[] | undefined;
        ticketIds?: string[] | undefined;
        registrationStatuses?: string[] | undefined;
        hasReferrals?: boolean | undefined;
        isReferrer?: boolean | undefined;
        registeredAfter?: string | undefined;
        registeredBefore?: string | undefined;
        emailDomains?: string[] | undefined;
    }>>;
    scheduledAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    eventId?: string | undefined;
    subject?: string | undefined;
    content?: string | undefined;
    targetAudience?: {
        tags?: string[] | undefined;
        roles?: string[] | undefined;
        eventIds?: string[] | undefined;
        ticketIds?: string[] | undefined;
        registrationStatuses?: string[] | undefined;
        hasReferrals?: boolean | undefined;
        isReferrer?: boolean | undefined;
        registeredAfter?: string | undefined;
        registeredBefore?: string | undefined;
        emailDomains?: string[] | undefined;
    } | undefined;
    scheduledAt?: string | undefined;
}, {
    name?: string | undefined;
    eventId?: string | undefined;
    subject?: string | undefined;
    content?: string | undefined;
    targetAudience?: {
        tags?: string[] | undefined;
        roles?: string[] | undefined;
        eventIds?: string[] | undefined;
        ticketIds?: string[] | undefined;
        registrationStatuses?: string[] | undefined;
        hasReferrals?: boolean | undefined;
        isReferrer?: boolean | undefined;
        registeredAfter?: string | undefined;
        registeredBefore?: string | undefined;
        emailDomains?: string[] | undefined;
    } | undefined;
    scheduledAt?: string | undefined;
}>;
export type EmailCampaignUpdateRequest = z.infer<typeof EmailCampaignUpdateRequestSchema>;
/**
 * Email campaign send request
 */
export declare const EmailCampaignSendRequestSchema: z.ZodObject<{
    sendNow: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    scheduledAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sendNow: boolean;
    scheduledAt?: string | undefined;
}, {
    scheduledAt?: string | undefined;
    sendNow?: boolean | undefined;
}>;
export type EmailCampaignSendRequest = z.infer<typeof EmailCampaignSendRequestSchema>;
/**
 * Email campaign status response
 */
export declare const EmailCampaignStatusResponseSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<["draft", "sent", "scheduled", "sending", "failed"]>;
    totalRecipients: z.ZodNumber;
    sentCount: z.ZodNumber;
    failedCount: z.ZodNumber;
    openCount: z.ZodOptional<z.ZodNumber>;
    clickCount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "sent" | "scheduled" | "sending" | "failed";
    id: string;
    sentCount: number;
    totalRecipients: number;
    failedCount: number;
    openCount?: number | undefined;
    clickCount?: number | undefined;
}, {
    status: "draft" | "sent" | "scheduled" | "sending" | "failed";
    id: string;
    sentCount: number;
    totalRecipients: number;
    failedCount: number;
    openCount?: number | undefined;
    clickCount?: number | undefined;
}>;
export type EmailCampaignStatusResponse = z.infer<typeof EmailCampaignStatusResponseSchema>;
/**
 * Campaign result
 */
export declare const CampaignResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    sentCount: z.ZodNumber;
    failedCount: z.ZodNumber;
    totalRecipients: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    sentCount: number;
    totalRecipients: number;
    failedCount: number;
}, {
    success: boolean;
    sentCount: number;
    totalRecipients: number;
    failedCount: number;
}>;
export type CampaignResult = z.infer<typeof CampaignResultSchema>;
/**
 * Email sender
 */
export declare const EmailSenderSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
}, {
    email: string;
    name: string;
}>;
export type EmailSender = z.infer<typeof EmailSenderSchema>;
/**
 * Email recipient
 */
export declare const EmailRecipientSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
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
    }, "strip", z.ZodTypeAny, {
        id?: string | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        name?: Record<string, string> | undefined;
        isActive?: boolean | undefined;
        slug?: string | null | undefined;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
        location?: string | null | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        ogImage?: string | null | undefined;
        landingPage?: string | null | undefined;
        googleSheetsUrl?: string | null | undefined;
        hideEvent?: boolean | undefined;
        useOpass?: boolean | undefined;
    }, {
        id?: string | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        name?: Record<string, string> | undefined;
        isActive?: boolean | undefined;
        slug?: string | null | undefined;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
        location?: string | null | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        ogImage?: string | null | undefined;
        landingPage?: string | null | undefined;
        googleSheetsUrl?: string | null | undefined;
        hideEvent?: boolean | undefined;
        useOpass?: boolean | undefined;
    }>>;
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
    }, "strip", z.ZodTypeAny, {
        id?: string | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        name?: Record<string, string> | undefined;
        isActive?: boolean | undefined;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
        eventId?: string | undefined;
        order?: number | undefined;
        price?: number | undefined;
        quantity?: number | undefined;
        soldCount?: number | undefined;
        available?: number | undefined;
        saleStart?: string | null | undefined;
        saleEnd?: string | null | undefined;
        isOnSale?: boolean | undefined;
        isSoldOut?: boolean | undefined;
        hidden?: boolean | undefined;
        requireInviteCode?: boolean | undefined;
        requireSmsVerification?: boolean | undefined;
    }, {
        id?: string | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        name?: Record<string, string> | undefined;
        isActive?: boolean | undefined;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
        eventId?: string | undefined;
        order?: number | undefined;
        price?: number | undefined;
        quantity?: number | undefined;
        soldCount?: number | undefined;
        available?: number | undefined;
        saleStart?: string | null | undefined;
        saleEnd?: string | null | undefined;
        isOnSale?: boolean | undefined;
        isSoldOut?: boolean | undefined;
        hidden?: boolean | undefined;
        requireInviteCode?: boolean | undefined;
        requireSmsVerification?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    id: string;
    ticket?: {
        id?: string | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        name?: Record<string, string> | undefined;
        isActive?: boolean | undefined;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
        eventId?: string | undefined;
        order?: number | undefined;
        price?: number | undefined;
        quantity?: number | undefined;
        soldCount?: number | undefined;
        available?: number | undefined;
        saleStart?: string | null | undefined;
        saleEnd?: string | null | undefined;
        isOnSale?: boolean | undefined;
        isSoldOut?: boolean | undefined;
        hidden?: boolean | undefined;
        requireInviteCode?: boolean | undefined;
        requireSmsVerification?: boolean | undefined;
    } | undefined;
    formData?: string | null | undefined;
    event?: {
        id?: string | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        name?: Record<string, string> | undefined;
        isActive?: boolean | undefined;
        slug?: string | null | undefined;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
        location?: string | null | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        ogImage?: string | null | undefined;
        landingPage?: string | null | undefined;
        googleSheetsUrl?: string | null | undefined;
        hideEvent?: boolean | undefined;
        useOpass?: boolean | undefined;
    } | undefined;
}, {
    email: string;
    id: string;
    ticket?: {
        id?: string | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        name?: Record<string, string> | undefined;
        isActive?: boolean | undefined;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
        eventId?: string | undefined;
        order?: number | undefined;
        price?: number | undefined;
        quantity?: number | undefined;
        soldCount?: number | undefined;
        available?: number | undefined;
        saleStart?: string | null | undefined;
        saleEnd?: string | null | undefined;
        isOnSale?: boolean | undefined;
        isSoldOut?: boolean | undefined;
        hidden?: boolean | undefined;
        requireInviteCode?: boolean | undefined;
        requireSmsVerification?: boolean | undefined;
    } | undefined;
    formData?: string | null | undefined;
    event?: {
        id?: string | undefined;
        createdAt?: string | undefined;
        updatedAt?: string | undefined;
        name?: Record<string, string> | undefined;
        isActive?: boolean | undefined;
        slug?: string | null | undefined;
        description?: Record<string, string> | null | undefined;
        plainDescription?: Record<string, string> | null | undefined;
        location?: string | null | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        ogImage?: string | null | undefined;
        landingPage?: string | null | undefined;
        googleSheetsUrl?: string | null | undefined;
        hideEvent?: boolean | undefined;
        useOpass?: boolean | undefined;
    } | undefined;
}>;
export type RecipientData = z.infer<typeof RecipientDataSchema>;
/**
 * Send verification request
 */
export declare const SendVerificationRequestSchema: z.ZodObject<{
    phoneNumber: z.ZodString;
    locale: z.ZodOptional<z.ZodEnum<["zh-Hant", "zh-Hans", "en"]>>;
    turnstileToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phoneNumber: string;
    turnstileToken: string;
    locale?: "zh-Hant" | "zh-Hans" | "en" | undefined;
}, {
    phoneNumber: string;
    turnstileToken: string;
    locale?: "zh-Hant" | "zh-Hans" | "en" | undefined;
}>;
export type SendVerificationRequest = z.infer<typeof SendVerificationRequestSchema>;
/**
 * Verify code request
 */
export declare const VerifyCodeRequestSchema: z.ZodObject<{
    phoneNumber: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    phoneNumber: string;
}, {
    code: string;
    phoneNumber: string;
}>;
export type VerifyCodeRequest = z.infer<typeof VerifyCodeRequestSchema>;
/**
 * TwSMS API response
 */
export declare const TwSMSResponseSchema: z.ZodObject<{
    code: z.ZodString;
    text: z.ZodString;
    msgid: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    text: string;
    msgid?: string | undefined;
}, {
    code: string;
    text: string;
    msgid?: string | undefined;
}>;
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
}, "strip", z.ZodTypeAny, {
    code: string;
    text: string;
    statuscode?: string | undefined;
    statustext?: string | undefined;
    donetime?: string | undefined;
}, {
    code: string;
    text: string;
    statuscode?: string | undefined;
    statustext?: string | undefined;
    donetime?: string | undefined;
}>;
export type TwSMSStatusResponse = z.infer<typeof TwSMSStatusResponseSchema>;
/**
 * SMS send result
 */
export declare const SMSSendResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    msgid: z.ZodString;
    code: z.ZodString;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    text: string;
    success: boolean;
    msgid: string;
}, {
    code: string;
    text: string;
    success: boolean;
    msgid: string;
}>;
export type SMSSendResult = z.infer<typeof SMSSendResultSchema>;
/**
 * Cloudflare Turnstile response
 */
export declare const TurnstileResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    challenge_ts: z.ZodOptional<z.ZodString>;
    hostname: z.ZodOptional<z.ZodString>;
    "error-codes": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    action: z.ZodOptional<z.ZodString>;
    cdata: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        ephemeral_id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        ephemeral_id?: string | undefined;
    }, {
        ephemeral_id?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    action?: string | undefined;
    challenge_ts?: string | undefined;
    hostname?: string | undefined;
    "error-codes"?: string[] | undefined;
    cdata?: string | undefined;
    metadata?: {
        ephemeral_id?: string | undefined;
    } | undefined;
}, {
    success: boolean;
    action?: string | undefined;
    challenge_ts?: string | undefined;
    hostname?: string | undefined;
    "error-codes"?: string[] | undefined;
    cdata?: string | undefined;
    metadata?: {
        ephemeral_id?: string | undefined;
    } | undefined;
}>;
export type TurnstileResponse = z.infer<typeof TurnstileResponseSchema>;
/**
 * Turnstile validation options
 */
export declare const TurnstileValidationOptionsSchema: z.ZodObject<{
    remoteip: z.ZodOptional<z.ZodString>;
    idempotencyKey: z.ZodOptional<z.ZodString>;
    expectedAction: z.ZodOptional<z.ZodString>;
    expectedHostname: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    remoteip?: string | undefined;
    idempotencyKey?: string | undefined;
    expectedAction?: string | undefined;
    expectedHostname?: string | undefined;
}, {
    remoteip?: string | undefined;
    idempotencyKey?: string | undefined;
    expectedAction?: string | undefined;
    expectedHostname?: string | undefined;
}>;
export type TurnstileValidationOptions = z.infer<typeof TurnstileValidationOptionsSchema>;
/**
 * Turnstile validation result
 */
export declare const TurnstileValidationResultSchema: z.ZodObject<{
    valid: z.ZodBoolean;
    reason: z.ZodOptional<z.ZodString>;
    errors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    expected: z.ZodOptional<z.ZodString>;
    received: z.ZodOptional<z.ZodString>;
    data: z.ZodOptional<z.ZodObject<{
        success: z.ZodBoolean;
        challenge_ts: z.ZodOptional<z.ZodString>;
        hostname: z.ZodOptional<z.ZodString>;
        "error-codes": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        action: z.ZodOptional<z.ZodString>;
        cdata: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            ephemeral_id: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            ephemeral_id?: string | undefined;
        }, {
            ephemeral_id?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        success: boolean;
        action?: string | undefined;
        challenge_ts?: string | undefined;
        hostname?: string | undefined;
        "error-codes"?: string[] | undefined;
        cdata?: string | undefined;
        metadata?: {
            ephemeral_id?: string | undefined;
        } | undefined;
    }, {
        success: boolean;
        action?: string | undefined;
        challenge_ts?: string | undefined;
        hostname?: string | undefined;
        "error-codes"?: string[] | undefined;
        cdata?: string | undefined;
        metadata?: {
            ephemeral_id?: string | undefined;
        } | undefined;
    }>>;
    tokenAge: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    valid: boolean;
    expected?: string | undefined;
    received?: string | undefined;
    reason?: string | undefined;
    errors?: string[] | undefined;
    data?: {
        success: boolean;
        action?: string | undefined;
        challenge_ts?: string | undefined;
        hostname?: string | undefined;
        "error-codes"?: string[] | undefined;
        cdata?: string | undefined;
        metadata?: {
            ephemeral_id?: string | undefined;
        } | undefined;
    } | undefined;
    tokenAge?: number | undefined;
}, {
    valid: boolean;
    expected?: string | undefined;
    received?: string | undefined;
    reason?: string | undefined;
    errors?: string[] | undefined;
    data?: {
        success: boolean;
        action?: string | undefined;
        challenge_ts?: string | undefined;
        hostname?: string | undefined;
        "error-codes"?: string[] | undefined;
        cdata?: string | undefined;
        metadata?: {
            ephemeral_id?: string | undefined;
        } | undefined;
    } | undefined;
    tokenAge?: number | undefined;
}>;
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
}, "strip", z.ZodTypeAny, {
    totalRegistrations: number;
    confirmedRegistrations: number;
    pendingRegistrations: number;
    cancelledRegistrations: number;
    checkedInCount: number;
    registrationsByDate: Record<string, unknown>;
    ticketSales: Record<string, unknown>;
    referralStats: Record<string, unknown>;
}, {
    totalRegistrations: number;
    confirmedRegistrations: number;
    pendingRegistrations: number;
    cancelledRegistrations: number;
    checkedInCount: number;
    registrationsByDate: Record<string, unknown>;
    ticketSales: Record<string, unknown>;
    referralStats: Record<string, unknown>;
}>;
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
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: Record<string, string>;
        location: string | null;
        startDate: string;
        endDate: string;
    }, {
        id: string;
        name: Record<string, string>;
        location: string | null;
        startDate: string;
        endDate: string;
    }>;
    stats: z.ZodObject<{
        totalRegistrations: z.ZodNumber;
        confirmedRegistrations: z.ZodNumber;
        pendingRegistrations: z.ZodNumber;
        cancelledRegistrations: z.ZodNumber;
        totalRevenue: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalRegistrations: number;
        confirmedRegistrations: number;
        totalRevenue: number;
        pendingRegistrations: number;
        cancelledRegistrations: number;
    }, {
        totalRegistrations: number;
        confirmedRegistrations: number;
        totalRevenue: number;
        pendingRegistrations: number;
        cancelledRegistrations: number;
    }>;
    tickets: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodRecord<z.ZodString, z.ZodString>;
        price: z.ZodNumber;
        quantity: z.ZodNumber;
        soldCount: z.ZodNumber;
        revenue: z.ZodNumber;
        available: z.ZodNumber;
        salesRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: Record<string, string>;
        price: number;
        quantity: number;
        soldCount: number;
        available: number;
        revenue: number;
        salesRate: number;
    }, {
        id: string;
        name: Record<string, string>;
        price: number;
        quantity: number;
        soldCount: number;
        available: number;
        revenue: number;
        salesRate: number;
    }>, "many">;
    registrationTrends: z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        count: z.ZodNumber;
        confirmed: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        date: string;
        confirmed: number;
        count: number;
    }, {
        date: string;
        confirmed: number;
        count: number;
    }>, "many">;
    referralStats: z.ZodObject<{
        totalReferrals: z.ZodNumber;
        activeReferrers: z.ZodNumber;
        conversionRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalReferrals: number;
        conversionRate: number;
        activeReferrers: number;
    }, {
        totalReferrals: number;
        conversionRate: number;
        activeReferrers: number;
    }>;
}, "strip", z.ZodTypeAny, {
    tickets: {
        id: string;
        name: Record<string, string>;
        price: number;
        quantity: number;
        soldCount: number;
        available: number;
        revenue: number;
        salesRate: number;
    }[];
    event: {
        id: string;
        name: Record<string, string>;
        location: string | null;
        startDate: string;
        endDate: string;
    };
    referralStats: {
        totalReferrals: number;
        conversionRate: number;
        activeReferrers: number;
    };
    stats: {
        totalRegistrations: number;
        confirmedRegistrations: number;
        totalRevenue: number;
        pendingRegistrations: number;
        cancelledRegistrations: number;
    };
    registrationTrends: {
        date: string;
        confirmed: number;
        count: number;
    }[];
}, {
    tickets: {
        id: string;
        name: Record<string, string>;
        price: number;
        quantity: number;
        soldCount: number;
        available: number;
        revenue: number;
        salesRate: number;
    }[];
    event: {
        id: string;
        name: Record<string, string>;
        location: string | null;
        startDate: string;
        endDate: string;
    };
    referralStats: {
        totalReferrals: number;
        conversionRate: number;
        activeReferrers: number;
    };
    stats: {
        totalRegistrations: number;
        confirmedRegistrations: number;
        totalRevenue: number;
        pendingRegistrations: number;
        cancelledRegistrations: number;
    };
    registrationTrends: {
        date: string;
        confirmed: number;
        count: number;
    }[];
}>;
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
    }, "strip", z.ZodTypeAny, {
        message: string;
        field: string;
    }, {
        message: string;
        field: string;
    }>, "many">>;
    validationContext: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    error: string;
    statusCode: number;
    validation?: {
        message: string;
        field: string;
    }[] | undefined;
    validationContext?: string | undefined;
}, {
    code: string;
    message: string;
    error: string;
    statusCode: number;
    validation?: {
        message: string;
        field: string;
    }[] | undefined;
    validationContext?: string | undefined;
}>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
/**
 * Form validation rules
 */
export declare const FormValidationRulesSchema: z.ZodObject<{
    required: z.ZodOptional<z.ZodBoolean>;
    minLength: z.ZodOptional<z.ZodNumber>;
    maxLength: z.ZodOptional<z.ZodNumber>;
    pattern: z.ZodOptional<z.ZodUnion<[z.ZodType<RegExp, z.ZodTypeDef, RegExp>, z.ZodString]>>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    min: z.ZodOptional<z.ZodNumber>;
    max: z.ZodOptional<z.ZodNumber>;
    options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    customMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    options?: string[] | undefined;
    email?: string | undefined;
    min?: number | undefined;
    max?: number | undefined;
    minLength?: number | undefined;
    maxLength?: number | undefined;
    required?: boolean | undefined;
    pattern?: string | RegExp | undefined;
    phone?: string | undefined;
    customMessage?: string | undefined;
}, {
    options?: string[] | undefined;
    email?: string | undefined;
    min?: number | undefined;
    max?: number | undefined;
    minLength?: number | undefined;
    maxLength?: number | undefined;
    required?: boolean | undefined;
    pattern?: string | RegExp | undefined;
    phone?: string | undefined;
    customMessage?: string | undefined;
}>;
export type FormValidationRules = z.infer<typeof FormValidationRulesSchema>;
/**
 * Field validation error
 */
export declare const FieldValidationErrorSchema: z.ZodObject<{
    field: z.ZodString;
    messages: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    field: string;
    messages: string[];
}, {
    field: string;
    messages: string[];
}>;
export type FieldValidationError = z.infer<typeof FieldValidationErrorSchema>;
/**
 * Validation result
 */
export declare const ValidationResultSchema: z.ZodObject<{
    isValid: z.ZodBoolean;
    errors: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    isValid: boolean;
    errors: Record<string, string[]>;
}, {
    isValid: boolean;
    errors: Record<string, string[]>;
}>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
/**
 * Export data response
 */
export declare const ExportDataSchema: z.ZodObject<{
    downloadUrl: z.ZodString;
    filename: z.ZodString;
    count: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    count: number;
    downloadUrl: string;
    filename: string;
}, {
    count: number;
    downloadUrl: string;
    filename: string;
}>;
export type ExportData = z.infer<typeof ExportDataSchema>;
/**
 * Health status
 */
export declare const HealthStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["ok", "error"]>;
    timestamp: z.ZodString;
    version: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "error" | "ok";
    timestamp: string;
    version?: string | undefined;
}, {
    status: "error" | "ok";
    timestamp: string;
    version?: string | undefined;
}>;
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
}, "strip", z.ZodTypeAny, {
    host: string;
    port: number;
    password?: string | undefined;
    username?: string | undefined;
    db?: number | undefined;
}, {
    host: string;
    port: number;
    password?: string | undefined;
    username?: string | undefined;
    db?: number | undefined;
}>;
export type RedisClientConfig = z.infer<typeof RedisClientConfigSchema>;
