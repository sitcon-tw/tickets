/**
 * Re-export shared types from @tickets/shared
 * This file provides a single import point for shared types in the frontend
 */

// Export all shared schemas and types
export * from "@tickets/shared";

// Re-export commonly used types with aliases for convenience
export type {
	ApiResponse,
	Pagination,
	PaginationQuery,
	SortOrder,
	SearchQuery,
	LocalizedText,
	EventCreateRequest,
	EventUpdateRequest,
	FormFieldType,
	EventFormFieldCreateRequest,
	EventFormFieldUpdateRequest,
	TicketCreateRequest,
	TicketUpdateRequest,
	TicketReorderRequest,
	RegistrationStatus,
	RegistrationCreateRequest,
	RegistrationUpdateRequest,
	InvitationCodeCreateRequest,
	InvitationCodeUpdateRequest,
	InvitationCodeVerifyRequest,
	ReferralValidateRequest,
	TargetAudience,
	EmailCampaignCreateRequest,
} from "@tickets/shared";
