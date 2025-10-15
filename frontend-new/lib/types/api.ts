// Base API Response Types
export interface ApiResponse<T> {
	success: boolean;
	message: string;
	data: T;
}

export interface ApiError {
	success: false;
	error: {
		code: string;
		message: string;
		details?: unknown;
	};
}

export interface PaginatedResponse<T> {
	success: boolean;
	message: string;
	data: T[];
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface SessionResponse {
	session: object | null;
	user: User | null;
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

// System
export interface HealthStatus {
	status: "ok" | "error";
	timestamp: string;
	version?: string;
}

// User Types
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

// Localized Text Type
export type LocalizedText = Record<string, string>; // e.g., { "en": "SITCON 2026", "zh-Hant": "學生計算機年會 2026" }

// Event Types
export interface Event {
	id: string;
	name: LocalizedText;
	description?: LocalizedText;
	location?: string;
	startDate: string;
	endDate: string;
	ogImage?: string;
	landingPage?: string;
	isActive: boolean;
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

// Ticket Types
export interface Ticket {
	id: string;
	eventId?: string;
	name: LocalizedText;
	description?: LocalizedText;
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

export interface TicketFormField {
	id: string;
	ticketId: string;
	order: number;
	type: "text" | "email" | "textarea" | "select" | "checkbox" | "radio";
	validater?: string;
	name: LocalizedText;
	description?: string;
	placeholder?: string;
	required: boolean;
	values?: LocalizedText[]; // Array of localized objects, e.g., [{ "en": "Option 1" }, { "en": "Option 2" }]
	options?: LocalizedText[]; // Parsed options for frontend use
	helpText?: string;
}

export interface TicketFormFieldReorder {
	fieldOrders: Array<{
		id: string;
		order: number;
	}>;
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

// Registration Types
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
		location?: string;
		startDate: string;
		endDate: string;
		ogImage?: string | null;
	};
	ticket?: {
		id: string;
		name: LocalizedText;
		description?: LocalizedText;
		price: number;
	};
	isUpcoming?: boolean;
	isPast?: boolean;
	canEdit?: boolean;
	canCancel?: boolean;
}

export interface RegistrationCreate {
	eventId: string;
	ticketId: string;
	invitationCode?: string;
	referralCode?: string;
	formData: Record<string, unknown>;
}

// Referral Types
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

// Invitation Code Types
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
		price: number;
		quantity: number;
		soldCount: number;
		available: number;
		isOnSale: boolean;
	}>;
}

// Analytics Types
export interface DashboardData {
	totalRegistrations: number;
	confirmedRegistrations: number;
	pendingRegistrations: number;
	cancelledRegistrations: number;
	checkedInCount: number;
	totalRevenue: number;
	registrationsByDate: Record<string, number>;
	ticketSales: Record<string, number>;
	referralStats: Record<string, unknown>;
}

export interface RegistrationTrend {
	date: string;
	count: number;
	revenue?: number;
	eventId?: string;
	eventName?: string;
}

export interface ReferralSource {
	source: string;
	count: number;
	percentage: number;
}

// Email Campaign Types
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

// Referral Admin Types
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

// Export Data Types
export interface ExportData {
	downloadUrl: string;
	filename: string;
	count: number;
}

// Form Validation
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
