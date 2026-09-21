// Column Action Types

export interface ColumnActions<TEditItem = string> {
	onEdit?: (item: TEditItem) => void;
	onDelete?: (id: string) => void;
	onView?: (id: string) => void;
}
