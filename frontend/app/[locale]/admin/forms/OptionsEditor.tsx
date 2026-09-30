"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { LANGS, newOption, type QuestionOption } from "./types";

type OptionsEditorProps = {
	fieldId: string;
	options: QuestionOption[];
	t: Record<string, string>;
	onChange: (options: QuestionOption[]) => void;
};

export function OptionsEditor({ fieldId, options, t, onChange }: OptionsEditorProps) {
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [overIndex, setOverIndex] = useState<number | null>(null);

	const nameCounts = new Map<string, number>();
	for (const option of options) {
		const key = option.en.trim().toLowerCase();
		if (key) nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
	}

	function move(from: number, to: number) {
		if (from === to || to < 0 || to >= options.length) return;
		const next = [...options];
		const [moved] = next.splice(from, 1);
		next.splice(to, 0, moved);
		onChange(next);
	}

	function update(index: number, updates: Partial<QuestionOption>) {
		onChange(options.map((option, i) => (i === index ? { ...option, ...updates } : option)));
	}

	function clearDrag() {
		setDraggedIndex(null);
		setOverIndex(null);
	}

	return (
		<div className="space-y-2">
			{options.length === 0 && <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">{t.noOptions}</p>}
			<ol className="space-y-2">
				{options.map((option, index) => {
					const isDragging = draggedIndex === index;
					const isTarget = overIndex === index && draggedIndex !== null && draggedIndex !== index;
					const emptyName = !option.en.trim();
					const duplicated = (nameCounts.get(option.en.trim().toLowerCase()) || 0) > 1;
					return (
						<li
							key={option.id}
							onDragOver={e => {
								if (draggedIndex === null) return;
								e.preventDefault();
								e.dataTransfer.dropEffect = "move";
								if (overIndex !== index) setOverIndex(index);
							}}
							onDrop={e => {
								e.preventDefault();
								if (draggedIndex !== null) move(draggedIndex, index);
								clearDrag();
							}}
							className={cn("flex gap-2 rounded-lg border bg-card p-2 transition-colors", isDragging && "opacity-50", isTarget && "border-primary bg-primary/5")}
						>
							<div className="flex shrink-0 flex-col items-center gap-0.5">
								<button
									type="button"
									onClick={() => move(index, index - 1)}
									disabled={index === 0}
									aria-label={t.moveUp}
									className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
								>
									<ChevronUp className="size-4" />
								</button>
								<button
									type="button"
									draggable
									onDragStart={e => {
										e.dataTransfer.effectAllowed = "move";
										e.dataTransfer.setData("text/plain", option.id);
										setDraggedIndex(index);
									}}
									onDragEnd={clearDrag}
									aria-label={t.dragToReorder}
									title={t.dragToReorder}
									className="cursor-grab rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
								>
									<GripVertical className="size-4" />
								</button>
								<button
									type="button"
									onClick={() => move(index, index + 1)}
									disabled={index === options.length - 1}
									aria-label={t.moveDown}
									className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
								>
									<ChevronDown className="size-4" />
								</button>
							</div>
							<div className="min-w-0 flex-1 space-y-1.5">
								{LANGS.map(lang => (
									<div key={lang.key} className="flex items-center gap-2">
										<span title={lang.label} className="w-7 shrink-0 rounded bg-muted py-0.5 text-center text-[0.7rem] font-semibold text-muted-foreground">
											{lang.short}
										</span>
										<Input
											id={`${fieldId}-option-${option.id}-${lang.key}`}
											type="text"
											value={option[lang.key]}
											aria-label={`${t.option} ${index + 1} (${lang.label})`}
											aria-invalid={lang.key === "en" && (emptyName || duplicated) ? true : undefined}
											placeholder={lang.key === "en" ? t.optionRequiredPlaceholder : lang.label}
											onChange={e => update(index, { [lang.key]: e.target.value })}
											className="h-8 text-sm"
										/>
									</div>
								))}
								{duplicated && <p className="text-xs text-destructive">{t.optionDuplicate}</p>}
							</div>
							<Button
								type="button"
								variant="ghost"
								onClick={() => onChange(options.filter((_, i) => i !== index))}
								aria-label={`${t.deleteOption} ${index + 1}`}
								title={t.deleteOption}
								className="size-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
							>
								<Trash2 className="size-4" />
							</Button>
						</li>
					);
				})}
			</ol>
			<Button type="button" variant="outline" size="sm" onClick={() => onChange([...options, newOption()])} className="w-full border-dashed">
				<Plus className="size-4" />
				{t.addOption}
			</Button>
		</div>
	);
}
