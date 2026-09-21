import {
	columnFacetingFeature,
	columnFilteringFeature,
	columnVisibilityFeature,
	createFacetedRowModel,
	createFacetedUniqueValues,
	createFilteredRowModel,
	createPaginatedRowModel,
	createSortedRowModel,
	filterFns,
	rowPaginationFeature,
	rowSelectionFeature,
	rowSortingFeature,
	sortFns,
	tableFeatures
} from "@tanstack/react-table";

// Shared TanStack Table feature set for admin data tables
export const dataTableFeatures = tableFeatures({
	columnVisibilityFeature,
	columnFilteringFeature,
	columnFacetingFeature,
	rowSortingFeature,
	rowPaginationFeature,
	rowSelectionFeature,
	filteredRowModel: createFilteredRowModel(),
	sortedRowModel: createSortedRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
	facetedRowModel: createFacetedRowModel(),
	facetedUniqueValues: createFacetedUniqueValues(),
	filterFns,
	sortFns
});

export type DataTableFeatures = typeof dataTableFeatures;
