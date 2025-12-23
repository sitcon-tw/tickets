import { z } from "zod";
import { sessionUserSchema } from "@tickets/shared";

/**
 * Middleware Zod schemas
 * Backend-only types for request/response middleware
 */

// Session schema
export const sessionSchema = z.object({
	sessionId: z.string(),
	userId: z.string(),
	user: sessionUserSchema,
	expiresAt: z.date(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// EventAccessRequest schema (route params/query for event access)
export const eventAccessRequestSchema = z.object({
	eventId: z.cuid(),
});

// TicketBody schema
export const ticketBodySchema = z.object({
	ticketId: z.cuid(),
});

// TicketIdParams schema
export const ticketIdParamsSchema = z.object({
	ticketId: z.cuid(),
});

// TicketIdQuery schema
export const ticketIdQuerySchema = z.object({
	ticketId: z.cuid().optional(),
});

// IdParams schema
export const idParamsSchema = z.object({
	id: z.cuid(),
});

/**
 * Type exports
 */
export type Session = z.infer<typeof sessionSchema>;
export type EventAccessRequest = z.infer<typeof eventAccessRequestSchema>;
export type TicketBody = z.infer<typeof ticketBodySchema>;
export type TicketIdParams = z.infer<typeof ticketIdParamsSchema>;
export type TicketIdQuery = z.infer<typeof ticketIdQuerySchema>;
export type IdParams = z.infer<typeof idParamsSchema>;
