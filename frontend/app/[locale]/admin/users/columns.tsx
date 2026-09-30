"use client";

import { StatusBadge, type StatusTone } from "@/components/admin/StatusBadge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { DataTableFeatures } from "@/lib/data-table-features";
import type { User } from "@sitcontix/types";
import { ColumnDef } from "@tanstack/react-table";

export type UserDisplay = User & {
	roleLabel: string;
	roleTone: StatusTone;
	statusLabel: string;
	statusTone: StatusTone;
	phoneDisplay: string;
	phoneIsVerified: boolean;
	createdAtTimestamp: number;
	formattedCreatedAt: string;
};

interface ColumnActions {
	onEdit: (user: User) => void;
	t: {
		name: string;
		email: string;
		phone: string;
		role: string;
		status: string;
		createdAt: string;
		edit: string;
		emailVerified: string;
		emailNotVerified: string;
	};
}

export const createUsersColumns = (actions: ColumnActions): ColumnDef<DataTableFeatures, UserDisplay>[] => [
	{
		accessorKey: "name",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.name} />,
		cell: ({ row }) => <div className="font-medium">{row.original.name}</div>
	},
	{
		accessorKey: "email",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.email} />,
		cell: ({ row }) => {
			const user = row.original;
			return (
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<span>{user.email}</span>
					{user.emailVerified ? <StatusBadge tone="success">{actions.t.emailVerified}</StatusBadge> : <StatusBadge tone="neutral">{actions.t.emailNotVerified}</StatusBadge>}
				</div>
			);
		}
	},
	{
		accessorKey: "phoneDisplay",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.phone} />,
		cell: ({ row }) => {
			const user = row.original;
			if (!user.phoneDisplay) return <span className="text-muted-foreground">-</span>;
			return (
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<span className="tabular-nums">{user.phoneDisplay}</span>
					{user.phoneIsVerified && <StatusBadge tone="success">{actions.t.emailVerified}</StatusBadge>}
				</div>
			);
		}
	},
	{
		accessorKey: "roleLabel",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.role} />,
		cell: ({ row }) => <StatusBadge tone={row.original.roleTone}>{row.original.roleLabel}</StatusBadge>
	},
	{
		accessorKey: "statusLabel",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.status} />,
		cell: ({ row }) => <StatusBadge tone={row.original.statusTone}>{row.original.statusLabel}</StatusBadge>
	},
	{
		accessorKey: "createdAtTimestamp",
		header: ({ column }) => <DataTableColumnHeader column={column} title={actions.t.createdAt} />,
		cell: ({ row }) => <div className="whitespace-nowrap text-sm text-muted-foreground">{row.original.formattedCreatedAt}</div>
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const user = row.original;
			return (
				<Button
					variant="secondary"
					size="sm"
					onClick={e => {
						e.stopPropagation();
						actions.onEdit(user);
					}}
				>
					{actions.t.edit}
				</Button>
			);
		}
	}
];
