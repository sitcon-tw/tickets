/**
 * Frontend API type definitions
 *
 * REQUEST TYPES: Imported from @tickets/shared (validated with Zod)
 * RESPONSE TYPES: Defined here (API responses with serialized data)
 */

// ====================
// Re-export Common Types & Request Schemas from Shared
// ====================

export type {
	// Common utilities
	ApiResponse,
	ApiError,
	LocalizedText,
	Pagination,
	PaginationQuery,
	SearchQuery,
	SortOrder,

	// Enums
	RegistrationStatus,
	Role,

	// Request schemas (for forms/API calls)
	EventCreateRequest,
	EventUpdateRequest,
	TicketCreateRequest,
	TicketUpdateRequest,
	TicketReorderRequest,
	EventFormFieldCreateRequest,
	EventFormFieldUpdateRequest,
	EventFormFieldReorderRequest,
	RegistrationCreateRequest,
	RegistrationUpdateRequest,
	InvitationCodeCreateRequest,
	InvitationCodeUpdateRequest,
	InvitationCodeVerifyRequest,
	InvitationCodeBulkCreateRequest,
	InvitationCodeSendEmailRequest,
	EmailCampaignCreateRequest,
	UserCreateRequest,
	AdminUserUpdateRequest,
	ProfileUpdateRequest,
	ReferralValidateRequest,
} from "@tickets/shared";

import type { LocalizedText } from "@tickets/shared";

// ====================
// System & Health Response Types
// ====================

export interface HealthStatus {
	status: "ok" | "error";
	timestamp: string;
	version?: string;
}

export interface UserCapabilities {
	canManageUsers: boolean;
	canManageAllEvents: boolean;
	canViewAnalytics: boolean;
	canManageEmailCampaigns: boolean;
	canManageReferrals: boolean;
	canManageSmsLogs: boolean;
	managedEventIds: string[];
}

export interface PermissionsResponse {
	role: "admin" | "viewer" | "eventAdmin";
	permissions: string[];
	capabilities: UserCapabilities;
}

export interface SessionResponse {
	session: object | null;
	user: User | null;
}

// ====================
// User Response Types
// ====================

