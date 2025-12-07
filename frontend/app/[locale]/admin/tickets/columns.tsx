"use client";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import type { Ticket } from "@/lib/types/api";
import { ColumnDef } from "@tanstack/react-table";

export type TicketDisplay = Ticket & {
	displayName: string;
	formattedSaleStart: string;
	formattedSaleEnd: string;
	statusLabel: string;
	statusClass: string;
};

interface ColumnActions {
	onEdit: (ticket: Ticket) => void;
	onDelete: (ticketId: string) => void;
	onLinkBuilder: (ticket: Ticket) => void;
	t: {
		editTicket: string;
		delete: string;
		directLink: string;
		hidden: string;
	};
}

export const createTicketsColumns = (actions: ColumnActions): ColumnDef<TicketDisplay>[] => [
	{
		accessorKey: "displayName",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Ticket Type" />,
		cell: ({ row }) => {
			const ticket = row.original;
			return (
				<div className="flex items-center gap-2">
					<span className="font-medium">{ticket.displayName}</span>
					{ticket.hidden && (
						<span className="py-0.5 px-2 text-xs font-bold text-gray-100 dark:text-gray-200 bg-gray-600 dark:bg-gray-700 rounded border border-gray-500 dark:border-gray-600">{actions.t.hidden}</span>
					)}
				</div>
			);
		}
	},
	{
		accessorKey: "formattedSaleStart",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Start Time" />,
		cell: ({ row }) => {
			return <div>{row.getValue("formattedSaleStart")}</div>;
		}
	},
	{
		accessorKey: "formattedSaleEnd",
		header: ({ column }) => <DataTableColumnHeader column={column} title="End Time" />,
		cell: ({ row }) => {
			return <div>{row.getValue("formattedSaleEnd")}</div>;
		}
	},
	{
		accessorKey: "statusLabel",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
		cell: ({ row }) => {
			const ticket = row.original;
			return <span className={`status-badge ${ticket.statusClass}`}>{ticket.statusLabel}</span>;
		}
	},
	{
		accessorKey: "quantity",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" />,
		cell: ({ row }) => {
			return <div>{row.getValue("quantity")}</div>;
		}
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const ticket = row.original;

			return (
				<div className="flex gap-2 flex-wrap">
					<Button variant="secondary" size="sm" onClick={() => actions.onEdit(ticket)}>
						{actions.t.editTicket}
					</Button>
					<Button size="sm" onClick={() => actions.onLinkBuilder(ticket)}>
						{actions.t.directLink}
					</Button>
					<Button variant="destructive" size="sm" onClick={() => actions.onDelete(ticket.id)}>
						{actions.t.delete}
					</Button>
				</div>
			);
		}
	}
];
