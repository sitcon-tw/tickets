import { fetchGravatarName } from "@/lib/gravatar";
import {
	ApiResponseSchema,
	DrawResultSchema,
	EmailCampaignSchema,
	EventDashboardDataSchema,
	EventFormFieldSchema,
	EventListItemSchema,
	EventSchema,
	EventStatsSchema,
	ExportDataSchema,
	InvitationCodeInfoSchema,
	InvitationCodeVerificationSchema,
	PermissionsResponseSchema,
	QualifiedReferrerSchema,
	ReferralLeaderboardSchema,
	ReferralLinkSchema,
	ReferralOverviewSchema,
	ReferralTreeSchema,
	ReferralValidationSchema,
	RegistrationSchema,
	RegistrationStatsSchema,
	SessionSchema,
	TicketAnalyticsSchema,
	TicketSchema,
	UserSchema,
	WebhookDeliverySchema,
	WebhookEndpointSchema,
	type Event,
	type EventFormField,
	type EventFormFieldReorderRequest,
	type HealthStatus,
	type InvitationCodeInfo,
	type LocalizedText,
	type Ticket,
	type TicketReorderRequest,
	type User
} from "@sitcontix/types";
import { apiClient } from "./client";
import z from "zod/v4";

// System
export const healthAPI = {
	check: (): Promise<HealthStatus> => apiClient.get("/system/health")
};

// Auth (handled by BetterAuth)
export const authAPI = {
	getMagicLink: async (email: string, locale?: string, returnUrl?: string, turnstileToken?: string) => {
		const gravatarName = await fetchGravatarName(email);
		const name = gravatarName || email.split("@")[0];

		return apiClient.post("/api/auth/sign-in/magic-link", {
			email,
			name,
			callbackURL: returnUrl ? `${window.location.origin}${returnUrl}` : `${window.location.origin}/${locale || "zh-Hant"}/`,
			newUserCallbackURL: returnUrl ? `${window.location.origin}${returnUrl}` : `${window.location.origin}/${locale || "zh-Hant"}/`,
			errorCallbackURL: `${window.location.origin}/${locale || "zh-Hant"}/login/${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`,
			turnstileToken
		});
	},
	getSession: () => apiClient.get("/api/auth/get-session", {}, SessionSchema),
	getPermissions: () => apiClient.get("/api/auth/permissions", {}, ApiResponseSchema(PermissionsResponseSchema)),
	signOut: () => apiClient.post("/api/auth/sign-out")
};

// Events - Public
export const eventsAPI = {
	getAll: (params?: { isActive?: boolean; upcoming?: boolean }) => apiClient.get("/api/events", params, ApiResponseSchema(z.array(EventListItemSchema))),

	getInfo: (id: string) => apiClient.get(`/api/events/${id}/info`, {}, ApiResponseSchema(EventSchema)),

	getTickets: (id: string) => apiClient.get(`/api/events/${id}/tickets`, {}, ApiResponseSchema(z.array(TicketSchema))),

	getStats: (id: string) => apiClient.get(`/api/events/${id}/stats`, {}, ApiResponseSchema(EventStatsSchema))
};

// Tickets - Public
export const ticketsAPI = {
	getTicket: (id: string) => apiClient.get(`/api/tickets/${id}`, {}, ApiResponseSchema(TicketSchema)),

	getFormFields: (id: string) => apiClient.get(`/api/tickets/${id}/form-fields`, {}, ApiResponseSchema(z.array(EventFormFieldSchema)))
};

// Registrations - Requires Auth
export const registrationsAPI = {
	create: (data: { eventId: string; ticketId: string; invitationCode?: string; referralCode?: string; formData: Record<string, unknown> }) =>
		apiClient.post("/api/registrations", data, ApiResponseSchema(RegistrationSchema)),

	getAll: () => apiClient.get("/api/registrations", {}, ApiResponseSchema(z.array(RegistrationSchema))),

	getById: (id: string) => apiClient.get(`/api/registrations/${id}`, {}, ApiResponseSchema(RegistrationSchema)),

	update: (id: string, data: Record<string, unknown>) => apiClient.put(`/api/registrations/${id}`, data, ApiResponseSchema(RegistrationSchema)),

	cancel: (id: string) => apiClient.put(`/api/registrations/${id}/cancel`, {}, ApiResponseSchema(RegistrationSchema))
};

