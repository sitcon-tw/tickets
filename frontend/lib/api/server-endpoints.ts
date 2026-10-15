import {
	ApiResponseSchema,
	EventSchema,
	PublicEventListItemSchema,
	PublicReferralRankingDataSchema,
	PublicTicketDetailSchema,
	RegistrationStatsSchema,
	SiteSettingsSchema,
	UserRegistrationListItemSchema,
	type Event,
	type PublicEventListItem,
	type PublicTicketDetail,
	type PublicReferralRankingData,
	type RegistrationStats,
	type SiteSettings,
	type UserRegistrationListItem
} from "@sitcontix/types";
import { cookies } from "next/headers";
import z from "zod/v4";

function getBackendUrl() {
	return process.env.BACKEND_URI || "http://localhost:3000";
}

async function serverGet<T>(endpoint: string, schema: z.ZodType<T>, params?: Record<string, string | number | undefined>, { withCookies = true }: { withCookies?: boolean } = {}): Promise<T | null> {
	const cookieHeader = withCookies ? (await cookies()).toString() : "";
	const url = new URL(`${getBackendUrl()}${endpoint}`);
	for (const [key, value] of Object.entries(params || {})) {
		if (value !== undefined) url.searchParams.set(key, String(value));
	}

	try {
		const response = await fetch(url, {
			headers: cookieHeader ? { cookie: cookieHeader } : {},
			cache: "no-store"
		});

		if (!response.ok) return null;

		const json: unknown = await response.json();
		const parsed = schema.safeParse(json);
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

export async function getServerPublicEvents(): Promise<PublicEventListItem[] | null> {
	const response = await serverGet("/api/events", ApiResponseSchema(z.array(PublicEventListItemSchema)));
	return response?.success ? response.data : null;
}

/** Resolves an event by slug, id or the last 6 characters of its id. Hidden events are included (they are only left out of the public list). */
export async function getServerEvent(slugOrId: string): Promise<Event | null> {
	const response = await serverGet(`/api/events/${encodeURIComponent(slugOrId)}/info`, ApiResponseSchema(EventSchema), undefined, { withCookies: false });
	return response?.success ? response.data : null;
}

export async function getServerTicket(ticketId: string): Promise<PublicTicketDetail | null> {
	const response = await serverGet(`/api/tickets/${encodeURIComponent(ticketId)}`, ApiResponseSchema(PublicTicketDetailSchema), undefined, { withCookies: false });
	return response?.success ? response.data : null;
}

export async function getServerSiteSettings(): Promise<SiteSettings | null> {
	const response = await serverGet("/api/settings", ApiResponseSchema(SiteSettingsSchema));
	return response?.success ? response.data : null;
}

export async function getServerRegistrations(): Promise<UserRegistrationListItem[] | null> {
	const response = await serverGet("/api/registrations", ApiResponseSchema(z.array(UserRegistrationListItemSchema)));
	return response?.success ? response.data : null;
}

export async function getServerReferralRanking(eventId: string, limit = 50): Promise<PublicReferralRankingData | null> {
	const response = await serverGet("/api/referrals/ranking", ApiResponseSchema(PublicReferralRankingDataSchema), { eventId, limit });
	return response?.success ? response.data : null;
}

export async function getServerReferralStats(registrationId: string): Promise<RegistrationStats | null> {
	const response = await serverGet(`/api/registrations/referral-stats/${registrationId}`, ApiResponseSchema(RegistrationStatsSchema));
	return response?.success ? response.data : null;
}
