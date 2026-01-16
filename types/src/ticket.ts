/**
 * Ticket types and schemas
 */

import { z } from "zod/v4";
import { LocalizedTextSchema } from "./common.js";

/**
 * Ticket entity
 */
export const TicketSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	order: z.number().int().min(0).optional(),
	name: LocalizedTextSchema,
	description: LocalizedTextSchema.nullable().optional(),
	plainDescription: LocalizedTextSchema.nullable().optional(),
	price: z.number().min(0),
	quantity: z.number().int().min(0),
	soldCount: z.number().int().min(0),
	available: z.number().int().min(0).optional(),
	saleStart: z.string().datetime().nullable().optional(),
	saleEnd: z.string().datetime().nullable().optional(),
	isOnSale: z.boolean().optional(),
	isSoldOut: z.boolean().optional(),
	isActive: z.boolean().optional(),
	hidden: z.boolean().optional(),
	requireInviteCode: z.boolean().optional(),
	requireSmsVerification: z.boolean().optional(),
	createdAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional()
});
export type Ticket = z.infer<typeof TicketSchema>;

/**
 * Ticket create request
 */
export const TicketCreateRequestSchema = z.object({
	eventId: z.string(),
	order: z.number().int().min(0).optional(),
	name: LocalizedTextSchema,
	description: LocalizedTextSchema.optional(),
	plainDescription: LocalizedTextSchema.optional(),
	price: z.number().min(0),
	quantity: z.number().int().min(1),
	saleStart: z.string().datetime().optional(),
	saleEnd: z.string().datetime().optional(),
	requireInviteCode: z.boolean().optional(),
	requireSmsVerification: z.boolean().optional(),
	hidden: z.boolean().optional()
});
export type TicketCreateRequest = z.infer<typeof TicketCreateRequestSchema>;

/**
 * Ticket update request
 */
export const TicketUpdateRequestSchema = z.object({
	order: z.number().int().min(0).optional(),
	name: LocalizedTextSchema.optional(),
	description: LocalizedTextSchema.optional(),
	plainDescription: LocalizedTextSchema.optional(),
	price: z.number().min(0).optional(),
	quantity: z.number().int().min(0).optional(),
	saleStart: z.string().datetime().optional(),
	saleEnd: z.string().datetime().optional(),
	isActive: z.boolean().optional(),
	requireInviteCode: z.boolean().optional(),
	requireSmsVerification: z.boolean().optional(),
	hidden: z.boolean().optional()
});
export type TicketUpdateRequest = z.infer<typeof TicketUpdateRequestSchema>;

/**
 * Ticket reorder request
 */
export const TicketReorderRequestSchema = z.object({
	tickets: z.array(
		z.object({
			id: z.string(),
			order: z.number().int().min(0)
		})
	)
});
export type TicketReorderRequest = z.infer<typeof TicketReorderRequestSchema>;

/**
 * Ticket analytics
 */
export const TicketAnalyticsSchema = z.object({
	totalSoldCount: z.number().int().min(0),
	totalRevenue: z.number().min(0),
	availableQuantity: z.number().int().min(0),
	salesByStatus: z.record(z.string(), z.number().int().min(0)),
	dailySales: z.array(
		z.object({
			date: z.string(),
			count: z.number().int().min(0),
			revenue: z.number().min(0)
		})
	)
});
export type TicketAnalytics = z.infer<typeof TicketAnalyticsSchema>;
