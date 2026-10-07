"use client";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { DataTableFeatures } from "@/lib/data-table-features";
import type { CheckInAttendee } from "@sitcontix/types";
import { ColumnDef } from "@tanstack/react-table";
import type { CheckInsT } from "./translations";

export type CheckInRow = CheckInAttendee & {
	displayName: string;
	displayTicket: string;
	formattedCheckedInAt: string;
};

type ColumnActions = {
	t: CheckInsT;
	pendingIds: ReadonlySet<string>;
	onToggle: (attendee: CheckInRow, checkedIn: boolean) => void;
};

export function CheckInBadge({ attendee, t }: { attendee: Pick<CheckInAttendee, "status" | "checkedIn">; t: Pick<CheckInsT, "checkedIn" | "notCheckedIn" | "cancelled"> }) {
	if (attendee.status === "cancelled") return <StatusBadge tone="danger">{t.cancelled}</StatusBadge>;
	return attendee.checkedIn ? <StatusBadge tone="info">{t.checkedIn}</StatusBadge> : <StatusBadge tone="neutral">{t.notCheckedIn}</StatusBadge>;
}

export const createCheckInColumns = ({ t, pendingIds, onToggle }: ColumnActions): ColumnDef<DataTableFeatures, CheckInRow>[] => [
	{
		accessorKey: "displayName",
		header: ({ column }) => <DataTableColumnHeader column={column} title={t.colAttendee} />,
		cell: ({ row }) => (
			<div className="max-w-[260px]">
				<div className="truncate font-medium" title={row.original.displayName}>
					{row.original.displayName}
				</div>
				{row.original.name && (
					<div className="truncate text-xs text-muted-foreground" title={row.original.email}>
						{row.original.email}
					</div>
				)}
			</div>
		)
	},
	{
		accessorKey: "phoneNumber",
		header: ({ column }) => <DataTableColumnHeader column={column} title={t.colPhone} />,
		cell: ({ row }) => <span className="whitespace-nowrap tabular-nums text-muted-foreground">{row.original.phoneNumber || "-"}</span>
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
		accessorKey: "checkedIn",
		header: ({ column }) => <DataTableColumnHeader column={column} title={t.colStatus} />,
		cell: ({ row }) => (
			<div className="flex flex-col items-start gap-1">
				<CheckInBadge attendee={row.original} t={t} />
				{row.original.checkedIn && row.original.status === "confirmed" && <span className="text-xs tabular-nums text-muted-foreground">{row.original.formattedCheckedInAt}</span>}
			</div>
		)
	},
	{
		id: "actions",
		header: () => <span className="sr-only">{t.colAction}</span>,
		cell: ({ row }) => {
			const attendee = row.original;
			const isPending = pendingIds.has(attendee.id);
			return (
				<div className="flex justify-end">
					{attendee.checkedIn ? (
						<Button size="sm" variant="outline" isLoading={isPending} onClick={() => onToggle(attendee, false)}>
							{t.undo}
						</Button>
					) : (
						<Button size="sm" variant="primary" isLoading={isPending} disabled={attendee.status !== "confirmed"} onClick={() => onToggle(attendee, true)}>
							{t.checkIn}
						</Button>
					)}
				</div>
			);
		},
		enableSorting: false
	}
];
