"use client";

import { StatusBadge, type StatusTone } from "@/components/admin/StatusBadge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableFeatures } from "@/lib/data-table-features";
import { formatDateTime } from "@/lib/utils/timezone";
import type { ColumnDef } from "@tanstack/react-table";
import { Ban, Copy } from "lucide-react";

import type { InviteRow, InviteStatus } from "./lib";

export const statusTones: Record<InviteStatus, StatusTone> = {
	available: "success",
	scheduled: "info",
	exhausted: "warning",
	expired: "danger",
	disabled: "neutral"
};

type ColumnActions = {
	onCopy: (row: InviteRow) => void;
	onDisable: (row: InviteRow) => void;
	t: Record<string, string>;
};

export const createInvitesColumns = ({ onCopy, onDisable, t }: ColumnActions): ColumnDef<DataTableFeatures, InviteRow>[] => [
	{
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
				onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
				aria-label={t.selectPage}
			/>
		),
		cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={value => row.toggleSelected(!!value)} aria-label={`${t.select}: ${row.original.code}`} />,
		enableSorting: false,
		enableHiding: false
	},
	{
		accessorKey: "code",
		header: ({ column }) => <DataTableColumnHeader column={column} title={t.code} />,
		cell: ({ row }) => (
			<div className="flex items-center gap-1">
				<span className="font-mono text-sm">{row.original.code}</span>
				<Button variant="ghost" size="icon" className="size-7" onClick={() => onCopy(row.original)} aria-label={`${t.copy}: ${row.original.code}`} title={t.copy}>
					<Copy className="size-3.5" />
				</Button>
			</div>
		)
	},
	{
		accessorKey: "name",
		header: ({ column }) => <DataTableColumnHeader column={column} title={t.group} />,
		cell: ({ row }) => (row.original.name ? <div className="max-w-[220px] truncate">{row.original.name}</div> : <span className="text-muted-foreground">-</span>)
	},
	{
		accessorKey: "ticketName",
		header: ({ column }) => <DataTableColumnHeader column={column} title={t.ticketType} />,
		cell: ({ row }) => <div className="max-w-[180px] truncate">{row.original.ticketName || "-"}</div>
	},
	{
		id: "usage",
		accessorFn: row => row.usedCount,
		header: ({ column }) => <DataTableColumnHeader column={column} title={t.usage} />,
		cell: ({ row }) => (
			<div className="whitespace-nowrap tabular-nums">
				{row.original.usedCount} / {row.original.usageLimit ?? t.unlimited}
			</div>
		)
	},
	{
		id: "validity",
		accessorFn: row => row.validUntilTs,
		header: ({ column }) => <DataTableColumnHeader column={column} title={t.validity} />,
		cell: ({ row }) => {
			const { validFrom, validUntil } = row.original;
			if (!validFrom && !validUntil) return <span className="text-muted-foreground">{t.noExpiry}</span>;
			return (
				<div className="whitespace-nowrap text-xs leading-5 text-muted-foreground">
					{validFrom && <div>{`${t.from} ${formatDateTime(validFrom)}`}</div>}
					{validUntil && <div>{`${t.until} ${formatDateTime(validUntil)}`}</div>}
				</div>
			);
		}
	},
	{
		id: "status",
		accessorFn: row => row.status,
		header: ({ column }) => <DataTableColumnHeader column={column} title={t.status} />,
		cell: ({ row }) => <StatusBadge tone={statusTones[row.original.status]}>{t[`status_${row.original.status}`]}</StatusBadge>
	},
	{
		accessorKey: "createdAtTs",
		header: ({ column }) => <DataTableColumnHeader column={column} title={t.created} />,
		cell: ({ row }) => <div className="whitespace-nowrap text-sm">{formatDateTime(row.original.createdAt)}</div>
	},
	{
		id: "actions",
		header: () => <span className="sr-only">{t.actions}</span>,
		cell: ({ row }) => (
			<div className="flex justify-end">
				<Button
					variant="ghost"
					size="icon"
					className="size-8 text-destructive hover:text-destructive"
					onClick={() => onDisable(row.original)}
					disabled={!row.original.isActive}
					aria-label={`${t.disable}: ${row.original.code}`}
					title={t.disable}
				>
					<Ban className="size-4" />
				</Button>
			</div>
		),
		enableSorting: false,
		enableHiding: false
	}
];
