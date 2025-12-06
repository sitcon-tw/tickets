// Column Action Types

export interface ColumnActions {
	onEdit?: (id: any) => void;
	onDelete?: (id: string) => void;
	onView?: (id: string) => void;
}
