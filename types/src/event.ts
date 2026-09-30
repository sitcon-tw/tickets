/**
 * Event types and schemas
 */

import { z } from "zod/v4";
import { LocalizedTextSchema } from "./common.js";

/**
 * Event entity
 */
export const EventSchema = z.object({
	id: z.string(),
	slug: z.string().nullable().optional(),
	name: LocalizedTextSchema,
	description: LocalizedTextSchema.nullable().optional(),
	plainDescription: LocalizedTextSchema.nullable().optional(),
	locationText: LocalizedTextSchema.nullable().optional(),
	mapLink: z.string().nullable().optional(),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	editDeadline: z.coerce.date().nullable().optional(),
	ogImage: z.string().nullable().optional(),
	landingPage: z.string().nullable().optional(),
	googleSheetsUrl: z.string().nullable().optional(),
	isActive: z.boolean(),
	hideEvent: z.boolean().optional(),
	useOpass: z.boolean().optional(),
	opassEventId: z.string().nullable().optional(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date()
});
export type Event = z.infer<typeof EventSchema>;

/**
 * Event list item (with aggregated data)
 */
export const EventListItemSchema = EventSchema.extend({
	ticketCount: z.number().int().min(0),
	registrationCount: z.number().int().min(0),
	hasAvailableTickets: z.boolean()
});
export type EventListItem = z.infer<typeof EventListItemSchema>;

/**
 * Public event list item (for public API - subset of fields)
 */
export const PublicEventListItemSchema = z.object({
	id: z.string(),
	slug: z.string().nullable().optional(),
	name: LocalizedTextSchema,
	description: LocalizedTextSchema.nullable().optional(),
	plainDescription: LocalizedTextSchema.nullable().optional(),
	locationText: LocalizedTextSchema.nullable().optional(),
	mapLink: z.string().nullable().optional(),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	ogImage: z.string().nullable().optional(),
	useOpass: z.boolean().optional(),
	opassEventId: z.string().nullable().optional(),
	ticketCount: z.number().int().min(0),
	registrationCount: z.number().int().min(0),
	hasAvailableTickets: z.boolean()
});
export type PublicEventListItem = z.infer<typeof PublicEventListItemSchema>;

/**
 * URL-friendly event slug: lowercase letters, digits and single hyphens
 */
export const EventSlugSchema = z
	.string()
	.max(100)
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers and single hyphens");

/**
 * Event create request
 */
export const EventCreateRequestSchema = z.object({
	slug: EventSlugSchema.optional(),
	name: LocalizedTextSchema,
	description: LocalizedTextSchema.optional(),
	plainDescription: LocalizedTextSchema.optional(),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	editDeadline: z.coerce.date().optional(),
	locationText: LocalizedTextSchema.optional(),
	mapLink: z.string().optional(),
	ogImage: z.string().optional(),
	hideEvent: z.boolean().optional(),
	useOpass: z.boolean().optional(),
	opassEventId: z.string().nullable().optional()
});
export type EventCreateRequest = z.infer<typeof EventCreateRequestSchema>;

/**
 * Event update request
 */
export const EventUpdateRequestSchema = z.object({
	// null or "" clears the slug (the event then falls back to the last 6 characters of its id)
	slug: z
		.union([EventSlugSchema, z.literal("")])
		.nullable()
		.optional(),
	name: LocalizedTextSchema.optional(),
	description: LocalizedTextSchema.optional(),
	plainDescription: LocalizedTextSchema.optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	editDeadline: z.coerce.date().nullable().optional(),
	locationText: LocalizedTextSchema.optional(),
	mapLink: z.string().optional(),
	ogImage: z.string().optional(),
	isActive: z.boolean().optional(),
	hideEvent: z.boolean().optional(),
	useOpass: z.boolean().optional(),
	opassEventId: z.string().nullable().optional()
});
export type EventUpdateRequest = z.infer<typeof EventUpdateRequestSchema>;

/**
 * Event statistics
 */
export const EventStatsSchema = z.object({
	eventName: LocalizedTextSchema,
	totalRegistrations: z.number().int().min(0),
	confirmedRegistrations: z.number().int().min(0),
	totalTickets: z.number().int().min(0),
	availableTickets: z.number().int().min(0),
	registrationRate: z.number().min(0).max(100)
});
export type EventStats = z.infer<typeof EventStatsSchema>;
