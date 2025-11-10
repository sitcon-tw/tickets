"use client";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types/api";
import { ColumnDef } from "@tanstack/react-table";

export type UserDisplay = User & {
	roleLabel: string;
	roleClass: string;
	statusLabel: string;
	statusClass: string;
	formattedCreatedAt: string;
	verifiedBadge?: string;
};

interface ColumnActions {
	onEdit: (user: User) => void;
	t: {
		edit: string;
		active: string;
		inactive: string;
		emailVerified: string;
	};
}

export const createUsersColumns = (actions: ColumnActions): ColumnDef<UserDisplay>[] => [
	{
		accessorKey: "name",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
		cell: ({ row }) => {
			return <div className="font-medium">{row.getValue("name")}</div>;
		}
	},
	{
		accessorKey: "email",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
		cell: ({ row }) => {
			const user = row.original;
			return (
				<div className="flex items-center gap-2">
					<span>{user.email}</span>
					{user.emailVerified && <span className="text-xs opacity-70">✓ {actions.t.emailVerified}</span>}
				</div>
			);
		}
	},
	{
		accessorKey: "roleLabel",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
		cell: ({ row }) => {
			const user = row.original;
			return <span className={`status-badge ${user.roleClass}`}>{user.roleLabel}</span>;
		}
	},
	{
		accessorKey: "statusLabel",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
		cell: ({ row }) => {
			const user = row.original;
			return <span className={`status-badge ${user.statusClass}`}>{user.statusLabel}</span>;
		}
	},
	{
		accessorKey: "formattedCreatedAt",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
		cell: ({ row }) => {
			return <div className="text-sm">{row.getValue("formattedCreatedAt")}</div>;
		}
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const user = row.original;

			return (
				<Button variant="secondary" size="sm" onClick={() => actions.onEdit(user)}>
					{actions.t.edit}
				</Button>
			);
		}
	}
];
