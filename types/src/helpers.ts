/**
 * Helper types for backend implementation
 * These are non-schema TypeScript interfaces for internal use
 */

/**
 * Event access request (for middleware)
 */
export interface EventAccessRequest {
	eventId?: string;
	id?: string;
}

/**
 * ID params (for route parameters)
 */
export interface IdParams {
	id: string;
}

/**
 * Ticket body (for ticket-related requests)
 */
export interface TicketBody {
	ticketId: string;
	[key: string]: unknown;
}

/**
 * Ticket ID params (for route parameters)
 */
export interface TicketIdParams {
	ticketId: string;
}

/**
 * Ticket ID query (for query parameters)
 */
export interface TicketIdQuery {
	ticketId: string;
}
