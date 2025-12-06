// Data Table Component Types
import { Column, ColumnDef, Table } from "@tanstack/react-table";
import * as React from "react";

export interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
}

export interface DataTableViewOptionsProps<TData> {
	table: Table<TData>;
}

export interface DataTablePaginationProps<TData> {
	table: Table<TData>;
}

export interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
	column: Column<TData, TValue>;
	title: string;
}
