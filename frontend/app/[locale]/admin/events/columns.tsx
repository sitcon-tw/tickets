"use client";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import type { Event } from "@/lib/types/api";
import { ColumnActions } from "@/lib/types/columns";
import { ColumnDef } from "@tanstack/react-table";

export type EventWithStatus = Event & {
	statusLabel: string;
	statusClass: string;
	displayName: string;
	formattedStartDate: string;
	formattedEndDate: string;
};

interface EventColumnActions extends ColumnActions {
	onEdit: (event: Event) => void;
	onDelete: (eventId: string) => void;
	t: {
		edit: string;
		delete: string;
	};
}

export const createEventsColumns = (actions: EventColumnActions): ColumnDef<EventWithStatus>[] => [
	{
		accessorKey: "displayName",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Event Name" />,
		cell: ({ row }) => {
			return <div className="font-medium">{row.getValue("displayName")}</div>;
		}
	},
	{
		accessorKey: "slug",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
		cell: ({ row }) => {
			const slug = row.getValue("slug") as string | undefined;
			const fallbackSlug = row.original.id.slice(-6);
			return <div className="font-mono text-sm">{slug || <span className="text-muted-foreground italic">{fallbackSlug}</span>}</div>;
		}
	},
	{
		accessorKey: "location",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
		cell: ({ row }) => {
			const location = row.getValue("location") as string | undefined;
			return <div className={location?.startsWith("https://") ? "text-muted-foreground italic" : ""}>{location ? (location.startsWith("https://") ? "(Google Map Link)" : location) : "-"}</div>;
		}
	},
	{
		accessorKey: "formattedStartDate",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Start Date" />,
		cell: ({ row }) => {
			return <div>{row.getValue("formattedStartDate")}</div>;
		}
	},
	{
		accessorKey: "formattedEndDate",
		header: ({ column }) => <DataTableColumnHeader column={column} title="End Date" />,
		cell: ({ row }) => {
			return <div>{row.getValue("formattedEndDate")}</div>;
		}
	},
	{
		accessorKey: "statusLabel",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
		cell: ({ row }) => {
			const status = row.original;
			return <span className={`status-badge ${status.statusClass}`}>{status.statusLabel}</span>;
		}
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const event = row.original;

			return (
				<div className="flex gap-2 flex-wrap">
					<Button variant="secondary" size="sm" onClick={() => actions.onEdit(event)}>
						{actions.t.edit}
					</Button>
					<Button variant="destructive" size="sm" onClick={() => actions.onDelete(event.id)}>
						{actions.t.delete}
					</Button>
				</div>
			);
		}
	}
];
