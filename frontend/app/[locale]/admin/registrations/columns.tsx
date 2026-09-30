"use client";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableFeatures } from "@/lib/data-table-features";
import { ColumnDef } from "@tanstack/react-table";
import type { RegistrationsT } from "./translations";
import { statusTone, type AdminRegistration } from "./utils";

export type RegistrationDisplay = AdminRegistration & {
	displayId: string;
	displayTicket: string;
	displayReferredBy: string;
	formattedCreatedAt: string;
	formattedUpdatedAt: string;
};

interface ColumnActions {
	onViewDetails: (registration: RegistrationDisplay) => void;
	t: Pick<
		RegistrationsT,
		"colSelectAll" | "colSelectRow" | "colId" | "colEmail" | "colStatus" | "colTicket" | "colReferredBy" | "colCreated" | "colUpdated" | "viewDetails" | "confirmed" | "pending" | "cancelled"
	>;
}

export const createRegistrationsColumns = ({ onViewDetails, t }: ColumnActions): ColumnDef<DataTableFeatures, RegistrationDisplay>[] => {
	const statusLabels: Record<string, string> = { confirmed: t.confirmed, pending: t.pending, cancelled: t.cancelled };

	return [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
					onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
					onClick={e => e.stopPropagation()}
					aria-label={t.colSelectAll}
				/>
			),
			cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={value => row.toggleSelected(!!value)} onClick={e => e.stopPropagation()} aria-label={t.colSelectRow} />,
			enableSorting: false,
			enableHiding: false
		},
		{
			accessorKey: "displayId",
			header: ({ column }) => <DataTableColumnHeader column={column} title={t.colId} />,
			cell: ({ row }) => (
				<span className="font-mono text-xs text-muted-foreground" title={row.original.id}>
					{row.original.displayId}
				</span>
			)
		},
		{
			accessorKey: "email",
			header: ({ column }) => <DataTableColumnHeader column={column} title={t.colEmail} />,
			cell: ({ row }) => (
				<div className="max-w-[240px] truncate font-medium" title={row.original.email}>
					{row.original.email}
				</div>
			)
		},
		{
			accessorKey: "status",
			header: ({ column }) => <DataTableColumnHeader column={column} title={t.colStatus} />,
			cell: ({ row }) => <StatusBadge tone={statusTone(row.original.status)}>{statusLabels[row.original.status] ?? row.original.status}</StatusBadge>
		},
		{
			accessorKey: "displayTicket",
			header: ({ column }) => <DataTableColumnHeader column={column} title={t.colTicket} />,
			cell: ({ row }) => (
				<div className="max-w-[180px] truncate" title={row.original.displayTicket}>
					{row.original.displayTicket}
				</div>
			)
		},
		{
			accessorKey: "displayReferredBy",
			header: ({ column }) => <DataTableColumnHeader column={column} title={t.colReferredBy} />,
			cell: ({ row }) => (
				<div className="max-w-[200px] truncate text-muted-foreground" title={row.original.displayReferredBy}>
					{row.original.displayReferredBy || "-"}
				</div>
			)
		},
		{
			accessorKey: "formattedCreatedAt",
			header: ({ column }) => <DataTableColumnHeader column={column} title={t.colCreated} />,
			cell: ({ row }) => <span className="whitespace-nowrap text-sm tabular-nums">{row.original.formattedCreatedAt}</span>
		},
		{
			accessorKey: "formattedUpdatedAt",
			header: ({ column }) => <DataTableColumnHeader column={column} title={t.colUpdated} />,
			cell: ({ row }) => <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">{row.original.formattedUpdatedAt}</span>
		},
		{
			id: "actions",
			header: () => <span className="sr-only">{t.viewDetails}</span>,
			cell: ({ row }) => (
				<div className="flex justify-end">
					<Button
						size="sm"
						variant="outline"
						onClick={e => {
							e.stopPropagation();
							onViewDetails(row.original);
						}}
					>
						{t.viewDetails}
					</Button>
				</div>
			),
			enableSorting: false
		}
	];
};
