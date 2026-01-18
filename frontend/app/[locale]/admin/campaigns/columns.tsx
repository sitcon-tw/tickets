"use client";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import type { EmailCampaign } from "@sitcontix/types";
import { ColumnDef } from "@tanstack/react-table";

export type CampaignDisplay = EmailCampaign & {
	statusClass: string;
	statusLabel: string;
	recipientsDisplay: string;
	formattedCreatedAt: string;
};

interface ColumnActions {
	onPreview: (campaign: EmailCampaign) => void;
	onSend: (campaign: EmailCampaign) => void;
	onCancel: (campaign: EmailCampaign) => void;
	t: {
		preview: string;
		send: string;
		cancel: string;
	};
}

export const createCampaignsColumns = (actions: ColumnActions): ColumnDef<CampaignDisplay>[] => [
	{
		accessorKey: "name",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
		cell: ({ row }) => {
			return <div className="max-w-[200px] truncate font-medium">{row.getValue("name")}</div>;
		}
	},
	{
		accessorKey: "subject",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />,
		cell: ({ row }) => {
			return <div className="max-w-[250px] truncate">{row.getValue("subject")}</div>;
		}
	},
	{
		accessorKey: "statusLabel",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
		cell: ({ row }) => {
			const campaign = row.original;
			return <span className={`status-badge ${campaign.statusClass}`}>{campaign.statusLabel}</span>;
		}
	},
	{
		accessorKey: "recipientsDisplay",
		header: "Recipients",
		cell: ({ row }) => {
			return <div>{row.getValue("recipientsDisplay")}</div>;
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
		id: "actions",
		cell: ({ row }) => {
			const campaign = row.original;

			return (
				<div className="flex gap-2 flex-wrap">
					<Button variant="secondary" size="sm" onClick={() => actions.onPreview(campaign)} disabled={campaign.status === "cancelled"}>
						👁 {actions.t.preview}
					</Button>
					{campaign.status === "draft" && (
						<Button size="sm" onClick={() => actions.onSend(campaign)}>
							📤 {actions.t.send}
						</Button>
					)}
					{campaign.status === "draft" && (
						<Button variant="destructive" size="sm" onClick={() => actions.onCancel(campaign)}>
							✕ {actions.t.cancel}
						</Button>
					)}
				</div>
			);
		}
	}
];
