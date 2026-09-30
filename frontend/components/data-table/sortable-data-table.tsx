"use client";

import { Row, RowData, SortingState, flexRender, useTable } from "@tanstack/react-table";
import * as React from "react";

import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";
import { Inbox } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dataTableFeatures, type DataTableFeatures } from "@/lib/data-table-features";
import { DataTableProps } from "@/lib/types/data-table";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

type SortableRowData = RowData & { id: string };

interface SortableRowProps<TData extends SortableRowData> {
	row: Row<DataTableFeatures, TData>;
	children: React.ReactNode;
}

function SortableRow<TData extends SortableRowData>({ row, children }: SortableRowProps<TData>) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: row.original.id
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1
	};

	return (
		<TableRow ref={setNodeRef} style={style} data-state={row.getIsSelected() && "selected"}>
			<TableCell className="w-8 p-2">
				<div {...attributes} {...listeners} className="inline-flex cursor-grab touch-none rounded p-1 hover:bg-muted active:cursor-grabbing">
					<GripVertical className="h-4 w-4 text-muted-foreground" />
				</div>
			</TableCell>
			{children}
		</TableRow>
	);
}

export function SortableDataTable<TData extends SortableRowData>({ columns, data, isLoading = false, emptyMessage, emptyState, getRowId }: DataTableProps<TData>) {
	const locale = useLocale();
	const t = getTranslations(locale, {
		noResults: { "zh-Hant": "沒有符合的資料", "zh-Hans": "没有符合的数据", en: "No results" }
	});
	const [sorting, setSorting] = React.useState<SortingState>([]);

	const table = useTable({
		features: dataTableFeatures,
		data,
		columns,
		getRowId: getRowId ?? (row => row.id),
		// Drag-reordering can't cross pages, so this table is never paginated.
		initialState: { pagination: { pageIndex: 0, pageSize: Number.MAX_SAFE_INTEGER } },
		state: { sorting },
		onSortingChange: setSorting
	});

	const rows = table.getRowModel().rows;

	return (
		<div className="space-y-4">
			<div className="overflow-hidden rounded-xl border bg-card">
				<Table>
					<TableHeader className="bg-muted/40">
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id} className="hover:bg-transparent">
								<TableHead className="w-8"></TableHead>
								{headerGroup.headers.map(header => (
									<TableHead key={header.id} colSpan={header.colSpan} className="whitespace-nowrap">
										{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{rows.length ? (
							rows.map(row => (
								<SortableRow key={row.id} row={row}>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
									))}
								</SortableRow>
							))
						) : (
							<TableRow className="hover:bg-transparent">
								<TableCell colSpan={columns.length + 1} className="h-40 text-center">
									{isLoading
										? null
										: (emptyState ?? (
												<div className="flex flex-col items-center gap-2 text-muted-foreground">
													<Inbox className="size-8 opacity-60" />
													<span className="text-sm">{emptyMessage ?? t.noResults}</span>
												</div>
											))}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
