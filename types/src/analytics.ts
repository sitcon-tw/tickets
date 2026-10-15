/**
 * Analytics types and schemas
 */

import { z } from "zod/v4";
import { LocalizedTextSchema } from "./common.js";

/**
 * Event dashboard data
 */
export const EventDashboardDataSchema = z.object({
	event: z.object({
		id: z.string(),
		name: LocalizedTextSchema,
		startDate: z.coerce.date(),
		endDate: z.coerce.date(),
		locationText: LocalizedTextSchema.nullable(),
		mapLink: z.string().nullable().optional()
	}),
	stats: z.object({
		totalRegistrations: z.number().int().min(0),
		confirmedRegistrations: z.number().int().min(0),
		pendingRegistrations: z.number().int().min(0),
		cancelledRegistrations: z.number().int().min(0),
		totalRevenue: z.number().min(0)
	}),
	tickets: z.array(
		z.object({
			id: z.string(),
			name: LocalizedTextSchema,
			price: z.number().min(0),
			quantity: z.number().int().min(0),
			soldCount: z.number().int().min(0),
			revenue: z.number().min(0),
			// Negative/over 100 when an admin lowers quantity below soldCount
			available: z.number().int(),
			salesRate: z.number().min(0)
		})
	),
	registrationTrends: z.array(
		z.object({
			date: z.string(),
			count: z.number().int().min(0),
			confirmed: z.number().int().min(0)
		})
	),
	referralStats: z.object({
		totalReferrals: z.number().int().min(0),
		activeReferrers: z.number().int().min(0),
		conversionRate: z.number().min(0).max(100)
	})
});
export type EventDashboardData = z.infer<typeof EventDashboardDataSchema>;
