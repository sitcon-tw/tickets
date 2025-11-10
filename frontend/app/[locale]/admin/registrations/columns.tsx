"use client";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Registration } from "@/lib/types/api";
import { ColumnDef } from "@tanstack/react-table";

export type RegistrationDisplay = Registration & {
	displayId: string;
	displayTicket: string;
	displayEvent: string;
	displayReferredBy: string;
	formattedCreatedAt: string;
	formattedUpdatedAt: string;
	statusClass: string;
};

interface ColumnActions {
	onViewDetails: (registration: Registration) => void;
	t: {
		viewDetails: string;
	};
}

export const createRegistrationsColumns = (actions: ColumnActions): ColumnDef<RegistrationDisplay>[] => [
	{
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
				onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={value => row.toggleSelected(!!value)} aria-label="Select row" />,
		enableSorting: false,
		enableHiding: false
	},
	{
		accessorKey: "displayId",
		header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
		cell: ({ row }) => {
			return <div className="font-mono text-xs">{row.getValue("displayId")}</div>;
		}
	},
	{
		accessorKey: "email",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
		cell: ({ row }) => {
			return <div className="max-w-[200px] truncate">{row.getValue("email")}</div>;
		}
	},
	{
		accessorKey: "status",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
		cell: ({ row }) => {
			const reg = row.original;
			return <span className={`status-badge ${reg.statusClass}`}>{reg.status}</span>;
		}
	},
	{
		accessorKey: "displayTicket",
		header: "Ticket",
		cell: ({ row }) => {
			return <div className="max-w-[150px] truncate">{row.getValue("displayTicket")}</div>;
		}
	},
	{
		accessorKey: "displayEvent",
		header: "Event",
		cell: ({ row }) => {
			return <div className="max-w-[150px] truncate">{row.getValue("displayEvent")}</div>;
		}
	},
	{
		accessorKey: "displayReferredBy",
		header: "Referred By",
		cell: ({ row }) => {
			return <div className="font-mono text-xs">{row.getValue("displayReferredBy")}</div>;
		}
	},
	{
		accessorKey: "formattedCreatedAt",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
		cell: ({ row }) => {
			return <div className="text-sm">{row.getValue("formattedCreatedAt")}</div>;
		}
	},
	{
		accessorKey: "formattedUpdatedAt",
		header: "Updated",
		cell: ({ row }) => {
			return <div className="text-sm">{row.getValue("formattedUpdatedAt")}</div>;
		}
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const registration = row.original;

			return (
				<Button size="sm" onClick={() => actions.onViewDetails(registration)}>
					{actions.t.viewDetails}
				</Button>
			);
		}
	}
];
