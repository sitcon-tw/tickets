// Data Table Component Types
import { Column, ColumnDef, RowData, Table } from "@tanstack/react-table";

import { DataTableFeatures } from "@/lib/data-table-features";

export interface DataTableProps<TData extends RowData> {
	columns: ColumnDef<DataTableFeatures, TData>[];
	data: TData[];
}

export interface DataTableViewOptionsProps<TData extends RowData> {
	table: Table<DataTableFeatures, TData>;
}

export interface DataTablePaginationProps<TData extends RowData> {
	table: Table<DataTableFeatures, TData>;
}

export interface DataTableColumnHeaderProps<TData extends RowData, TValue> {
	column: Column<DataTableFeatures, TData, TValue>;
	title: string;
	className?: string;
	style?: React.CSSProperties;
}
