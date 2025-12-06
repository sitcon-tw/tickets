export interface SessionUser {
	id: string;
	name: string;
	email: string;
	role?: string;
	permissions?: string;
	isActive?: boolean;
}

export interface Session {
	user: SessionUser;
	session: {
		id: string;
		userId: string;
		expiresAt: Date;
		token: string;
		ipAddress?: string | null;
		userAgent?: string | null;
	};
}

export interface EventAccessRequest {
	eventId?: string;
	id?: string;
}

export interface TicketBody {
	ticketId?: string;
}

export interface TicketIdParams {
	ticketId?: string;
}

export interface TicketIdQuery {
	ticketId?: string;
}

export interface IdParams {
	id?: string;
}
