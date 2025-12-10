import { fetchGravatarName } from "@/lib/gravatar";
import type {
	ApiResponse,
	DashboardData,
	EmailCampaign,
	Event,
	EventFormField,
	EventFormFieldReorder,
	EventInfo,
	EventListItem,
	EventStats,
	ExportData,
	HealthStatus,
	InvitationCodeInfo,
	InvitationCodeVerification,
	LocalizedText,
	PermissionsResponse,
	ReferralLink,
	ReferralValidation,
	Registration,
	RegistrationStats,
	RegistrationTrend,
	SessionResponse,
	Ticket,
	TicketAnalytics,
	TicketFormField,
	TicketReorder,
	User
} from "@/lib/types/api";
import { apiClient } from "./client";

// System
export const healthAPI = {
	check: (): Promise<HealthStatus> => apiClient.get("/system/health")
};

// Auth (handled by BetterAuth)
export const authAPI = {
	getMagicLink: async (email: string, locale?: string, returnUrl?: string) => {
		const gravatarName = await fetchGravatarName(email);
		const name = gravatarName || email.split("@")[0];

		return apiClient.post("/api/auth/sign-in/magic-link", {
			email,
			name,
			callbackURL: returnUrl ? `${window.location.origin}${returnUrl}` : `${window.location.origin}/${locale || "zh-Hant"}/`,
			newUserCallbackURL: returnUrl ? `${window.location.origin}${returnUrl}` : `${window.location.origin}/${locale || "zh-Hant"}/`,
			errorCallbackURL: `${window.location.origin}/${locale || "zh-Hant"}/login/${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`
		});
	},
	getSession: () => apiClient.get<SessionResponse>("/api/auth/get-session"),
	getPermissions: () => apiClient.get<ApiResponse<PermissionsResponse>>("/api/auth/permissions"),
	signOut: () => apiClient.post("/api/auth/sign-out")
};

// Events - Public
export const eventsAPI = {
	getAll: (params?: { isActive?: boolean; upcoming?: boolean }) => apiClient.get<ApiResponse<EventListItem[]>>("/api/events", params),

	getInfo: (id: string) => apiClient.get<ApiResponse<EventInfo>>(`/api/events/${id}/info`),

	getTickets: (id: string) => apiClient.get<ApiResponse<Ticket[]>>(`/api/events/${id}/tickets`),

	getStats: (id: string) => apiClient.get<ApiResponse<EventStats>>(`/api/events/${id}/stats`)
};

// Tickets - Public
export const ticketsAPI = {
	getTicket: (id: string) => apiClient.get<ApiResponse<Ticket>>(`/api/tickets/${id}`),

	getFormFields: (id: string) => apiClient.get<ApiResponse<TicketFormField[]>>(`/api/tickets/${id}/form-fields`)
};

// Registrations - Requires Auth
export const registrationsAPI = {
	create: (data: { eventId: string; ticketId: string; invitationCode?: string; referralCode?: string; formData: Record<string, unknown> }) =>
		apiClient.post<ApiResponse<Registration>>("/api/registrations", data),

	getAll: () => apiClient.get<ApiResponse<Registration[]>>("/api/registrations"),

	getById: (id: string) => apiClient.get<ApiResponse<Registration>>(`/api/registrations/${id}`),

	update: (id: string, data: Record<string, unknown>) => apiClient.put<ApiResponse<Registration>>(`/api/registrations/${id}`, data),

	cancel: (id: string) => apiClient.put<ApiResponse<Registration>>(`/api/registrations/${id}/cancel`)
};

// Referrals - Requires Auth
export const referralsAPI = {
	getReferralLink: (regId: string) => apiClient.get<ApiResponse<ReferralLink>>(`/api/registrations/${regId}/referral-link`),

	getStats: (regId: string) => apiClient.get<ApiResponse<RegistrationStats>>(`/api/registrations/referral-stats/${regId}`),

	validate: (data: { code: string; eventId: string }) => apiClient.post<ApiResponse<ReferralValidation>>("/api/referrals/validate", data)
};

// Invitation Codes - Public
export const invitationCodesAPI = {
	verify: (data: { code: string; ticketId: string }) => apiClient.post<ApiResponse<InvitationCodeVerification>>("/api/invitation-codes/verify", data),

	getInfo: (code: string, ticketId: string) => apiClient.get<ApiResponse<InvitationCodeInfo>>(`/api/invitation-codes/${code}/info`, { ticketId })
};

// User // Admin - Analytics
export const adminAnalyticsAPI = {
	getDashboard: () => apiClient.get<ApiResponse<DashboardData>>("/api/admin/dashboard"),

	getReferralSources: () => apiClient.get<ApiResponse<unknown>>("/api/admin/referral-sources"),

	getRegistrationTrends: (params?: { period?: "daily" | "weekly" | "monthly"; eventId?: string }) => apiClient.get<ApiResponse<RegistrationTrend[]>>("/api/admin/registration-trends", params)
};

