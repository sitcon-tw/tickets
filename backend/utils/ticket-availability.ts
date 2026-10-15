/**
 * What the public may see of a ticket's stock. Tickets with `showRemaining` off only reveal whether any seat is left:
 * quantity becomes 1 and available 0/1, so the real numbers can't be read from any public endpoint.
 * `available` never goes negative, even when an admin lowered quantity below soldCount.
 */
export const publicTicketStock = (ticket: { quantity: number; soldCount: number; showRemaining: boolean }) => {
	const remaining = Math.max(0, ticket.quantity - ticket.soldCount);
	if (ticket.showRemaining) {
		return { quantity: ticket.quantity, available: remaining, soldCount: ticket.quantity - remaining };
	}
	const available = remaining > 0 ? 1 : 0;
	return { quantity: 1, available, soldCount: 1 - available };
};
