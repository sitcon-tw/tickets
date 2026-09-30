"use client";

import { StatusBadge, type StatusTone } from "@/components/admin/StatusBadge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DataTableFeatures } from "@/lib/data-table-features";
import { formatDateTime } from "@/lib/utils/timezone";
import type { EmailCampaign } from "@sitcontix/types";
import { ColumnDef } from "@tanstack/react-table";
import { Ban, Eye, Send } from "lucide-react";
import { fmt, type CampaignTranslations } from "./translations";

const STATUS_TONES: Record<string, StatusTone> = {
	draft: "neutral",
	sending: "info",
	sent: "success",
	cancelled: "danger"
};

export const getStatusTone = (status: string): StatusTone => STATUS_TONES[status] ?? "neutral";

interface ColumnActions {
	onPreview: (campaign: EmailCampaign) => void;
	onSend: (campaign: EmailCampaign) => void;
	onCancel: (campaign: EmailCampaign) => void;
	/** Campaign ids with a request in flight. */
	busyIds: ReadonlySet<string>;
	t: CampaignTranslations;
}

function RecipientsCell({ campaign, t }: { campaign: EmailCampaign; t: CampaignTranslations }) {
	const sent = campaign.sentCount || 0;
	const total = campaign.totalCount || 0;

	if (campaign.status === "sending") {
		return (
			<div className="w-40 space-y-1">
				<Progress value={total > 0 ? (sent / total) * 100 : 0} className="h-1.5" />
				<p className="text-xs tabular-nums text-muted-foreground">
					{sent} / {total}
				</p>
			</div>
		);
	}
	if (campaign.status === "sent") {
		const failed = Math.max(0, total - sent);
		return (
			<div className="flex flex-wrap items-center gap-2 text-sm tabular-nums">
				<span>
					{sent} / {total}
				</span>
				{failed > 0 && <span className="text-xs text-destructive">{fmt(t.failedCount, { count: failed })}</span>}
			</div>
		);
	}
	return <span className="text-sm tabular-nums text-muted-foreground">{campaign.status === "draft" ? fmt(t.estimatedRecipients, { count: total }) : total}</span>;
}

export const createCampaignsColumns = (actions: ColumnActions): ColumnDef<DataTableFeatures, EmailCampaign>[] => [
	{
		accessorKey: "name",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.name} />,
		cell: ({ row }) => <div className="max-w-[220px] truncate font-medium">{row.original.name}</div>
	},
	{
		accessorKey: "subject",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.subject} />,
		cell: ({ row }) => <div className="max-w-[260px] truncate text-muted-foreground">{row.original.subject}</div>
	},
	{
		accessorKey: "status",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.status} />,
		cell: ({ row }) => <StatusBadge tone={getStatusTone(row.original.status)}>{actions.t[row.original.status] || row.original.status}</StatusBadge>
	},
	{
		id: "recipients",
		header: actions.t.recipients,
		cell: ({ row }) => <RecipientsCell campaign={row.original} t={actions.t} />
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.createdAt} />,
		cell: ({ row }) => <div className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(new Date(row.original.createdAt))}</div>
	},
	{
		id: "actions",
		header: () => <span className="sr-only">{actions.t.actions}</span>,
		cell: ({ row }) => {
			const campaign = row.original;
			const busy = actions.busyIds.has(campaign.id);
			const isDraft = campaign.status === "draft";
			const isSending = campaign.status === "sending";

			return (
				<div className="flex flex-wrap justify-end gap-2">
					<Button variant="outline" size="sm" onClick={() => actions.onPreview(campaign)} disabled={busy}>
						<Eye className="size-4" />
						{actions.t.preview}
					</Button>
					{(isDraft || isSending) && (
						<Button size="sm" onClick={() => actions.onSend(campaign)} disabled={!isDraft || busy} title={isSending ? actions.t.sendingDisabled : undefined}>
							<Send className="size-4" />
							{actions.t.send}
						</Button>
					)}
					{(isDraft || isSending) && (
						<Button variant="ghost" size="sm" onClick={() => actions.onCancel(campaign)} disabled={!isDraft || busy} title={isSending ? actions.t.sendingDisabled : undefined}>
							<Ban className="size-4" />
							{actions.t.cancelCampaign}
						</Button>
					)}
				</div>
			);
		}
	}
];