// Admin - Users
export const adminUsersAPI = {
	getAll: (params?: { role?: "admin" | "viewer" | "eventAdmin"; isActive?: boolean }) => apiClient.get<ApiResponse<User[]>>("/api/admin/users", params),

	getById: (id: string) => apiClient.get<ApiResponse<User>>(`/api/admin/users/${id}`),

	update: (id: string, data: Partial<User>) => apiClient.put<ApiResponse<User>>(`/api/admin/users/${id}`, data)
};

// Admin - Events
export const adminEventsAPI = {
	getAll: (params?: { isActive?: boolean }) => apiClient.get<ApiResponse<Event[]>>("/api/admin/events", params),

	getById: (id: string) => apiClient.get<ApiResponse<Event>>(`/api/admin/events/${id}`),

	create: (data: { name: LocalizedText; description?: LocalizedText; startDate: string; endDate: string; location?: string }) => apiClient.post<ApiResponse<Event>>("/api/admin/events", data),

	update: (id: string, data: Partial<Event>) => apiClient.put<ApiResponse<Event>>(`/api/admin/events/${id}`, data),

	delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/api/admin/events/${id}`)
};

// Admin - Tickets
export const adminTicketsAPI = {
	getAll: (params?: { eventId?: string; isActive?: boolean }) => apiClient.get<ApiResponse<Ticket[]>>("/api/admin/tickets", params),

	getById: (id: string) => apiClient.get<ApiResponse<Ticket>>(`/api/admin/tickets/${id}`),

	create: (data: { eventId: string; name: LocalizedText; description?: LocalizedText; price: number; quantity: number; saleStart?: string; saleEnd?: string; requireInviteCode?: boolean }) =>
		apiClient.post<ApiResponse<Ticket>>("/api/admin/tickets", data),

	update: (id: string, data: Partial<Ticket>) => apiClient.put<ApiResponse<Ticket>>(`/api/admin/tickets/${id}`, data),

	delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/api/admin/tickets/${id}`),

	getAnalytics: (id: string) => apiClient.get<ApiResponse<TicketAnalytics>>(`/api/admin/tickets/${id}/analytics`),

	reorder: (data: TicketReorder) => apiClient.put<ApiResponse<null>>("/api/admin/tickets/reorder", data)
};

// Admin - Event Form Fields
export const adminEventFormFieldsAPI = {
	getAll: (params?: { eventId?: string }) => apiClient.get<ApiResponse<EventFormField[]>>("/api/admin/event-form-fields", params),

	getById: (id: string) => apiClient.get<ApiResponse<EventFormField>>(`/api/admin/event-form-fields/${id}`),

	create: (data: {
		eventId: string;
		order: number;
		type: "text" | "textarea" | "select" | "checkbox" | "radio";
		name: LocalizedText;
		description?: LocalizedText;
		placeholder?: string;
		required?: boolean;
		validater?: string;
		values?: LocalizedText[];
	}) => apiClient.post<ApiResponse<EventFormField>>("/api/admin/event-form-fields", data),

	update: (id: string, data: Partial<EventFormField>) => apiClient.put<ApiResponse<EventFormField>>(`/api/admin/event-form-fields/${id}`, data),

	delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/api/admin/event-form-fields/${id}`),

	reorder: (eventId: string, data: EventFormFieldReorder) => apiClient.put<ApiResponse<null>>(`/api/admin/events/${eventId}/form-fields/reorder`, data)
};

// Admin - Registrations
export const adminRegistrationsAPI = {
	getAll: (params?: { page?: number; limit?: number; eventId?: string; status?: "pending" | "confirmed" | "cancelled"; userId?: string }) =>
		apiClient.get<ApiResponse<Registration[]>>("/api/admin/registrations", params),

	getById: (id: string) => apiClient.get<ApiResponse<Registration>>(`/api/admin/registrations/${id}`),

	update: (
		id: string,
		data: {
			formData?: Record<string, unknown>;
			status?: "pending" | "confirmed" | "cancelled";
		}
	) => apiClient.put<ApiResponse<Registration>>(`/api/admin/registrations/${id}`, data),

	delete: (id: string) => apiClient.delete<ApiResponse<{ id: string; email: string }>>(`/api/admin/registrations/${id}`),

	export: (params?: { eventId?: string; status?: "confirmed" | "cancelled" | "pending"; format?: "csv" | "excel" }) =>
		apiClient.get<ApiResponse<ExportData>>("/api/admin/registrations/export", params),

	getServiceAccountEmail: () => apiClient.get<ApiResponse<{ email: string }>>("/api/admin/registrations/google-sheets/service-account"),

	syncToGoogleSheets: (data: { eventId: string; sheetsUrl: string }) => apiClient.post<ApiResponse<{ count: number; sheetsUrl: string }>>("/api/admin/registrations/google-sheets/sync", data)
};

// Admin - Invitation Codes
export const adminInvitationCodesAPI = {
	getAll: (params?: { ticketId?: string; eventId?: string; isActive?: boolean }) => apiClient.get<ApiResponse<InvitationCodeInfo[]>>("/api/admin/invitation-codes", params),

	getById: (id: string) => apiClient.get<ApiResponse<InvitationCodeInfo>>(`/api/admin/invitation-codes/${id}`),

	create: (data: { ticketId: string; code: string; name?: string; usageLimit?: number; validFrom?: string; validUntil?: string }) =>
		apiClient.post<ApiResponse<InvitationCodeInfo>>("/api/admin/invitation-codes", data),

	update: (id: string, data: Partial<InvitationCodeInfo>) => apiClient.put<ApiResponse<InvitationCodeInfo>>(`/api/admin/invitation-codes/${id}`, data),

	delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/api/admin/invitation-codes/${id}`),

	bulkCreate: (data: { ticketId: string; prefix: string; count: number; usageLimit?: number; validFrom?: string; validUntil?: string }) =>
		apiClient.post<ApiResponse<InvitationCodeInfo[]>>("/api/admin/invitation-codes/bulk", data)
};

