import type { LocalizedText } from "../schemas/common";

/**
 * API Response Types
 * These types represent the shape of data returned from API endpoints
 * Separate from request schemas (which use Zod for validation)
 */

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
	user: UserResponse | null;
}

// ====================
// User Response Types
// ====================

export interface UserResponse {
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

export interface EventResponse {
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

export interface EventInfoResponse extends EventResponse {
	test?: string;
}

export interface EventListItemResponse extends EventResponse {
	ticketCount: number;
	registrationCount: number;
	hasAvailableTickets: boolean;
}

export interface EventStatsResponse {
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

export interface TicketResponse {
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

export interface TicketAnalyticsResponse {
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

export interface EventFormFieldResponse {
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

/** @deprecated Use EventFormFieldResponse instead */
export type TicketFormFieldResponse = EventFormFieldResponse;

// ====================
// Registration Response Types
// ====================

export interface RegistrationResponse {
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

export interface ReferralLinkResponse {
	id: string;
	referralLink: string;
	referralCode: string;
	eventId: string;
}

export interface ReferralValidationResponse {
	isValid: boolean;
	code: string;
	referralId: string;
}

export interface RegistrationStatsResponse {
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

export interface ReferralOverviewResponse {
	totalReferrals: number;
	successfulReferrals: number;
	conversionRate: number;
	topReferrers: Array<{
		id: string;
		email: string;
		referralCount: number;
	}>;
}

export interface ReferralLeaderboardResponse {
	ranking: Array<{
		rank: number;
		registrationId: string;
		email: string;
		referralCount: number;
		successfulReferrals: number;
	}>;
}

export interface ReferralTreeResponse {
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

export interface QualifiedReferrerResponse {
	id: string;
	email: string;
	referralCount: number;
	isQualified: boolean;
	qualificationThreshold: number;
}

export interface DrawResultResponse {
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

export interface InvitationCodeResponse {
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

export interface InvitationCodeInfoResponse extends InvitationCodeResponse {
	description?: string;
	expiresAt?: string;
}

export interface InvitationCodeVerificationResponse {
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

export interface EventDashboardDataResponse {
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

export interface EmailCampaignResponse {
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

export interface EmailCampaignStatusResponse {
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

export interface ExportDataResponse {
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
// Legacy Compatibility Types (for backwards compatibility)
// ====================

/** @deprecated Use UserResponse instead */
export type User = UserResponse;

/** @deprecated Use EventResponse instead */
export type Event = EventResponse;

/** @deprecated Use EventInfoResponse instead */
export type EventInfo = EventInfoResponse;

/** @deprecated Use EventListItemResponse instead */
export type EventListItem = EventListItemResponse;

/** @deprecated Use EventStatsResponse instead */
export type EventStats = EventStatsResponse;

/** @deprecated Use TicketResponse instead */
export type Ticket = TicketResponse;

/** @deprecated Use TicketAnalyticsResponse instead */
export type TicketAnalytics = TicketAnalyticsResponse;

/** @deprecated Use EventFormFieldResponse instead */
export type EventFormField = EventFormFieldResponse;

/** @deprecated Use EventFormFieldResponse instead */
export type TicketFormField = EventFormFieldResponse;

/** @deprecated Use RegistrationResponse instead */
export type Registration = RegistrationResponse;

/** @deprecated Use ReferralLinkResponse instead */
export type ReferralLink = ReferralLinkResponse;

/** @deprecated Use ReferralValidationResponse instead */
export type ReferralValidation = ReferralValidationResponse;

/** @deprecated Use RegistrationStatsResponse instead */
export type RegistrationStats = RegistrationStatsResponse;

/** @deprecated Use InvitationCodeInfoResponse instead */
export type InvitationCodeInfo = InvitationCodeInfoResponse;

/** @deprecated Use InvitationCodeVerificationResponse instead */
export type InvitationCodeVerification = InvitationCodeVerificationResponse;

/** @deprecated Use EventDashboardDataResponse instead */
export type EventDashboardData = EventDashboardDataResponse;

/** @deprecated Use EmailCampaignResponse instead */
export type EmailCampaign = EmailCampaignResponse;

/** @deprecated Use ExportDataResponse instead */
export type ExportData = ExportDataResponse;
