"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTranslations } from "@/i18n/helpers";
import { DataTablePaginationProps } from "@/lib/types/data-table";
import { RowData } from "@tanstack/react-table";
import { useLocale } from "next-intl";

const pageSizes = [10, 20, 50, 100];

export function DataTablePagination<TData extends RowData>({ table, showSelection = false }: DataTablePaginationProps<TData>) {
	const locale = useLocale();
	const t = getTranslations(locale, {
		total: { "zh-Hant": "共 {count} 筆", "zh-Hans": "共 {count} 条", en: "{count} results" },
		selected: { "zh-Hant": "已選取 {selected} / {count} 筆", "zh-Hans": "已选取 {selected} / {count} 条", en: "{selected} of {count} selected" },
		rowsPerPage: { "zh-Hant": "每頁筆數", "zh-Hans": "每页条数", en: "Rows per page" },
		page: { "zh-Hant": "第 {page} / {pages} 頁", "zh-Hans": "第 {page} / {pages} 页", en: "Page {page} of {pages}" },
		first: { "zh-Hant": "第一頁", "zh-Hans": "第一页", en: "First page" },
		previous: { "zh-Hant": "上一頁", "zh-Hans": "上一页", en: "Previous page" },
		next: { "zh-Hant": "下一頁", "zh-Hans": "下一页", en: "Next page" },
		last: { "zh-Hant": "最後一頁", "zh-Hans": "最后一页", en: "Last page" }
	});

	const { pageIndex, pageSize } = table.store.state.pagination;
	const rowCount = table.getFilteredRowModel().rows.length;
	const pageCount = Math.max(table.getPageCount(), 1);
	const selectedCount = table.getFilteredSelectedRowModel().rows.length;
	const smallestPageSize = pageSizes[0];

	const summary = showSelection ? t.selected.replace("{selected}", String(selectedCount)).replace("{count}", String(rowCount)) : t.total.replace("{count}", String(rowCount));

	return (
		<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-1">
			<div className="text-sm text-muted-foreground">{summary}</div>
			{rowCount > smallestPageSize || pageIndex > 0 ? (
				<div className="flex flex-wrap items-center gap-x-6 gap-y-3">
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">{t.rowsPerPage}</span>
						<Select value={`${pageSize}`} onValueChange={value => table.setPageSize(Number(value))}>
							<SelectTrigger size="sm" className="w-[72px]" aria-label={t.rowsPerPage}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent side="top">
								{pageSizes.map(size => (
									<SelectItem key={size} value={`${size}`}>
										{size}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="text-sm font-medium tabular-nums">{t.page.replace("{page}", String(pageIndex + 1)).replace("{pages}", String(pageCount))}</div>
					<div className="flex items-center gap-1">
						<Button variant="outline" size="icon" className="hidden size-8 sm:inline-flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} aria-label={t.first}>
							<ChevronsLeft className="size-4" />
						</Button>
						<Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label={t.previous}>
							<ChevronLeft className="size-4" />
						</Button>
						<Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label={t.next}>
							<ChevronRight className="size-4" />
						</Button>
						<Button variant="outline" size="icon" className="hidden size-8 sm:inline-flex" onClick={() => table.setPageIndex(pageCount - 1)} disabled={!table.getCanNextPage()} aria-label={t.last}>
							<ChevronsRight className="size-4" />
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}
