/**
 * API request/response type definitions
 */

export interface ApiResponse<T = any> {
	success: boolean;
	message: string;
	data: T;
	pagination?: Pagination | null;
}

export interface ApiErrorResponse {
	success: false;
	error: ApiError;
}

export interface ApiError {
	code: string;
	message: string;
	details?: any;
}

export interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface PaginationQuery {
	page?: number;
	limit?: number;
}

export interface EventCreateRequest {
	name: string;
	description?: string;
	plainDescription?: string;
	startDate: string;
	endDate: string;
	location?: string;
	ogImage?: string;
}

export interface EventUpdateRequest {
	name?: string;
	description?: string;
	plainDescription?: string;
	startDate?: string;
	endDate?: string;
	location?: string;
	ogImage?: string;
	isActive?: boolean;
}

export interface RegistrationCreateRequest {
	eventId: string;
	ticketId: string;
	invitationCode?: string;
	referralCode?: string;
	formData: Record<string, any>;
}

export interface RegistrationUpdateRequest {
	formData?: Record<string, any>;
	status?: import("./database.js").RegistrationStatus;
}

export interface TicketCreateRequest {
	eventId: string;
	name: string;
	description?: string;
	price: number;
	quantity: number;
	saleStart?: string;
	saleEnd?: string;
	requireInviteCode?: boolean;
	hidden?: boolean;
}

export interface TicketUpdateRequest {
	name?: string;
	description?: string;
	price?: number;
	quantity?: number;
	saleStart?: string;
	saleEnd?: string;
	isActive?: boolean;
	requireInviteCode?: boolean;
}

export interface InvitationCodeCreateRequest {
	eventId: string;
	code: string;
	name?: string;
	usageLimit?: number;
	validFrom?: string;
	validUntil?: string;
	ticketId?: string;
}

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

export interface InvitationCodeUpdateRequest {
	code?: string;
	name?: string;
	usageLimit?: number;
	validFrom?: string;
	validUntil?: string;
	isActive?: boolean;
	ticketId?: string;
}

export interface EmailCampaignCreateRequest {
	name: string;
	subject: string;
	content: string;
	eventId?: string;
	targetAudience?: TargetAudience;
	scheduledAt?: string;
}

export interface TargetAudience {
	roles?: string[];
	eventIds?: string[];
	registrationStatuses?: string[];
	tags?: string[];
}

export type SortOrder = "asc" | "desc";

export interface SearchQuery {
	q?: string;
	sortBy?: string;
	sortOrder?: SortOrder;
	filters?: Record<string, any>;
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

export type FormFieldType = "text" | "textarea" | "select" | "checkbox" | "radio";

export interface EventFormFieldCreateRequest {
	eventId: string;
	order: number;
	type: FormFieldType;
	validater?: string;
	name: string;
	description: string;
	placeholder?: string;
	required?: boolean;
	values?: string;
	filters?: string;
}

export interface EventFormFieldUpdateRequest {
	order?: number;
	type?: FormFieldType;
	validater?: string;
	name?: string;
	description?: string;
	placeholder?: string;
	required?: boolean;
	values?: string;
	filters?: string;
}

export interface InvitationCodeVerifyRequest {
	code: string;
	ticketId: string;
}

export interface ReferralValidateRequest {
	code: string;
	eventId: string;
}
