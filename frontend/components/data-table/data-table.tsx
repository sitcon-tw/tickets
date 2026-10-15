"use client";

import { ColumnFiltersState, PaginationState, RowData, RowSelectionState, SortingState, flexRender, useTable, type Updater } from "@tanstack/react-table";
import * as React from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTranslations } from "@/i18n/helpers";
import { dataTableFeatures } from "@/lib/data-table-features";
import { DataTableProps } from "@/lib/types/data-table";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";
import { useLocale } from "next-intl";

import { getAriaSort } from "./data-table-column-header";
import { DataTablePagination } from "./data-table-pagination";

function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
	return Array.from({ length: rows }, (_, rowIndex) => (
		<TableRow key={rowIndex} className="hover:bg-transparent">
			{Array.from({ length: columns }, (_, colIndex) => (
				<TableCell key={colIndex}>
					<div className="h-4 animate-pulse rounded bg-muted" style={{ width: `${55 + ((rowIndex * 7 + colIndex * 13) % 40)}%` }} />
				</TableCell>
			))}
		</TableRow>
	));
}

export function DataTable<TData extends RowData>({
	columns,
	data,
	isLoading = false,
	emptyMessage,
	emptyState,
	initialPageSize = 20,
	getRowId,
	onRowClick,
	rowSelection: controlledRowSelection,
	onRowSelectionChange,
	resetPageKey
}: DataTableProps<TData> & {
	/**
	 * For pages that filter `data` themselves (search box, status filter): pass e.g. the search text plus the status.
	 * Changing it goes back to page 1; other data changes (editing a row) keep the current page.
	 */
	resetPageKey?: string;
}) {
	const locale = useLocale();
	const t = getTranslations(locale, {
		noResults: { "zh-Hant": "沒有符合的資料", en: "No results" }
	});

	const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: initialPageSize });
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

	// A new search or filter starts again from page 1.
	const [prevResetPageKey, setPrevResetPageKey] = React.useState(resetPageKey);
	if (prevResetPageKey !== resetPageKey) {
		setPrevResetPageKey(resetPageKey);
		setPagination(prev => ({ ...prev, pageIndex: 0 }));
	}

	// Page index is not auto-reset on data changes (editing a row would jump back to page 1),
	// so keep it in range ourselves when rows are removed or filtered out.
	const lastPageIndex = Math.max(Math.ceil(data.length / pagination.pageSize) - 1, 0);
	if (!isLoading && pagination.pageIndex > lastPageIndex) {
		setPagination({ ...pagination, pageIndex: lastPageIndex });
	}

	const handleSortingChange = (updater: Updater<SortingState>) => {
		setSorting(updater);
		setPagination(prev => ({ ...prev, pageIndex: 0 }));
	};

	const handleColumnFiltersChange = (updater: Updater<ColumnFiltersState>) => {
		setColumnFilters(updater);
		setPagination(prev => ({ ...prev, pageIndex: 0 }));
	};

	const isSelectionControlled = controlledRowSelection !== undefined;
	const rowSelection = isSelectionControlled ? controlledRowSelection : internalRowSelection;
	const handleRowSelectionChange = (updater: Updater<RowSelectionState>) => {
		if (isSelectionControlled) {
			const next = typeof updater === "function" ? updater(controlledRowSelection) : updater;
			onRowSelectionChange?.(next);
		} else {
			setInternalRowSelection(updater);
		}
	};

	const hasSelectionColumn = columns.some(column => column.id === "select");

	const table = useTable({
		features: dataTableFeatures,
		data,
		columns,
		getRowId,
		state: {
			sorting,
			rowSelection,
			pagination,
			columnFilters
		},
		autoResetPageIndex: false,
		enableRowSelection: hasSelectionColumn,
		onRowSelectionChange: handleRowSelectionChange,
		onSortingChange: handleSortingChange,
		onColumnFiltersChange: handleColumnFiltersChange,
		onPaginationChange: setPagination
	});

	const rows = table.getRowModel().rows;

	return (
		<div className="space-y-4">
			<div className="overflow-hidden rounded-xl border bg-card">
				<Table>
					<TableHeader className="bg-muted/40">
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id} className="hover:bg-transparent">
								{headerGroup.headers.map(header => (
									<TableHead key={header.id} colSpan={header.colSpan} aria-sort={header.isPlaceholder ? undefined : getAriaSort(header.column)} className="whitespace-nowrap">
										{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableSkeleton columns={columns.length} />
						) : rows.length ? (
							rows.map(row => (
								<TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className={cn(onRowClick && "cursor-pointer")} onClick={onRowClick ? () => onRowClick(row.original) : undefined}>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow className="hover:bg-transparent">
								<TableCell colSpan={columns.length} className="h-40 text-center">
									{emptyState ?? (
										<div className="flex flex-col items-center gap-2 text-muted-foreground">
											<Inbox className="size-8 opacity-60" />
											<span className="text-sm">{emptyMessage ?? t.noResults}</span>
										</div>
									)}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{!isLoading && rows.length > 0 && <DataTablePagination table={table} showSelection={hasSelectionColumn} />}
		</div>
	);
}
