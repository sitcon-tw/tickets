// Data Table Component Types
import { Column, ColumnDef, RowData, RowSelectionState, Table } from "@tanstack/react-table";

import { DataTableFeatures } from "@/lib/data-table-features";

export interface DataTableProps<TData extends RowData> {
	columns: ColumnDef<DataTableFeatures, TData>[];
	data: TData[];
	/** Show skeleton rows instead of data. */
	isLoading?: boolean;
	/** Text for the default empty state. Defaults to a localized "No results". */
	emptyMessage?: string;
	/** Fully custom empty state (e.g. an <EmptyState> with a call to action). */
	emptyState?: React.ReactNode;
	/** Rows per page on first render. Defaults to 20. */
	initialPageSize?: number;
	/** Stable row id. Strongly recommended whenever row selection is used, otherwise selection is keyed by row index. */
	getRowId?: (row: TData, index: number) => string;
	/** Makes whole rows clickable. Interactive cells (buttons, links) should call e.stopPropagation(). */
	onRowClick?: (row: TData) => void;
	/** Controlled selection state. Pass together with `onRowSelectionChange` to read or clear the selection from the page. */
	rowSelection?: RowSelectionState;
	onRowSelectionChange?: (selection: RowSelectionState) => void;
}

export interface DataTableViewOptionsProps<TData extends RowData> {
	table: Table<DataTableFeatures, TData>;
}

export interface DataTablePaginationProps<TData extends RowData> {
	table: Table<DataTableFeatures, TData>;
	/** Show the "x of y selected" counter. */
	showSelection?: boolean;
}

export interface DataTableColumnHeaderProps<TData extends RowData, TValue> {
	column: Column<DataTableFeatures, TData, TValue>;
	title: string;
	className?: string;
	style?: React.CSSProperties;
}
