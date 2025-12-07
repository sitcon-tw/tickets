// Data Table Component Types
import { Column, ColumnDef, Table } from "@tanstack/react-table";

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

export interface DataTableColumnHeaderProps<TData, TValue> {
	column: Column<TData, TValue>;
	title: string;
	className?: string;
	style?: React.CSSProperties;
}