// Referrals - Requires Auth
export const referralsAPI = {
	getReferralLink: (regId: string) => apiClient.get(`/api/registrations/${regId}/referral-link`, {}, ApiResponseSchema(ReferralLinkSchema)),

	getStats: (regId: string) => apiClient.get(`/api/registrations/referral-stats/${regId}`, {}, ApiResponseSchema(RegistrationStatsSchema)),

	validate: (data: { code: string; eventId: string }) => apiClient.post("/api/referrals/validate", data, ApiResponseSchema(ReferralValidationSchema))
};

// Invitation Codes - Public
export const invitationCodesAPI = {
	verify: (data: { code: string; ticketId: string }) => apiClient.post("/api/invitation-codes/verify", data, ApiResponseSchema(InvitationCodeVerificationSchema)),

	getInfo: (code: string, ticketId: string) => apiClient.get(`/api/invitation-codes/${code}/info`, { ticketId }, ApiResponseSchema(InvitationCodeInfoSchema))
};

// User // Admin - Analytics
export const adminAnalyticsAPI = {
	getEventDashboard: (eventId: string) => apiClient.get(`/api/admin/events/${eventId}/dashboard`, {}, ApiResponseSchema(EventDashboardDataSchema))
};

// Admin - Users
export const adminUsersAPI = {
	getAll: (params?: { role?: "admin" | "viewer" | "eventAdmin"; isActive?: boolean }) => apiClient.get("/api/admin/users", params, ApiResponseSchema(z.array(UserSchema))),

	getById: (id: string) => apiClient.get(`/api/admin/users/${id}`, {}, ApiResponseSchema(UserSchema)),

	update: (id: string, data: Partial<User>) => apiClient.put(`/api/admin/users/${id}`, data, ApiResponseSchema(UserSchema))
};

// Admin - Events
export const adminEventsAPI = {
	getAll: (params?: { isActive?: boolean }) => apiClient.get("/api/admin/events", params, ApiResponseSchema(z.array(EventSchema))),

	getById: (id: string) => apiClient.get(`/api/admin/events/${id}`, {}, ApiResponseSchema(EventSchema)),

	create: (data: { name: LocalizedText; description?: LocalizedText; startDate: Date | string; endDate: Date | string; locationText?: LocalizedText; mapLink?: string }) =>
		apiClient.post("/api/admin/events", data, ApiResponseSchema(EventSchema)),

	update: (id: string, data: Partial<Event>) => apiClient.put(`/api/admin/events/${id}`, data, ApiResponseSchema(EventSchema)),

	delete: (id: string) => apiClient.delete(`/api/admin/events/${id}`, ApiResponseSchema(z.void()))
};

// Admin - Tickets
export const adminTicketsAPI = {
	getAll: (params?: { eventId?: string; isActive?: boolean }) => apiClient.get("/api/admin/tickets", params, ApiResponseSchema(z.array(TicketSchema))),

	getById: (id: string) => apiClient.get(`/api/admin/tickets/${id}`, {}, ApiResponseSchema(TicketSchema)),

	create: (data: { eventId: string; name: LocalizedText; description?: LocalizedText; price: number; quantity: number; saleStart?: Date | string; saleEnd?: Date | string; requireInviteCode?: boolean }) =>
		apiClient.post("/api/admin/tickets", data, ApiResponseSchema(TicketSchema)),

	update: (id: string, data: Partial<Ticket>) => apiClient.put(`/api/admin/tickets/${id}`, data, ApiResponseSchema(TicketSchema)),

	delete: (id: string) => apiClient.delete(`/api/admin/tickets/${id}`, ApiResponseSchema(z.void())),

	getAnalytics: (id: string) => apiClient.get(`/api/admin/tickets/${id}/analytics`, {}, ApiResponseSchema(TicketAnalyticsSchema)),

	reorder: (data: TicketReorderRequest) => apiClient.put("/api/admin/tickets/reorder", data, ApiResponseSchema(z.null()))
};

