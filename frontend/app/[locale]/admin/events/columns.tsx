"use client";

import { StatusBadge, type StatusTone } from "@/components/admin/StatusBadge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { DataTableFeatures } from "@/lib/data-table-features";
import type { Event } from "@sitcontix/types";
import { ColumnDef } from "@tanstack/react-table";
import { Copy, ExternalLink, Pencil, Trash2 } from "lucide-react";

export type EventStatus = "upcoming" | "active" | "ended";

export type EventWithStatus = Event & {
	status: EventStatus;
	statusLabel: string;
	displayName: string;
	displayLocation: string;
	/** Public URL segment: slug, or the last 6 characters of the id. */
	identifier: string;
	formattedStartDate: string;
	formattedEndDate: string;
};

const statusTone: Record<EventStatus, StatusTone> = {
	upcoming: "info",
	active: "success",
	ended: "neutral"
};

interface EventColumnActions {
	onEdit: (event: Event) => void;
	onDelete: (event: Event) => void;
	onCopyLink: (identifier: string) => void;
	getPublicUrl: (identifier: string) => string;
	t: {
		name: string;
		slug: string;
		location: string;
		startDate: string;
		endDate: string;
		status: string;
		actions: string;
		edit: string;
		delete: string;
		viewPage: string;
		copyLink: string;
		hidden: string;
	};
}

export const createEventsColumns = (actions: EventColumnActions): ColumnDef<DataTableFeatures, EventWithStatus>[] => [
	{
		accessorKey: "displayName",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.name} />,
		cell: ({ row }) => (
			<div className="flex flex-wrap items-center gap-2">
				<span className="font-medium">{row.original.displayName}</span>
				{row.original.hideEvent && <StatusBadge noDot>{actions.t.hidden}</StatusBadge>}
			</div>
		)
	},
	{
		accessorKey: "identifier",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.slug} />,
		cell: ({ row }) => {
			const { slug, identifier } = row.original;
			return (
				<div className="flex items-center gap-1">
					<span className={slug ? "font-mono text-sm" : "font-mono text-sm italic text-muted-foreground"}>{identifier}</span>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-7"
						aria-label={`${actions.t.copyLink}: ${identifier}`}
						title={actions.t.copyLink}
						onClick={() => actions.onCopyLink(identifier)}
					>
						<Copy className="size-3.5" />
					</Button>
				</div>
			);
		}
	},
	{
		accessorKey: "displayLocation",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.location} />,
		cell: ({ row }) => <div className="max-w-56 truncate">{row.original.displayLocation || <span className="text-muted-foreground">-</span>}</div>
	},
	{
		accessorKey: "formattedStartDate",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.startDate} />,
		cell: ({ row }) => <div className="whitespace-nowrap">{row.original.formattedStartDate}</div>
	},
	{
		accessorKey: "formattedEndDate",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.endDate} />,
		cell: ({ row }) => <div className="whitespace-nowrap">{row.original.formattedEndDate}</div>
	},
	{
		accessorKey: "statusLabel",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.status} />,
		cell: ({ row }) => <StatusBadge tone={statusTone[row.original.status]}>{row.original.statusLabel}</StatusBadge>
	},
	{
		id: "actions",
		enableSorting: false,
		header: () => <span className="sr-only">{actions.t.actions}</span>,
		cell: ({ row }) => {
			const event = row.original;
			return (
				<div className="flex flex-wrap items-center justify-end gap-1.5">
					<Button variant="outline" size="sm" onClick={() => actions.onEdit(event)}>
						<Pencil className="size-3.5" />
						{actions.t.edit}
					</Button>
					<Button asChild variant="ghost" size="sm">
						<a href={actions.getPublicUrl(event.identifier)} target="_blank" rel="noopener noreferrer">
							<ExternalLink className="size-3.5" />
							{actions.t.viewPage}
						</a>
					</Button>
					<Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => actions.onDelete(event)}>
						<Trash2 className="size-3.5" />
						{actions.t.delete}
					</Button>
				</div>
			);
		}
	}
];
