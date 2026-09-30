"use client";

import { StatusBadge, type StatusTone } from "@/components/admin/StatusBadge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { DataTableFeatures } from "@/lib/data-table-features";
import type { Ticket } from "@sitcontix/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Link2, Pencil, Trash2 } from "lucide-react";

export type TicketDisplay = Ticket & {
	displayName: string;
	formattedSaleStart: string;
	formattedSaleEnd: string;
	statusLabel: string;
	statusTone: StatusTone;
};

interface ColumnActions {
	onEdit: (ticket: Ticket) => void;
	onDelete: (ticket: Ticket) => void;
	onLinkBuilder: (ticket: Ticket) => void;
	onMove: (ticket: Ticket, direction: -1 | 1) => void;
	/** Total number of tickets, used to disable "move down" on the last row. */
	count: number;
	/** Disables every row action (e.g. while a new order is being saved). */
	busy: boolean;
	t: {
		ticketType: string;
		price: string;
		saleWindow: string;
		status: string;
		sold: string;
		actions: string;
		free: string;
		noLimit: string;
		hidden: string;
		inviteOnly: string;
		smsVerification: string;
		editTicket: string;
		delete: string;
		directLink: string;
		moveUp: string;
		moveDown: string;
	};
}

// Rows are always shown in the order attendees see them, so sorting by column is disabled: it would fight with drag-to-reorder.
export const createTicketsColumns = (actions: ColumnActions): ColumnDef<DataTableFeatures, TicketDisplay>[] => [
	{
		id: "name",
		accessorKey: "displayName",
		enableSorting: false,
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.ticketType} />,
		cell: ({ row }) => {
			const ticket = row.original;
			return (
				<div className="flex min-w-40 flex-wrap items-center gap-x-2 gap-y-1">
					<span className="font-medium">{ticket.displayName}</span>
					{ticket.hidden && (
						<StatusBadge noDot tone="neutral">
							{actions.t.hidden}
						</StatusBadge>
					)}
					{ticket.requireInviteCode && (
						<StatusBadge noDot tone="info">
							{actions.t.inviteOnly}
						</StatusBadge>
					)}
					{ticket.requireSmsVerification && (
						<StatusBadge noDot tone="info">
							{actions.t.smsVerification}
						</StatusBadge>
					)}
				</div>
			);
		}
	},
	{
		id: "price",
		accessorKey: "price",
		enableSorting: false,
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.price} />,
		cell: ({ row }) => {
			const price = row.original.price;
			return <div className="whitespace-nowrap tabular-nums">{price > 0 ? `NT$ ${price.toLocaleString()}` : actions.t.free}</div>;
		}
	},
	{
		id: "saleWindow",
		enableSorting: false,
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.saleWindow} />,
		cell: ({ row }) => {
			const { formattedSaleStart, formattedSaleEnd } = row.original;
			if (!formattedSaleStart && !formattedSaleEnd) return <span className="text-muted-foreground">{actions.t.noLimit}</span>;
			return (
				<div className="whitespace-nowrap text-sm tabular-nums">
					<div>{formattedSaleStart || "…"}</div>
					<div className="text-muted-foreground">→ {formattedSaleEnd || "…"}</div>
				</div>
			);
		}
	},
	{
		id: "status",
		accessorKey: "statusLabel",
		enableSorting: false,
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.status} />,
		cell: ({ row }) => <StatusBadge tone={row.original.statusTone}>{row.original.statusLabel}</StatusBadge>
	},
	{
		id: "sold",
		accessorKey: "soldCount",
		enableSorting: false,
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.sold} />,
		cell: ({ row }) => (
			<div className="whitespace-nowrap tabular-nums">
				{row.original.soldCount.toLocaleString()} <span className="text-muted-foreground">/ {row.original.quantity.toLocaleString()}</span>
			</div>
		)
	},
	{
		id: "actions",
		enableSorting: false,
		header: () => <span className="sr-only">{actions.t.actions}</span>,
		cell: ({ row }) => {
			const ticket = row.original;
			const label = ticket.displayName;

			return (
				<div className="flex items-center justify-end gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="size-8"
						disabled={actions.busy || row.index === 0}
						onClick={() => actions.onMove(ticket, -1)}
						aria-label={`${actions.t.moveUp}: ${label}`}
						title={actions.t.moveUp}
					>
						<ArrowUp className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="size-8"
						disabled={actions.busy || row.index === actions.count - 1}
						onClick={() => actions.onMove(ticket, 1)}
						aria-label={`${actions.t.moveDown}: ${label}`}
						title={actions.t.moveDown}
					>
						<ArrowDown className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="size-8"
						disabled={actions.busy}
						onClick={() => actions.onEdit(ticket)}
						aria-label={`${actions.t.editTicket}: ${label}`}
						title={actions.t.editTicket}
					>
						<Pencil className="size-4" />
					</Button>
					<Button variant="ghost" size="icon" className="size-8" onClick={() => actions.onLinkBuilder(ticket)} aria-label={`${actions.t.directLink}: ${label}`} title={actions.t.directLink}>
						<Link2 className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="size-8 text-destructive hover:text-destructive"
						disabled={actions.busy}
						onClick={() => actions.onDelete(ticket)}
						aria-label={`${actions.t.delete}: ${label}`}
						title={actions.t.delete}
					>
						<Trash2 className="size-4" />
					</Button>
				</div>
			);
		}
	}
];