// Admin - Event Form Fields
export const adminEventFormFieldsAPI = {
	getAll: (params?: { eventId?: string }) => apiClient.get("/api/admin/event-form-fields", params, ApiResponseSchema(z.array(EventFormFieldSchema))),

	getById: (id: string) => apiClient.get(`/api/admin/event-form-fields/${id}`, {}, ApiResponseSchema(EventFormFieldSchema)),

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
	}) => apiClient.post("/api/admin/event-form-fields", data, ApiResponseSchema(EventFormFieldSchema)),

	update: (id: string, data: Partial<EventFormField>) => apiClient.put(`/api/admin/event-form-fields/${id}`, data, ApiResponseSchema(EventFormFieldSchema)),

	delete: (id: string) => apiClient.delete(`/api/admin/event-form-fields/${id}`, ApiResponseSchema(z.void())),

	reorder: (eventId: string, data: EventFormFieldReorderRequest) => apiClient.put(`/api/admin/events/${eventId}/form-fields/reorder`, data, ApiResponseSchema(z.null()))
};

// Admin - Registrations
export const adminRegistrationsAPI = {
	getAll: (params?: { page?: number; limit?: number; eventId?: string; status?: "pending" | "confirmed" | "cancelled"; userId?: string }) =>
		apiClient.get("/api/admin/registrations", params, ApiResponseSchema(z.array(RegistrationSchema))),

	getById: (id: string) => apiClient.get(`/api/admin/registrations/${id}`, {}, ApiResponseSchema(RegistrationSchema)),

	update: (
		id: string,
		data: {
			formData?: Record<string, unknown>;
			status?: "pending" | "confirmed" | "cancelled";
		}
	) => apiClient.put(`/api/admin/registrations/${id}`, data, ApiResponseSchema(RegistrationSchema)),

	delete: (id: string) => apiClient.delete(`/api/admin/registrations/${id}`, ApiResponseSchema(z.object({ id: z.string(), email: z.string() }))),

	export: (params?: { eventId?: string; status?: "confirmed" | "cancelled" | "pending"; format?: "csv" | "excel" }) =>
		apiClient.get("/api/admin/registrations/export", params, ApiResponseSchema(ExportDataSchema)),

	getServiceAccountEmail: () => apiClient.get("/api/admin/registrations/google-sheets/service-account", {}, ApiResponseSchema(z.object({ email: z.string() }))),

	syncToGoogleSheets: (data: { eventId: string; sheetsUrl: string }) => apiClient.post("/api/admin/registrations/google-sheets/sync", data, ApiResponseSchema(z.object({ count: z.number(), sheetsUrl: z.string() })))
};

// Admin - Invitation Codes
export const adminInvitationCodesAPI = {
	getAll: (params?: { ticketId?: string; eventId?: string; isActive?: boolean }) => apiClient.get("/api/admin/invitation-codes", params, ApiResponseSchema(z.array(InvitationCodeInfoSchema))),

	getById: (id: string) => apiClient.get(`/api/admin/invitation-codes/${id}`, {}, ApiResponseSchema(InvitationCodeInfoSchema)),

	create: (data: { ticketId: string; code: string; name?: string; usageLimit?: number; validFrom?: string; validUntil?: string }) =>
		apiClient.post("/api/admin/invitation-codes", data, ApiResponseSchema(InvitationCodeInfoSchema)),

	update: (id: string, data: Partial<InvitationCodeInfo>) => apiClient.put(`/api/admin/invitation-codes/${id}`, data, ApiResponseSchema(InvitationCodeInfoSchema)),

	delete: (id: string) => apiClient.delete(`/api/admin/invitation-codes/${id}`, ApiResponseSchema(z.void())),

	bulkCreate: (data: { ticketId: string; name: string; count: number; usageLimit?: number; validFrom?: string; validUntil?: string }) =>
		apiClient.post("/api/admin/invitation-codes/bulk", data, ApiResponseSchema(z.array(InvitationCodeInfoSchema)))
};

// Admin - Referrals
export const adminReferralsAPI = {
	getOverview: () => apiClient.get("/api/admin/referrals/overview", {}, ApiResponseSchema(ReferralOverviewSchema)),

	getLeaderboard: () => apiClient.get("/api/admin/referrals/leaderboard", {}, ApiResponseSchema(ReferralLeaderboardSchema)),

	getTree: (regId: string) => apiClient.get(`/api/admin/referrals/tree/${regId}`, {}, ApiResponseSchema(ReferralTreeSchema)),

	getQualified: () => apiClient.get("/api/admin/referrals/qualified", {}, ApiResponseSchema(z.array(QualifiedReferrerSchema))),

	draw: () => apiClient.post("/api/admin/referrals/draw", {}, ApiResponseSchema(DrawResultSchema)),

	getStats: () => apiClient.get("/api/admin/referrals/stats", {}, ApiResponseSchema(ReferralOverviewSchema))
};

