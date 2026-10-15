"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { DataTableFeatures } from "@/lib/data-table-features";
import { DataTableColumnHeaderProps } from "@/lib/types/data-table";
import { cn } from "@/lib/utils";
import { Column, RowData } from "@tanstack/react-table";
import type { AriaAttributes } from "react";

/** `aria-sort` for a column's `<th>`; undefined for columns that can't be sorted. */
export function getAriaSort<TData extends RowData, TValue>(column: Column<DataTableFeatures, TData, TValue>): AriaAttributes["aria-sort"] {
	if (!column.getCanSort()) return undefined;
	const sorted = column.getIsSorted();
	return sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none";
}

/** Sortable column header. Click cycles ascending → descending → unsorted. */
export function DataTableColumnHeader<TData extends RowData, TValue>({ column, title, className }: DataTableColumnHeaderProps<TData, TValue>) {
	if (!column.getCanSort()) {
		return <div className={cn(className)}>{title}</div>;
	}

	const sorted = column.getIsSorted();

	function cycleSort() {
		if (sorted === false) column.toggleSorting(false);
		else if (sorted === "asc") column.toggleSorting(true);
		else column.clearSorting();
	}

	return (
		<button type="button" onClick={cycleSort} className={cn("-ml-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-medium hover:bg-accent hover:text-accent-foreground", className)}>
			<span>{title}</span>
			{sorted === "desc" ? <ArrowDown className="size-3.5" /> : sorted === "asc" ? <ArrowUp className="size-3.5" /> : <ChevronsUpDown className="size-3.5 opacity-40" />}
		</button>
	);
}
