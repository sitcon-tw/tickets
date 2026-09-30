"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { DataTableColumnHeaderProps } from "@/lib/types/data-table";
import { cn } from "@/lib/utils";
import { RowData } from "@tanstack/react-table";

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
		<button
			type="button"
			onClick={cycleSort}
			aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
			className={cn("-ml-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-medium hover:bg-accent hover:text-accent-foreground", className)}
		>
			<span>{title}</span>
			{sorted === "desc" ? <ArrowDown className="size-3.5" /> : sorted === "asc" ? <ArrowUp className="size-3.5" /> : <ChevronsUpDown className="size-3.5 opacity-40" />}
		</button>
	);
}