// Admin - Email Campaigns
export const adminEmailCampaignsAPI = {
	getAll: (params?: { status?: "draft" | "sent" | "scheduled"; eventId?: string; page?: number; limit?: number }) => apiClient.get("/api/admin/email-campaigns", params, ApiResponseSchema(z.array(EmailCampaignSchema))),

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
	}) => apiClient.post("/api/admin/email-campaigns", data, ApiResponseSchema(EmailCampaignSchema)),

	getStatus: (campaignId: string) => apiClient.get(`/api/admin/email-campaigns/${campaignId}/status`, {}, ApiResponseSchema(z.object({ status: z.string(), sentCount: z.number() }))),

	preview: (campaignId: string) => apiClient.post(`/api/admin/email-campaigns/${campaignId}/preview`, {}, ApiResponseSchema(z.object({ previewHtml: z.string() }))),

	calculateRecipients: (campaignId: string) =>
		apiClient.post(`/api/admin/email-campaigns/${campaignId}/calculate-recipients`, {}, ApiResponseSchema(z.object({ recipientCount: z.number(), recipients: z.array(z.object({ email: z.string() })) }))),

	send: (campaignId: string, sendNow: boolean = true) => apiClient.post(`/api/admin/email-campaigns/${campaignId}/send`, { sendNow }, ApiResponseSchema(EmailCampaignSchema)),

	cancel: (campaignId: string) => apiClient.delete(`/api/admin/email-campaigns/${campaignId}`, ApiResponseSchema(z.void()))
};

// SMS Verification - Requires Auth
export const smsVerificationAPI = {
	send: (data: { phoneNumber: string; locale?: string; turnstileToken: string }) => apiClient.post("/api/sms-verification/send", data, ApiResponseSchema(z.object({ expiresAt: z.string() }))),

	verify: (data: { phoneNumber: string; code: string }) => apiClient.post("/api/sms-verification/verify", data, ApiResponseSchema(z.object({ verified: z.boolean() }))),

	getStatus: () => apiClient.get("/api/sms-verification/status", {}, ApiResponseSchema(z.object({ phoneNumber: z.string().optional(), phoneVerified: z.boolean() })))
};

// Admin - SMS Verification Logs
export const adminSmsVerificationAPI = {
	getLogs: (params?: { userId?: string; phoneNumber?: string; verified?: boolean; page?: number; limit?: number }) => apiClient.get("/api/admin/sms-verification-logs", params, ApiResponseSchema(z.unknown())),

	getStats: () => apiClient.get("/api/admin/sms-verification-stats", {}, ApiResponseSchema(z.unknown()))
};

// Admin - Webhooks
export const adminWebhooksAPI = {
	get: (eventId: string) => apiClient.get(`/api/admin/events/${eventId}/webhook`, {}, ApiResponseSchema(WebhookEndpointSchema.nullable())),

	create: (eventId: string, data: { url: string; authHeaderName?: string; authHeaderValue?: string; eventTypes: string[] }) =>
		apiClient.post(`/api/admin/events/${eventId}/webhook`, data, ApiResponseSchema(WebhookEndpointSchema)),

	update: (eventId: string, data: { url?: string; authHeaderName?: string | null; authHeaderValue?: string | null; eventTypes?: string[]; isActive?: boolean }) =>
		apiClient.put(`/api/admin/events/${eventId}/webhook`, data, ApiResponseSchema(WebhookEndpointSchema)),

	delete: (eventId: string) => apiClient.delete(`/api/admin/events/${eventId}/webhook`, ApiResponseSchema(z.void())),

	test: (eventId: string, data: { url: string; authHeaderName?: string; authHeaderValue?: string }) =>
		apiClient.post(`/api/admin/events/${eventId}/webhook/test`, data, ApiResponseSchema(z.object({ success: z.boolean(), statusCode: z.number().optional(), responseBody: z.string().optional(), errorMessage: z.string().optional() }))),

	getFailedDeliveries: (eventId: string, params?: { page?: number; limit?: number }) => apiClient.get(`/api/admin/events/${eventId}/webhook/failed-deliveries`, params, ApiResponseSchema(z.array(WebhookDeliverySchema))),

	retryDelivery: (eventId: string, deliveryId: string) => apiClient.post(`/api/admin/events/${eventId}/webhook/deliveries/${deliveryId}/retry`, {}, ApiResponseSchema(z.void()))
};
