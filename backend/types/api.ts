/**
 * API request/response type definitions
 *
 * Most request types are now imported from @tickets/shared
 * This file only contains backend-specific response types
 */

// Import all request types and common types from shared package
import type {
	// Common types
	ApiResponse,
	ApiErrorResponse,
	ApiError,
	Pagination,
	PaginationQuery,
	SortOrder,
	SearchQuery,
	FormFieldType,
	// Event types
	EventCreateRequest,
	EventUpdateRequest,
	EventFormFieldCreateRequest,
	EventFormFieldUpdateRequest,
	// Ticket types
	TicketCreateRequest,
	TicketUpdateRequest,
	TicketReorderRequest,
	// Registration types
	RegistrationCreateRequest,
	RegistrationUpdateRequest,
	// Invitation code types
	InvitationCodeCreateRequest,
	InvitationCodeUpdateRequest,
	InvitationCodeVerifyRequest,
	// Email campaign types
	EmailCampaignCreateRequest,
	TargetAudience,
	// Referral types
	ReferralValidateRequest,
} from "@tickets/shared";

// Re-export for backward compatibility
export type {
	// Common types
	ApiResponse,
	ApiErrorResponse,
	ApiError,
	Pagination,
	PaginationQuery,
	SortOrder,
	SearchQuery,
	FormFieldType,
	// Event types
	EventCreateRequest,
	EventUpdateRequest,
	EventFormFieldCreateRequest,
	EventFormFieldUpdateRequest,
	// Ticket types
	TicketCreateRequest,
	TicketUpdateRequest,
	TicketReorderRequest,
	// Registration types
	RegistrationCreateRequest,
	RegistrationUpdateRequest,
	// Invitation code types
	InvitationCodeCreateRequest,
	InvitationCodeUpdateRequest,
	InvitationCodeVerifyRequest,
	// Email campaign types
	EmailCampaignCreateRequest,
	TargetAudience,
	// Referral types
	ReferralValidateRequest,
};

/**
 * Backend-specific response types
 * These are not in the shared package as they are only used by the backend
 */

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
