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
	location: z.string().nullable().optional(),
	startDate: z.iso.datetime(),
	endDate: z.iso.datetime(),
	editDeadline: z.iso.datetime().nullable().optional(),
	ogImage: z.string().nullable().optional(),
	landingPage: z.string().nullable().optional(),
	googleSheetsUrl: z.string().nullable().optional(),
	isActive: z.boolean(),
	hideEvent: z.boolean().optional(),
	useOpass: z.boolean().optional(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime()
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
 * Event create request
 */
export const EventCreateRequestSchema = z.object({
	slug: z.string().optional(),
	name: LocalizedTextSchema,
	description: LocalizedTextSchema.optional(),
	plainDescription: LocalizedTextSchema.optional(),
	startDate: z.iso.datetime(),
	endDate: z.iso.datetime(),
	editDeadline: z.iso.datetime().optional(),
	location: z.string().optional(),
	ogImage: z.string().optional()
});
export type EventCreateRequest = z.infer<typeof EventCreateRequestSchema>;

/**
 * Event update request
 */
export const EventUpdateRequestSchema = z.object({
	slug: z.string().optional(),
	name: LocalizedTextSchema.optional(),
	description: LocalizedTextSchema.optional(),
	plainDescription: LocalizedTextSchema.optional(),
	startDate: z.iso.datetime().optional(),
	endDate: z.iso.datetime().optional(),
	editDeadline: z.iso.datetime().nullable().optional(),
	location: z.string().optional(),
	ogImage: z.string().optional(),
	isActive: z.boolean().optional(),
	hideEvent: z.boolean().optional(),
	useOpass: z.boolean().optional()
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