export interface User {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image?: string;
	role: "admin" | "viewer" | "eventAdmin";
	permissions: string[];
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// ====================
// Event Response Types
// ====================

export interface Event {
	id: string;
	slug?: string;
	name: LocalizedText;
	description?: LocalizedText;
	plainDescription?: LocalizedText;
	location?: string;
	startDate: string;
	endDate: string;
	ogImage?: string;
	landingPage?: string;
	googleSheetsUrl?: string;
	isActive: boolean;
	hideEvent?: boolean;
	useOpass?: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface EventInfo extends Event {
	test?: string;
}

export interface EventListItem extends Event {
	ticketCount: number;
	registrationCount: number;
	hasAvailableTickets: boolean;
}

export interface EventStats {
	eventName: string;
	totalRegistrations: number;
	confirmedRegistrations: number;
	totalTickets: number;
	availableTickets: number;
	registrationRate: number;
}

// ====================
// Ticket Response Types
// ====================

export interface Ticket {
	id: string;
	eventId?: string;
	order?: number;
	name: LocalizedText;
	description?: LocalizedText;
	plainDescription?: LocalizedText;
	price: number;
	quantity: number;
	soldCount: number;
	available?: number;
	saleStart?: string;
	saleEnd?: string;
	isOnSale?: boolean;
	isSoldOut?: boolean;
	isActive?: boolean;
	hidden?: boolean;
	createdAt?: string;
	updatedAt?: string;
	requireInviteCode?: boolean;
	requireSmsVerification?: boolean;
}

export interface TicketAnalytics {
	totalsoldCount: number;
	totalRevenue: number;
	availableQuantity: number;
	salesByStatus: Record<string, number>;
	dailySales: Array<{
		date: string;
		count: number;
		revenue: number;
	}>;
}

// ====================
// Form Field Response Types
// ====================

export interface FilterCondition {
	type: "ticket" | "field" | "time";
	ticketId?: string;
	fieldId?: string;
	operator?: "equals" | "filled" | "notFilled";
	value?: string;
	startTime?: string;
	endTime?: string;
}

export interface FieldFilter {
	enabled: boolean;
	action: "display" | "hide";
	operator: "and" | "or";
	conditions: FilterCondition[];
}

export interface EventFormField {
	id: string;
	eventId: string;
	order: number;
	type: "text" | "textarea" | "select" | "checkbox" | "radio";
	validater?: string;
	name: LocalizedText;
	description?: LocalizedText;
	placeholder?: string;
	required: boolean;
	values?: LocalizedText[];
	options?: LocalizedText[];
	filters?: FieldFilter;
	prompts?: Record<string, string[]>;
}

/** @deprecated Use EventFormField instead */
export type TicketFormField = EventFormField;

// ====================
// Registration Response Types
// ====================

export interface Registration {
	id: string;
	eventId: string;
	ticketId: string;
	email: string;
	status: "confirmed" | "cancelled" | "pending";
	referredBy?: string;
	formData: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
	event?: {
		id: string;
		name: LocalizedText;
		description?: LocalizedText;
		plainDescription?: LocalizedText;
		location?: string;
		startDate: string;
		endDate: string;
		slug?: string;
	};
	ticket?: {
		id: string;
		name: LocalizedText;
		description?: LocalizedText;
		plainDescription?: LocalizedText;
		price: number;
	};
	isUpcoming?: boolean;
	isPast?: boolean;
	canEdit?: boolean;
	canCancel?: boolean;
}

// ====================
// Referral Response Types
// ====================

export interface ReferralLink {
	id: string;
	referralLink: string;
	referralCode: string;
	eventId: string;
}

export interface ReferralValidation {
	isValid: boolean;
	code: string;
	referralId: string;
}

export interface RegistrationStats {
	totalReferrals: number;
	successfulReferrals: number;
	referralList: Array<{
		id: string;
		status: string;
		ticketName: LocalizedText;
		registeredAt: string;
		email: string;
	}>;
	referrerInfo: {
		id: string;
		email: string;
	};
}

export interface ReferralOverview {
	totalReferrals: number;
	successfulReferrals: number;
	conversionRate: number;
	topReferrers: Array<{
		id: string;
		email: string;
		referralCount: number;
	}>;
}

export interface ReferralLeaderboard {
	ranking: Array<{
		rank: number;
		registrationId: string;
		email: string;
		referralCount: number;
		successfulReferrals: number;
	}>;
}

export interface ReferralTree {
	root: {
		id: string;
		email: string;
		status: string;
	};
	children: Array<{
		id: string;
		email: string;
		status: string;
		registeredAt: string;
		children?: unknown[];
	}>;
}

export interface QualifiedReferrer {
	id: string;
	email: string;
	referralCount: number;
	isQualified: boolean;
	qualificationThreshold: number;
}

export interface DrawResult {
	winners: Array<{
		id: string;
		email: string;
		referralCount: number;
	}>;
	drawDate: string;
	totalParticipants: number;
}

// ====================
// Invitation Code Response Types
// ====================

export interface InvitationCode {
	id: string;
	ticketId: string;
	code: string;
	name?: string;
	usageLimit?: number;
	usedCount: number;
	validFrom?: string;
	validUntil?: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface InvitationCodeInfo extends InvitationCode {
	description?: string;
	expiresAt?: string;
}

export interface InvitationCodeVerification {
	valid: boolean;
	invitationCode: {
		id: string;
		code: string;
		description?: string;
		usedCount: number;
		usageLimit?: number;
		expiresAt?: string;
	};
	availableTickets: Array<{
		id: string;
		name: LocalizedText;
		description?: LocalizedText;
		plainDescription?: LocalizedText;
		price: number;
		quantity: number;
		soldCount: number;
		available: number;
		isOnSale: boolean;
	}>;
}

// ====================
// Analytics & Dashboard Response Types
// ====================

export interface EventDashboardData {
	event: {
		id: string;
		name: LocalizedText;
		startDate: string;
		endDate: string;
		location: string | null;
	};
	stats: {
		totalRegistrations: number;
		confirmedRegistrations: number;
		pendingRegistrations: number;
		cancelledRegistrations: number;
		totalRevenue: number;
	};
	tickets: Array<{
		id: string;
		name: LocalizedText;
		price: number;
		quantity: number;
		soldCount: number;
		revenue: number;
		available: number;
		salesRate: number;
	}>;
	registrationTrends: Array<{
		date: string;
		count: number;
		confirmed: number;
	}>;
	referralStats: {
		totalReferrals: number;
		activeReferrers: number;
		conversionRate: number;
	};
}

// ====================
// Email Campaign Response Types
// ====================

export interface EmailCampaign {
	id: string;
	userId: string;
	name: string;
	subject: string;
	content: string;
	recipientFilter?: string;
	targetAudience?: {
		roles?: string[];
		eventIds?: string[];
		ticketIds?: string[];
		registrationStatuses?: string[];
		hasReferrals?: boolean;
		isReferrer?: boolean;
		registeredAfter?: string;
		registeredBefore?: string;
		tags?: string[];
		emailDomains?: string[];
	};
	status: "draft" | "sent" | "scheduled" | "sending" | "cancelled";
	sentCount: number;
	totalCount: number;
	scheduledAt?: string;
	sentAt?: string;
	createdAt: string;
	updatedAt: string;
	user?: {
		name: string;
		email: string;
	};
}

export interface EmailCampaignStatus {
	id: string;
	status: "draft" | "sent" | "scheduled" | "sending" | "failed";
	totalRecipients: number;
	sentCount: number;
	failedCount: number;
	openCount?: number;
	clickCount?: number;
}

// ====================
// Export Data Response Types
// ====================

export interface ExportData {
	downloadUrl: string;
	filename: string;
	count: number;
}

// ====================
// Validation Error Types
// ====================

export interface ValidationError {
	statusCode: number;
	code: string;
	error: string;
	message: string;
	validation?: Array<{
		field: string;
		message: string;
	}>;
	validationContext?: string;
}

// ====================
// Legacy/Compatibility Types
// ====================

/** @deprecated Use RegistrationCreateRequest from @tickets/shared instead */
export interface RegistrationCreate {
	eventId: string;
	ticketId: string;
	invitationCode?: string;
	referralCode?: string;
	formData: Record<string, unknown>;
}

/** @deprecated Use ApiResponse<T[]> with pagination instead */
export interface PaginatedResponse<T> {
	success: boolean;
	message: string;
	data: T[];
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext?: boolean;
		hasPrev?: boolean;
	};
}
