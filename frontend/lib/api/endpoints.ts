import { fetchGravatarName } from "@/lib/gravatar";
import { isHttpStatus } from "@/lib/types/client";
import {
	AdminEmailCampaignSchema,
	AdminRegistrationSchema,
	ApiResponseSchema,
	CheckInAttendeeSchema,
	CheckInResultSchema,
	EmailCampaignSchema,
	EmailCampaignStatusResponseSchema,
	EventDashboardDataSchema,
	EventFormFieldSchema,
	EventSchema,
	EventStatsSchema,
	GoogleSheetsSettingsSchema,
	InvitationCodeSchema,
	InvitationCodeVerificationSchema,
	PasskeySchema,
	PermissionsResponseSchema,
	PublicEventFormFieldSchema,
	PublicEventListItemSchema,
	PublicReferralRankingDataSchema,
	PublicSponsorsDataSchema,
	PublicTicketDetailSchema,
	PublicTicketListItemSchema,
	ReferralLinkSchema,
	ReferralValidationSchema,
	RegistrationHoldSchema,
	RegistrationSchema,
	RegistrationStatsSchema,
	RoleSchema,
	SessionSchema,
	SiteSettingsSchema,
	SponsorDailyStatSchema,
	SponsorSchema,
	SponsorSectionTitlesSchema,
	SponsorWithStatsSchema,
	TicketAnalyticsSchema,
	TicketSchema,
	UserRegistrationListItemSchema,
	UserSchema,
	WebhookDeliverySchema,
	WebhookEndpointSchema,
	WebhookTestResponseSchema,
	type AdminUserUpdateRequest,
	type AttendeeRegistrationUpdateRequest,
	type EmailCampaignCreateRequest,
	type EmailCampaignStatus,
	type EmailCampaignUpdateRequest,
	type Event,
	type EventCreateRequest,
	type EventFormFieldCreateRequest,
	type EventFormFieldReorderRequest,
	type EventFormFieldUpdateRequest,
	type EventUpdateRequest,
	type InvitationCodeBulkCreateRequest,
	type InvitationCodeCreateRequest,
	type InvitationCodeSendEmailRequest,
	type InvitationCodeUpdateRequest,
	type InvitationCodeVerifyRequest,
	type ReferralValidateRequest,
	type RegistrationCreateRequest,
	type RegistrationHoldRequest,
	type RegistrationStatus,
	type RegistrationUpdateRequest,
	type RoleCreateRequest,
	type RoleUpdateRequest,
	type SiteSettingsUpdateRequest,
	type SponsorCreateRequest,
	type SponsorReorderRequest,
	type SponsorSectionTitles,
	type SponsorTrackRequest,
	type SponsorUpdateRequest,
	type TargetAudience,
	type TicketCreateRequest,
	type TicketReorderRequest,
	type TicketUpdateRequest,
	type UserRole,
	type WebhookEndpointCreateRequest,
	type WebhookEndpointUpdateRequest,
	type WebhookTestRequest
} from "@sitcontix/types";
import z from "zod/v4";
import { startAuthentication, startRegistration, type PublicKeyCredentialCreationOptionsJSON, type PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { apiClient, type RequestOptions } from "./client";

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
	getSession: (options?: RequestOptions) => apiClient.get("/api/auth/get-session", {}, SessionSchema.nullable().optional(), options),
	getPermissions: () => apiClient.get("/api/auth/permissions", {}, ApiResponseSchema(PermissionsResponseSchema.nullable().optional())),
	signOut: () => apiClient.post("/api/auth/sign-out"),
	updateName: (name: string) => apiClient.post("/api/auth/update-user", { name }),
	signInWithPasskey: async () => {
		const options = await apiClient.get<PublicKeyCredentialRequestOptionsJSON>("/api/auth/passkey/generate-authenticate-options");
		const response = await startAuthentication({ optionsJSON: options });
		return apiClient.post("/api/auth/passkey/verify-authentication", { response });
	},
	addPasskey: async (name?: string) => {
		const options = await apiClient.get<PublicKeyCredentialCreationOptionsJSON>("/api/auth/passkey/generate-register-options");
		const response = await startRegistration({ optionsJSON: options });
		return apiClient.post("/api/auth/passkey/verify-registration", { response, name });
	},
	listPasskeys: () => apiClient.get("/api/auth/passkey/list-user-passkeys", {}, z.array(PasskeySchema)),
	deletePasskey: (id: string) => apiClient.post("/api/auth/passkey/delete-passkey", { id })
};

