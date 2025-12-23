import { z } from "zod";
import { localizedTextSchema } from "./common";

/**
 * Ticket schemas
 */

export const ticketCreateSchema = z.object({
	eventId: z.cuid(),
	order: z.number().int().nonnegative().default(0).optional(),
	name: z.union([z.string(), localizedTextSchema]),
	description: z.union([z.string(), localizedTextSchema]).optional(),
	price: z.number().nonnegative(),
	quantity: z.number().int().nonnegative(),
	saleStart: z.string().datetime().optional(),
	saleEnd: z.string().datetime().optional(),
	requireInviteCode: z.boolean().default(false).optional(),
	hidden: z.boolean().default(false).optional(),
});

export const ticketUpdateSchema = z.object({
	order: z.number().int().nonnegative().optional(),
	name: z.union([z.string(), localizedTextSchema]).optional(),
	description: z.union([z.string(), localizedTextSchema]).optional(),
	price: z.number().nonnegative().optional(),
	quantity: z.number().int().nonnegative().optional(),
	saleStart: z.string().datetime().optional(),
	saleEnd: z.string().datetime().optional(),
	isActive: z.boolean().optional(),
	requireInviteCode: z.boolean().optional(),
});

export const ticketReorderSchema = z.object({
	tickets: z.array(
		z.object({
			id: z.cuid(),
			order: z.number().int().nonnegative(),
		})
	),
});

/**
 * Type exports
 */
export type TicketCreateRequest = z.infer<typeof ticketCreateSchema>;
export type TicketUpdateRequest = z.infer<typeof ticketUpdateSchema>;
export type TicketReorderRequest = z.infer<typeof ticketReorderSchema>;