// Admin - Referrals
export const adminReferralsAPI = {
	getOverview: () => apiClient.get<ApiResponse<unknown>>("/api/admin/referrals/overview"),

	getLeaderboard: () => apiClient.get<ApiResponse<unknown>>("/api/admin/referrals/leaderboard"),

	getTree: (regId: string) => apiClient.get<ApiResponse<unknown>>(`/api/admin/referrals/tree/${regId}`),

	getQualified: () => apiClient.get<ApiResponse<unknown>>("/api/admin/referrals/qualified"),

	draw: () => apiClient.post<ApiResponse<unknown>>("/api/admin/referrals/draw"),

	getStats: () => apiClient.get<ApiResponse<unknown>>("/api/admin/referrals/stats")
};

// Admin - Email Campaigns
export const adminEmailCampaignsAPI = {
	getAll: (params?: { status?: "draft" | "sent" | "scheduled"; eventId?: string; page?: number; limit?: number }) => apiClient.get<ApiResponse<EmailCampaign[]>>("/api/admin/email-campaigns", params),

	create: (data: {
		name: string;
		subject: string;
		content: string;
		eventId?: string;
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
		scheduledAt?: string;
	}) => apiClient.post<ApiResponse<EmailCampaign>>("/api/admin/email-campaigns", data),

	getStatus: (campaignId: string) => apiClient.get<ApiResponse<{ status: string; sentCount: number }>>(`/api/admin/email-campaigns/${campaignId}/status`),

	preview: (campaignId: string) => apiClient.post<ApiResponse<{ previewHtml: string }>>(`/api/admin/email-campaigns/${campaignId}/preview`),

	calculateRecipients: (campaignId: string) =>
		apiClient.post<ApiResponse<{ recipientCount: number; recipients: Array<{ email: string }> }>>(`/api/admin/email-campaigns/${campaignId}/calculate-recipients`),

	send: (campaignId: string, sendNow: boolean = true) => apiClient.post<ApiResponse<EmailCampaign>>(`/api/admin/email-campaigns/${campaignId}/send`, { sendNow }),

	cancel: (campaignId: string) => apiClient.delete<ApiResponse<void>>(`/api/admin/email-campaigns/${campaignId}`)
};

// SMS Verification - Requires Auth
export const smsVerificationAPI = {
	send: (data: { phoneNumber: string; locale?: string }) => apiClient.post<ApiResponse<{ expiresAt: string }>>("/api/sms-verification/send", data),

	verify: (data: { phoneNumber: string; code: string }) => apiClient.post<ApiResponse<{ verified: boolean }>>("/api/sms-verification/verify", data),

	getStatus: () => apiClient.get<ApiResponse<{ phoneNumber?: string; phoneVerified: boolean }>>("/api/sms-verification/status")
};

// Admin - SMS Verification Logs
export const adminSmsVerificationAPI = {
	getLogs: (params?: { userId?: string; phoneNumber?: string; verified?: boolean; page?: number; limit?: number }) => apiClient.get<ApiResponse<unknown>>("/api/admin/sms-verification-logs", params),

	getStats: () => apiClient.get<ApiResponse<unknown>>("/api/admin/sms-verification-stats")
};