// Events - Public
export const eventsAPI = {
	/** Public event list. Hidden events are left out, so resolve a URL's event with `findBySlug` instead of searching this list. */
	getAll: (params?: { isActive?: boolean; upcoming?: boolean }) => apiClient.get("/api/events", params, ApiResponseSchema(z.array(PublicEventListItemSchema))),

	/** Accepts an event id, its slug or the last 6 characters of its id. Hidden events resolve too. */
	getInfo: (idOrSlug: string) => apiClient.get(`/api/events/${encodeURIComponent(idOrSlug)}/info`, {}, ApiResponseSchema(EventSchema)),

	/** Resolves the event a URL segment (slug, id or last 6 characters of the id) points at; null when there is no such event. */
	findBySlug: async (slug: string): Promise<Event | null> => {
		try {
			const response = await eventsAPI.getInfo(slug);
			return response.success ? response.data : null;
		} catch (error) {
			if (isHttpStatus(error, 404)) return null;
			throw error;
		}
	},

	getTickets: (id: string) => apiClient.get(`/api/events/${id}/tickets`, {}, ApiResponseSchema(z.array(PublicTicketListItemSchema))),

	getStats: (id: string) => apiClient.get(`/api/events/${id}/stats`, {}, ApiResponseSchema(EventStatsSchema)),

	getSponsors: (id: string) => apiClient.get(`/api/events/${id}/sponsors`, {}, ApiResponseSchema(PublicSponsorsDataSchema))
};

