/**
 * Analytics types and schemas
 */

import { z } from "zod/v4";
import { LocalizedTextSchema } from "./common.js";

/**
 * Analytics data
 */
export const AnalyticsDataSchema = z.object({
	totalRegistrations: z.number().int().min(0),
	confirmedRegistrations: z.number().int().min(0),
	pendingRegistrations: z.number().int().min(0),
	cancelledRegistrations: z.number().int().min(0),
	checkedInCount: z.number().int().min(0),
	registrationsByDate: z.record(z.string(), z.unknown()),
	ticketSales: z.record(z.string(), z.unknown()),
	referralStats: z.record(z.string(), z.unknown()),
});
export type AnalyticsData = z.infer<typeof AnalyticsDataSchema>;

/**
 * Event dashboard data
 */
export const EventDashboardDataSchema = z.object({
	event: z.object({
		id: z.string(),
		name: LocalizedTextSchema,
		startDate: z.string().datetime(),
		endDate: z.string().datetime(),
		location: z.string().nullable(),
	}),
	stats: z.object({
		totalRegistrations: z.number().int().min(0),
		confirmedRegistrations: z.number().int().min(0),
		pendingRegistrations: z.number().int().min(0),
		cancelledRegistrations: z.number().int().min(0),
		totalRevenue: z.number().min(0),
	}),
	tickets: z.array(
		z.object({
			id: z.string(),
			name: LocalizedTextSchema,
			price: z.number().min(0),
			quantity: z.number().int().min(0),
			soldCount: z.number().int().min(0),
			revenue: z.number().min(0),
			available: z.number().int().min(0),
			salesRate: z.number().min(0).max(100),
		})
	),
	registrationTrends: z.array(
		z.object({
			date: z.string(),
			count: z.number().int().min(0),
			confirmed: z.number().int().min(0),
		})
	),
	referralStats: z.object({
		totalReferrals: z.number().int().min(0),
		activeReferrers: z.number().int().min(0),
		conversionRate: z.number().min(0).max(100),
	}),
});
export type EventDashboardData = z.infer<typeof EventDashboardDataSchema>;
