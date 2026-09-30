/**
 * Sponsor (logo ad) types and schemas
 */

import { z } from "zod/v4";
import { LocalizedTextSchema } from "./common.js";

/**
 * Where on the event page a sponsor logo grid is rendered.
 * - after_registration: right below the ticket picker, before the event information
 * - after_event_info: between the event information and the ticket information
 */
export const SponsorPlacementSchema = z.enum(["after_registration", "after_event_info"]);
export type SponsorPlacement = z.infer<typeof SponsorPlacementSchema>;

export const sponsorPlacements = SponsorPlacementSchema.options;

/**
 * Interaction kinds that are tracked for a sponsor
 * - impression: the logo grid was scrolled into view
 * - click: a logo was clicked (popup opened)
 * - link_click: the website link inside the popup was clicked
 */
export const SponsorTrackTypeSchema = z.enum(["impression", "click", "link_click"]);
export type SponsorTrackType = z.infer<typeof SponsorTrackTypeSchema>;

/** Only web links are allowed for logos and sponsor websites (blocks javascript: / data: URLs). */
const HttpUrlSchema = z.url({ protocol: /^https?$/ }).max(2048);

/**
 * Counters for a sponsor
 */
export const SponsorStatsSchema = z.object({
	impressions: z.number().int().min(0),
	clicks: z.number().int().min(0),
	linkClicks: z.number().int().min(0)
});
export type SponsorStats = z.infer<typeof SponsorStatsSchema>;

/**
 * Sponsor as seen by admins (includes tracking totals)
 */
export const SponsorSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	order: z.number().int().min(0),
	name: LocalizedTextSchema,
	description: LocalizedTextSchema.nullable().optional(),
	logoUrl: z.string(),
	logoDarkUrl: z.string().nullable().optional(),
	websiteUrl: z.string().nullable().optional(),
	placements: z.array(SponsorPlacementSchema),
	isActive: z.boolean(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date()
});
export type Sponsor = z.infer<typeof SponsorSchema>;

export const SponsorWithStatsSchema = SponsorSchema.extend({
	stats: SponsorStatsSchema,
	statsByPlacement: z.record(z.string(), SponsorStatsSchema)
});
export type SponsorWithStats = z.infer<typeof SponsorWithStatsSchema>;

/**
 * Sponsor as seen by visitors of the event page
 */
export const PublicSponsorSchema = z.object({
	id: z.string(),
	name: LocalizedTextSchema,
	description: LocalizedTextSchema.nullable().optional(),
	logoUrl: z.string(),
	logoDarkUrl: z.string().nullable().optional(),
	websiteUrl: z.string().nullable().optional(),
	placements: z.array(SponsorPlacementSchema)
});
export type PublicSponsor = z.infer<typeof PublicSponsorSchema>;

/**
 * Sponsor create request
 */
export const SponsorCreateRequestSchema = z.object({
	name: LocalizedTextSchema,
	description: LocalizedTextSchema.optional(),
	logoUrl: HttpUrlSchema,
	logoDarkUrl: HttpUrlSchema.nullable().optional(),
	websiteUrl: HttpUrlSchema.nullable().optional(),
	placements: z.array(SponsorPlacementSchema).min(1).max(sponsorPlacements.length).optional(),
	isActive: z.boolean().optional()
});
export type SponsorCreateRequest = z.infer<typeof SponsorCreateRequestSchema>;

/**
 * Sponsor update request
 */
export const SponsorUpdateRequestSchema = SponsorCreateRequestSchema.partial();
export type SponsorUpdateRequest = z.infer<typeof SponsorUpdateRequestSchema>;

/**
 * Sponsor reorder request
 */
export const SponsorReorderRequestSchema = z.object({
	sponsors: z
		.array(
			z.object({
				id: z.string(),
				order: z.number().int().min(0)
			})
		)
		.min(1)
		.max(100)
});
export type SponsorReorderRequest = z.infer<typeof SponsorReorderRequestSchema>;

/**
 * Tracking payload sent by the event page
 */
export const SponsorTrackRequestSchema = z.object({
	events: z
		.array(
			z.object({
				sponsorId: z.string().max(64),
				placement: SponsorPlacementSchema,
				type: SponsorTrackTypeSchema
			})
		)
		.min(1)
		.max(50)
});
export type SponsorTrackRequest = z.infer<typeof SponsorTrackRequestSchema>;

/**
 * One day of tracking data for a sponsor at a placement (dates are in UTC+8)
 */
export const SponsorDailyStatSchema = SponsorStatsSchema.extend({
	sponsorId: z.string(),
	date: z.string(),
	placement: SponsorPlacementSchema
});
export type SponsorDailyStat = z.infer<typeof SponsorDailyStatSchema>;