// Sponsors - Public tracking. Fire-and-forget: it must never retry, redirect or surface errors to the visitor.
export const sponsorsAPI = {
	track: (data: SponsorTrackRequest) => {
		try {
			void fetch("/api/sponsors/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), keepalive: true }).catch(() => undefined);
		} catch {
			// Tracking is best-effort.
		}
	}
};

// Site settings - Public
export const settingsAPI = {
	get: () => apiClient.get("/api/settings", {}, ApiResponseSchema(SiteSettingsSchema))
};

// Tickets - Public
export const ticketsAPI = {
	getTicket: (id: string) => apiClient.get(`/api/tickets/${id}`, {}, ApiResponseSchema(PublicTicketDetailSchema)),

	getFormFields: (id: string) => apiClient.get(`/api/tickets/${id}/form-fields`, {}, ApiResponseSchema(z.array(PublicEventFormFieldSchema)))
};

// Registrations - Requires Auth
export const registrationsAPI = {
	create: (data: RegistrationCreateRequest) => apiClient.post("/api/registrations", data, ApiResponseSchema(RegistrationSchema)),

	hold: (data: RegistrationHoldRequest) => apiClient.post("/api/registrations/hold", data, ApiResponseSchema(RegistrationHoldSchema)),

	getAll: (options?: RequestOptions) => apiClient.get("/api/registrations", {}, ApiResponseSchema(z.array(UserRegistrationListItemSchema)), options),

	getById: (id: string) => apiClient.get(`/api/registrations/${id}`, {}, ApiResponseSchema(RegistrationSchema)),

	update: (id: string, data: AttendeeRegistrationUpdateRequest) => apiClient.put(`/api/registrations/${id}`, data, ApiResponseSchema(RegistrationSchema)),

	cancel: (id: string) => apiClient.put(`/api/registrations/${id}/cancel`, {}, ApiResponseSchema(z.null()))
};

// Referrals - Requires Auth
export const referralsAPI = {
	getReferralLink: (regId: string) => apiClient.get(`/api/registrations/${regId}/referral-link`, {}, ApiResponseSchema(ReferralLinkSchema)),

	getStats: (regId: string) => apiClient.get(`/api/registrations/referral-stats/${regId}`, {}, ApiResponseSchema(RegistrationStatsSchema)),

	validate: (data: ReferralValidateRequest) => apiClient.post("/api/referrals/validate", data, ApiResponseSchema(ReferralValidationSchema)),

	getRanking: (eventId: string, limit?: number) => apiClient.get("/api/referrals/ranking", { eventId, limit }, ApiResponseSchema(PublicReferralRankingDataSchema))
};

// Invitation Codes - Public
export const invitationCodesAPI = {
	verify: (data: InvitationCodeVerifyRequest) => apiClient.post("/api/invitation-codes/verify", data, ApiResponseSchema(InvitationCodeVerificationSchema))
};

// User // Admin - Analytics
export const adminAnalyticsAPI = {
	getEventDashboard: (eventId: string) => apiClient.get(`/api/admin/events/${eventId}/dashboard`, {}, ApiResponseSchema(EventDashboardDataSchema))
};

// Admin - Users
export const adminUsersAPI = {
	getAll: (params?: { role?: UserRole; isActive?: boolean }) => apiClient.get("/api/admin/users", params, ApiResponseSchema(z.array(UserSchema))),

	getById: (id: string) => apiClient.get(`/api/admin/users/${id}`, {}, ApiResponseSchema(UserSchema)),

	update: (id: string, data: AdminUserUpdateRequest) => apiClient.put(`/api/admin/users/${id}`, data, ApiResponseSchema(UserSchema))
};

// Admin - Roles
export const adminRolesAPI = {
	getAll: () => apiClient.get("/api/admin/roles", {}, ApiResponseSchema(z.array(RoleSchema))),

	create: (data: RoleCreateRequest) => apiClient.post("/api/admin/roles", data, ApiResponseSchema(RoleSchema)),

	update: (id: string, data: RoleUpdateRequest) => apiClient.put(`/api/admin/roles/${id}`, data, ApiResponseSchema(RoleSchema)),

	delete: (id: string) => apiClient.delete(`/api/admin/roles/${id}`, ApiResponseSchema(z.null()))
};

// Admin - Settings
export const adminSettingsAPI = {
	get: () => apiClient.get("/api/admin/settings", {}, ApiResponseSchema(SiteSettingsSchema)),

	update: (data: SiteSettingsUpdateRequest) => apiClient.put("/api/admin/settings", data, ApiResponseSchema(SiteSettingsSchema))
};

// Admin - Events
export const adminEventsAPI = {
	getAll: (params?: { isActive?: boolean }) => apiClient.get("/api/admin/events", params, ApiResponseSchema(z.array(EventSchema))),

	getById: (id: string) => apiClient.get(`/api/admin/events/${id}`, {}, ApiResponseSchema(EventSchema)),

	create: (data: EventCreateRequest) => apiClient.post("/api/admin/events", data, ApiResponseSchema(EventSchema)),

	update: (id: string, data: EventUpdateRequest) => apiClient.put(`/api/admin/events/${id}`, data, ApiResponseSchema(EventSchema)),

	delete: (id: string) => apiClient.delete(`/api/admin/events/${id}`, ApiResponseSchema(z.null()))
};

// Admin - Tickets
export const adminTicketsAPI = {
	getAll: (params?: { eventId?: string; isActive?: boolean }) => apiClient.get("/api/admin/tickets", params, ApiResponseSchema(z.array(TicketSchema))),

	getById: (id: string) => apiClient.get(`/api/admin/tickets/${id}`, {}, ApiResponseSchema(TicketSchema)),

	create: (data: TicketCreateRequest) => apiClient.post("/api/admin/tickets", data, ApiResponseSchema(TicketSchema)),

	update: (id: string, data: TicketUpdateRequest) => apiClient.put(`/api/admin/tickets/${id}`, data, ApiResponseSchema(TicketSchema)),

	delete: (id: string) => apiClient.delete(`/api/admin/tickets/${id}`, ApiResponseSchema(z.null())),

	getAnalytics: (id: string) => apiClient.get(`/api/admin/tickets/${id}/analytics`, {}, ApiResponseSchema(TicketAnalyticsSchema)),

	reorder: (data: TicketReorderRequest) => apiClient.put("/api/admin/tickets/reorder", data, ApiResponseSchema(z.null()))
};

// Admin - Sponsors
export const adminSponsorsAPI = {
	getAll: (eventId: string) => apiClient.get(`/api/admin/events/${eventId}/sponsors`, {}, ApiResponseSchema(z.array(SponsorWithStatsSchema))),

	getSectionTitles: (eventId: string) => apiClient.get(`/api/admin/events/${eventId}/sponsors/titles`, {}, ApiResponseSchema(SponsorSectionTitlesSchema)),

	updateSectionTitles: (eventId: string, data: SponsorSectionTitles) => apiClient.put(`/api/admin/events/${eventId}/sponsors/titles`, data, ApiResponseSchema(SponsorSectionTitlesSchema)),

	getDailyStats: (eventId: string) => apiClient.get(`/api/admin/events/${eventId}/sponsors/stats/daily`, {}, ApiResponseSchema(z.array(SponsorDailyStatSchema))),

	create: (eventId: string, data: SponsorCreateRequest) => apiClient.post(`/api/admin/events/${eventId}/sponsors`, data, ApiResponseSchema(SponsorSchema)),

	update: (id: string, data: SponsorUpdateRequest) => apiClient.put(`/api/admin/sponsors/${id}`, data, ApiResponseSchema(SponsorSchema)),

	delete: (id: string) => apiClient.delete(`/api/admin/sponsors/${id}`, ApiResponseSchema(z.null())),

	reorder: (eventId: string, data: SponsorReorderRequest) => apiClient.put(`/api/admin/events/${eventId}/sponsors/reorder`, data, ApiResponseSchema(z.null()))
};

// Admin - Event Form Fields
export const adminEventFormFieldsAPI = {
	getAll: (params?: { eventId?: string }) => apiClient.get("/api/admin/event-form-fields", params, ApiResponseSchema(z.array(EventFormFieldSchema))),

	getById: (id: string) => apiClient.get(`/api/admin/event-form-fields/${id}`, {}, ApiResponseSchema(EventFormFieldSchema)),

	create: (data: EventFormFieldCreateRequest) => apiClient.post("/api/admin/event-form-fields", data, ApiResponseSchema(EventFormFieldSchema)),

	update: (id: string, data: EventFormFieldUpdateRequest) => apiClient.put(`/api/admin/event-form-fields/${id}`, data, ApiResponseSchema(EventFormFieldSchema)),

	delete: (id: string) => apiClient.delete(`/api/admin/event-form-fields/${id}`, ApiResponseSchema(z.null())),

	reorder: (eventId: string, data: EventFormFieldReorderRequest) => apiClient.put(`/api/admin/events/${eventId}/form-fields/reorder`, data, ApiResponseSchema(z.null()))
};

// Admin - Registrations
export const adminRegistrationsAPI = {
	getAll: (params?: { page?: number; limit?: number; eventId?: string; status?: RegistrationStatus; userId?: string }) =>
		apiClient.get("/api/admin/registrations", params, ApiResponseSchema(z.array(AdminRegistrationSchema))),

	getById: (id: string) => apiClient.get(`/api/admin/registrations/${id}`, {}, ApiResponseSchema(RegistrationSchema)),

	update: (id: string, data: RegistrationUpdateRequest) => apiClient.put(`/api/admin/registrations/${id}`, data, ApiResponseSchema(RegistrationSchema)),

	delete: (id: string) => apiClient.delete(`/api/admin/registrations/${id}`, ApiResponseSchema(z.object({ id: z.string(), email: z.string() }))),

	/** The event's registrations as a CSV file. */
	exportCsv: (params: { eventId: string; status?: RegistrationStatus }) => apiClient.getBlob("/api/admin/registrations/export", { ...params, format: "csv" }),

	getServiceAccountEmail: () => apiClient.get("/api/admin/registrations/google-sheets/service-account", {}, ApiResponseSchema(z.object({ email: z.string() }))),

	getGoogleSheetsSettings: (eventId: string) => apiClient.get("/api/admin/registrations/google-sheets/settings", { eventId }, ApiResponseSchema(GoogleSheetsSettingsSchema)),

	updateGoogleSheetsSettings: (data: { eventId: string; autoSync: boolean }) => apiClient.put("/api/admin/registrations/google-sheets/settings", data, ApiResponseSchema(GoogleSheetsSettingsSchema)),

	syncToGoogleSheets: (data: { eventId: string; sheetsUrl: string; autoSync?: boolean }) =>
		apiClient.post("/api/admin/registrations/google-sheets/sync", data, ApiResponseSchema(GoogleSheetsSettingsSchema.extend({ count: z.number() })))
};

// Admin - Check-ins
export const adminCheckInsAPI = {
	getAttendees: (params: { eventId: string }) => apiClient.get("/api/admin/check-ins", params, ApiResponseSchema(z.array(CheckInAttendeeSchema))),

	update: (id: string, checkedIn: boolean) => apiClient.put(`/api/admin/check-ins/${id}`, { checkedIn }, ApiResponseSchema(CheckInResultSchema))
};

// Admin - Invitation Codes
export const adminInvitationCodesAPI = {
	getAll: (params?: { ticketId?: string; eventId?: string; isActive?: boolean }) => apiClient.get("/api/admin/invitation-codes", params, ApiResponseSchema(z.array(InvitationCodeSchema))),

	getById: (id: string) => apiClient.get(`/api/admin/invitation-codes/${id}`, {}, ApiResponseSchema(InvitationCodeSchema)),

	create: (data: InvitationCodeCreateRequest) => apiClient.post("/api/admin/invitation-codes", data, ApiResponseSchema(InvitationCodeSchema)),

	update: (id: string, data: InvitationCodeUpdateRequest) => apiClient.put(`/api/admin/invitation-codes/${id}`, data, ApiResponseSchema(InvitationCodeSchema)),

	delete: (id: string) => apiClient.delete(`/api/admin/invitation-codes/${id}`, ApiResponseSchema(z.null())),

	bulkCreate: (data: InvitationCodeBulkCreateRequest) =>
		apiClient.post(
			"/api/admin/invitation-codes/bulk",
			data,
			ApiResponseSchema(
				z.object({
					count: z.number(),
					codes: z.array(z.string())
				})
			)
		),

	/** Emails one invitation code. Codes are only unique per ticket, so pass the ticket the code belongs to. */
	sendEmail: (data: InvitationCodeSendEmailRequest) => apiClient.post("/api/admin/invitation-codes/send-email", data, ApiResponseSchema(z.null().optional()))
};

const RecipientSchema = z.object({ email: z.string(), id: z.string() });
const RecipientsResponseSchema = z.object({ recipientCount: z.number(), recipients: z.array(RecipientSchema) });

// Admin - Email Campaigns
export const adminEmailCampaignsAPI = {
	getAll: (params?: { status?: EmailCampaignStatus; eventId?: string; page?: number; limit?: number }) =>
		apiClient.get("/api/admin/email-campaigns", params, ApiResponseSchema(z.array(AdminEmailCampaignSchema))),

	create: (data: EmailCampaignCreateRequest) => apiClient.post("/api/admin/email-campaigns", data, ApiResponseSchema(EmailCampaignSchema)),

	update: (campaignId: string, data: EmailCampaignUpdateRequest) => apiClient.patch(`/api/admin/email-campaigns/${campaignId}`, data, ApiResponseSchema(EmailCampaignSchema)),

	getStatus: (campaignId: string) => apiClient.get(`/api/admin/email-campaigns/${campaignId}/status`, {}, ApiResponseSchema(EmailCampaignStatusResponseSchema)),

	preview: (campaignId: string) => apiClient.post(`/api/admin/email-campaigns/${campaignId}/preview`, {}, ApiResponseSchema(z.object({ previewHtml: z.string() }))),

	previewRecipients: (targetAudience?: TargetAudience) => apiClient.post("/api/admin/email-campaigns/preview-recipients", { targetAudience }, ApiResponseSchema(RecipientsResponseSchema)),

	calculateRecipients: (campaignId: string) => apiClient.post(`/api/admin/email-campaigns/${campaignId}/calculate-recipients`, {}, ApiResponseSchema(RecipientsResponseSchema)),

	send: (campaignId: string) =>
		apiClient.post(
			`/api/admin/email-campaigns/${campaignId}/send`,
			{ sendNow: true },
			ApiResponseSchema(z.object({ id: z.string(), status: z.string(), totalCount: z.number(), sentCount: z.number() }))
		),

	cancel: (campaignId: string) => apiClient.delete(`/api/admin/email-campaigns/${campaignId}`, ApiResponseSchema(EmailCampaignSchema)),

	getTemplates: () =>
		apiClient.get("/api/admin/email-campaigns/templates", {}, ApiResponseSchema(z.array(z.object({ id: z.string(), name: z.string(), description: z.string(), content: z.string() }))))
};

// SMS Verification - Requires Auth
export const smsVerificationAPI = {
	send: (data: { phoneNumber: string; locale?: string; turnstileToken: string }) => apiClient.post("/api/sms-verification/send", data, ApiResponseSchema(z.object({ expiresAt: z.string() }))),

	verify: (data: { phoneNumber: string; code: string }) => apiClient.post("/api/sms-verification/verify", data, ApiResponseSchema(z.object({ verified: z.boolean() }))),

	getStatus: () => apiClient.get("/api/sms-verification/status", {}, ApiResponseSchema(z.object({ phoneNumber: z.string().nullable().optional(), phoneVerified: z.boolean() })))
};

// Admin - Webhooks
export const adminWebhooksAPI = {
	get: (eventId: string) => apiClient.get(`/api/admin/events/${eventId}/webhook`, {}, ApiResponseSchema(WebhookEndpointSchema.nullable())),

	create: (eventId: string, data: WebhookEndpointCreateRequest) => apiClient.post(`/api/admin/events/${eventId}/webhook`, data, ApiResponseSchema(WebhookEndpointSchema)),

	update: (eventId: string, data: WebhookEndpointUpdateRequest) => apiClient.put(`/api/admin/events/${eventId}/webhook`, data, ApiResponseSchema(WebhookEndpointSchema)),

	delete: (eventId: string) => apiClient.delete(`/api/admin/events/${eventId}/webhook`, ApiResponseSchema(z.null())),

	test: (eventId: string, data: WebhookTestRequest) => apiClient.post(`/api/admin/events/${eventId}/webhook/test`, data, ApiResponseSchema(WebhookTestResponseSchema)),

	getFailedDeliveries: (eventId: string, params?: { page?: number; limit?: number }) =>
		apiClient.get(`/api/admin/events/${eventId}/webhook/failed-deliveries`, params, ApiResponseSchema(z.array(WebhookDeliverySchema))),

	retryDelivery: (eventId: string, deliveryId: string) => apiClient.post(`/api/admin/events/${eventId}/webhook/deliveries/${deliveryId}/retry`, {}, ApiResponseSchema(z.null()))
};
