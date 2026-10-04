"use client";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { DataTableFeatures } from "@/lib/data-table-features";
import { LOGO_BG_CLASS, logoBackgroundStyle, safeLogoSrc } from "@/lib/utils/sponsor-logo";
import type { SponsorPlacement, SponsorWithStats } from "@sitcontix/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";

export type SponsorDisplay = SponsorWithStats & {
	displayName: string;
};

/** Click-through rate as a percentage string, or an em dash before the first impression. */
export function formatCtr(clicks: number, impressions: number) {
	return impressions > 0 ? `${((clicks / impressions) * 100).toFixed(2)}%` : "—";
}

interface ColumnActions {
	onEdit: (sponsor: SponsorWithStats) => void;
	onDelete: (sponsor: SponsorWithStats) => void;
	onMove: (sponsor: SponsorWithStats, direction: -1 | 1) => void;
	/** Total number of sponsors, used to disable "move down" on the last row. */
	count: number;
	/** Disables every row action (e.g. while a new order is being saved). */
	busy: boolean;
	t: {
		logo: string;
		sponsor: string;
		placements: string;
		impressions: string;
		clicks: string;
		ctr: string;
		linkClicks: string;
		actions: string;
		hidden: string;
		edit: string;
		delete: string;
		moveUp: string;
		moveDown: string;
		placementLabels: Record<SponsorPlacement, string>;
	};
}

// Rows are always shown in the order visitors see them, so sorting by column is disabled: it would fight with drag-to-reorder.
export const createSponsorsColumns = (actions: ColumnActions): ColumnDef<DataTableFeatures, SponsorDisplay>[] => [
	{
		id: "logo",
		enableSorting: false,
		header: () => <span className="sr-only">{actions.t.logo}</span>,
		cell: ({ row }) => (
			<div style={logoBackgroundStyle(row.original)} className={`flex h-12 w-24 items-center justify-center rounded-md border p-1.5 ${LOGO_BG_CLASS}`}>
				{/* oxlint-disable-next-line nextjs/no-img-element */}
				<img src={safeLogoSrc(row.original.logoUrl) ?? undefined} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
			</div>
		)
	},
	{
		id: "name",
		accessorKey: "displayName",
		enableSorting: false,
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.sponsor} />,
		cell: ({ row }) => (
			<div className="flex min-w-32 flex-wrap items-center gap-x-2 gap-y-1">
				<span className="font-medium">{row.original.displayName}</span>
				{!row.original.isActive && (
					<StatusBadge noDot tone="neutral">
						{actions.t.hidden}
					</StatusBadge>
				)}
			</div>
		)
	},
	{
		id: "placements",
		enableSorting: false,
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.placements} />,
		cell: ({ row }) => (
			<div className="flex flex-wrap gap-1">
				{row.original.placements.map(placement => (
					<StatusBadge key={placement} noDot tone="info">
						{actions.t.placementLabels[placement]}
					</StatusBadge>
				))}
			</div>
		)
	},
	{
		id: "impressions",
		accessorFn: row => row.stats.impressions,
		enableSorting: false,
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.impressions} />,
		cell: ({ row }) => <div className="tabular-nums">{row.original.stats.impressions.toLocaleString()}</div>
	},
	{
		id: "clicks",
		accessorFn: row => row.stats.clicks,
		enableSorting: false,
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.clicks} />,
		cell: ({ row }) => <div className="tabular-nums">{row.original.stats.clicks.toLocaleString()}</div>
	},
	{
		id: "ctr",
		enableSorting: false,
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.ctr} />,
		cell: ({ row }) => <div className="tabular-nums">{formatCtr(row.original.stats.clicks, row.original.stats.impressions)}</div>
	},
	{
		id: "linkClicks",
		accessorFn: row => row.stats.linkClicks,
		enableSorting: false,
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.linkClicks} />,
		cell: ({ row }) => <div className="tabular-nums">{row.original.stats.linkClicks.toLocaleString()}</div>
	},
	{
		id: "actions",
		enableSorting: false,
		header: () => <span className="sr-only">{actions.t.actions}</span>,
		cell: ({ row }) => {
			const sponsor = row.original;
			const label = sponsor.displayName;

			return (
				<div className="flex items-center justify-end gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="size-8"
						disabled={actions.busy || row.index === 0}
						onClick={() => actions.onMove(sponsor, -1)}
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
						onClick={() => actions.onMove(sponsor, 1)}
						aria-label={`${actions.t.moveDown}: ${label}`}
						title={actions.t.moveDown}
					>
						<ArrowDown className="size-4" />
					</Button>
					<Button variant="ghost" size="icon" className="size-8" disabled={actions.busy} onClick={() => actions.onEdit(sponsor)} aria-label={`${actions.t.edit}: ${label}`} title={actions.t.edit}>
						<Pencil className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="size-8 text-destructive hover:text-destructive"
						disabled={actions.busy}
						onClick={() => actions.onDelete(sponsor)}
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
