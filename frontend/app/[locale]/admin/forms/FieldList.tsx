"use client";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Copy, GripVertical, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { getQuestionTitle, type FieldIssue, type Question } from "./types";

type FieldListProps = {
	questions: Question[];
	selectedId: string | null;
	issues: FieldIssue[];
	locale: string;
	t: Record<string, string>;
	onSelect: (id: string) => void;
	onMove: (from: number, to: number) => void;
	onDuplicate: (id: string) => void;
	onDelete: (id: string) => void;
};

export function FieldList({ questions, selectedId, issues, locale, t, onSelect, onMove, onDuplicate, onDelete }: FieldListProps) {
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [overIndex, setOverIndex] = useState<number | null>(null);

	const typeLabels: Record<string, string> = { text: t.typeText, textarea: t.typeTextarea, select: t.typeSelect, radio: t.typeRadio, checkbox: t.typeCheckbox };

	function clearDrag() {
		setDraggedIndex(null);
		setOverIndex(null);
	}

	return (
		<ol className="space-y-2">
			{questions.map((q, index) => {
				const isSelected = q.id === selectedId;
				const isDragging = draggedIndex === index;
				const isTarget = overIndex === index && draggedIndex !== null && draggedIndex !== index;
				const issueCount = issues.filter(issue => issue.fieldId === q.id).length;
				const title = getQuestionTitle(q, locale, t.untitled);

				return (
					<li
						key={q.id}
						id={`field-row-${q.id}`}
						onDragOver={e => {
							if (draggedIndex === null) return;
							e.preventDefault();
							e.dataTransfer.dropEffect = "move";
							if (overIndex !== index) setOverIndex(index);
						}}
						onDrop={e => {
							e.preventDefault();
							if (draggedIndex !== null) onMove(draggedIndex, index);
							clearDrag();
						}}
						className={cn(
							"flex items-center gap-1 rounded-xl border bg-card p-2 transition-colors",
							isSelected ? "border-primary ring-1 ring-primary/40" : "hover:border-foreground/20",
							isDragging && "opacity-50",
							isTarget && "border-primary bg-primary/5"
						)}
					>
						<button
							type="button"
							draggable
							onDragStart={e => {
								e.dataTransfer.effectAllowed = "move";
								e.dataTransfer.setData("text/plain", q.id);
								const row = e.currentTarget.closest("li");
								if (row) e.dataTransfer.setDragImage(row, 16, 16);
								setDraggedIndex(index);
							}}
							onDragEnd={clearDrag}
							aria-label={t.dragToReorder}
							title={t.dragToReorder}
							className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
						>
							<GripVertical className="size-4" />
						</button>

						<button
							type="button"
							onClick={() => onSelect(q.id)}
							aria-current={isSelected ? "true" : undefined}
							className="min-w-0 flex-1 rounded-md px-1.5 py-1 text-left focus-visible:outline-2 focus-visible:outline-ring"
						>
							<span className="flex items-baseline gap-2">
								<span className="text-xs tabular-nums text-muted-foreground">{index + 1}</span>
								<span className="truncate text-sm font-medium">{title}</span>
							</span>
							<span className="mt-1.5 flex flex-wrap items-center gap-1.5">
								<StatusBadge noDot>{typeLabels[q.type]}</StatusBadge>
								{q.required && (
									<StatusBadge tone="warning" noDot>
										{t.fieldRequired}
									</StatusBadge>
								)}
								{q.filters?.enabled && (
									<StatusBadge tone="info" noDot>
										{t.conditional}
									</StatusBadge>
								)}
								{issueCount > 0 && <StatusBadge tone="danger">{t.issueCount.replace("{count}", String(issueCount))}</StatusBadge>}
							</span>
						</button>

						<div className="flex shrink-0 items-center">
							<Button type="button" variant="ghost" onClick={() => onMove(index, index - 1)} disabled={index === 0} aria-label={t.moveUp} title={t.moveUp} className="size-8 p-0 text-muted-foreground">
								<ChevronUp className="size-4" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								onClick={() => onMove(index, index + 1)}
								disabled={index === questions.length - 1}
								aria-label={t.moveDown}
								title={t.moveDown}
								className="size-8 p-0 text-muted-foreground"
							>
								<ChevronDown className="size-4" />
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button type="button" variant="ghost" aria-label={t.moreActions} title={t.moreActions} className="size-8 p-0 text-muted-foreground">
										<MoreVertical className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onSelect={() => onDuplicate(q.id)}>
										<Copy className="size-4" />
										{t.duplicateField}
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem variant="destructive" onSelect={() => onDelete(q.id)}>
										<Trash2 className="size-4" />
										{t.deleteField}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</li>
				);
			})}
		</ol>
	);
}
