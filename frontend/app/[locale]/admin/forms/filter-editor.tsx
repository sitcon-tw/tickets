"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLocalizedText } from "@/lib/utils/localization";
import type { Ticket } from "@sitcontix/types";
import { Plus, Trash2 } from "lucide-react";
import { getQuestionTitle, type FieldFilterState, type FilterConditionState, type Question } from "./types";

type UpdateQuestion = (id: string, updates: Partial<Question>) => void;
type Translations = Record<string, string>;

type FilterEditorProps = {
	question: Question;
	questions: Question[];
	eventTickets: Ticket[];
	locale: string;
	t: Translations;
	updateQuestion: UpdateQuestion;
};

const selectTriggerClass = "h-9 w-full text-sm";

function setQuestionFilter(question: Question, updateQuestion: UpdateQuestion, updates: Partial<FieldFilterState>) {
	if (!question.filters) return;
	updateQuestion(question.id, { filters: { ...question.filters, ...updates } });
}

function LabeledControl({ id, label, children, className }: { id: string; label: string; children: React.ReactNode; className?: string }) {
	return (
		<div className={className}>
			<Label htmlFor={id} className="mb-1.5 text-xs font-medium text-muted-foreground">
				{label}
			</Label>
			{children}
		</div>
	);
}

export function DisplayFiltersSection(props: FilterEditorProps) {
	const { question, t, updateQuestion } = props;
	const filter = question.filters;

	return (
		<div className="space-y-4">
			<div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
				<Checkbox
					id={`filters-enabled-${question.id}`}
					checked={filter?.enabled ?? false}
					onCheckedChange={checked => {
						updateQuestion(question.id, {
							filters: {
								enabled: checked === true,
								action: filter?.action || "display",
								operator: filter?.operator || "and",
								conditions: filter?.conditions || []
							}
						});
					}}
					className="mt-0.5"
				/>
				<div className="space-y-0.5">
					<Label htmlFor={`filters-enabled-${question.id}`} className="cursor-pointer text-sm font-medium">
						{t.enableFilters}
					</Label>
					<p className="text-xs text-muted-foreground">{t.enableFiltersHelp}</p>
				</div>
			</div>

			{filter?.enabled && (
				<>
					<div className="grid gap-3 sm:grid-cols-2">
						<LabeledControl id={`filter-action-${question.id}`} label={t.filterAction}>
							<Select value={filter.action} onValueChange={value => setQuestionFilter(question, updateQuestion, { action: value as "display" | "hide" })}>
								<SelectTrigger id={`filter-action-${question.id}`} className={selectTriggerClass}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="display">{t.actionDisplay}</SelectItem>
									<SelectItem value="hide">{t.actionHide}</SelectItem>
								</SelectContent>
							</Select>
						</LabeledControl>
						<LabeledControl id={`filter-operator-${question.id}`} label={t.filterOperator}>
							<Select value={filter.operator} onValueChange={value => setQuestionFilter(question, updateQuestion, { operator: value as "and" | "or" })}>
								<SelectTrigger id={`filter-operator-${question.id}`} className={selectTriggerClass}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="and">{t.operatorAnd}</SelectItem>
									<SelectItem value="or">{t.operatorOr}</SelectItem>
								</SelectContent>
							</Select>
						</LabeledControl>
					</div>

					<ol className="space-y-2">
						{filter.conditions.map((condition, index) => (
							<ConditionEditor
								key={index}
								{...props}
								filter={filter}
								condition={condition}
								index={index}
								onChange={next => {
									const conditions = [...filter.conditions];
									conditions[index] = next;
									setQuestionFilter(question, updateQuestion, { conditions });
								}}
								onRemove={() => setQuestionFilter(question, updateQuestion, { conditions: filter.conditions.filter((_, i) => i !== index) })}
							/>
						))}
					</ol>
					{filter.conditions.length === 0 && <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">{t.noConditions}</p>}

					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setQuestionFilter(question, updateQuestion, { conditions: [...filter.conditions, { type: "ticket" }] })}
						className="w-full border-dashed"
					>
						<Plus className="size-4" />
						{t.addCondition}
					</Button>
				</>
			)}
		</div>
	);
}

type ConditionEditorProps = FilterEditorProps & {
	filter: FieldFilterState;
	condition: FilterConditionState;
	index: number;
	onChange: (condition: FilterConditionState) => void;
	onRemove: () => void;
};

function ConditionEditor({ question, questions, eventTickets, locale, t, condition, index, onChange, onRemove }: ConditionEditorProps) {
	const baseId = `condition-${question.id}-${index}`;
	const referencedField = condition.type === "field" ? questions.find(q => q.id === condition.fieldId) : undefined;
	const valueOptions = referencedField && (referencedField.type === "select" || referencedField.type === "radio") ? referencedField.options.filter(o => o.en.trim()) : null;
	const operator = condition.operator || "equals";

	return (
		<li className="space-y-3 rounded-xl border bg-card p-3">
			<div className="flex items-end gap-2">
				<LabeledControl id={`${baseId}-type`} label={`${t.condition} ${index + 1}: ${t.conditionType}`} className="min-w-0 flex-1">
					<Select
						value={condition.type}
						onValueChange={value => {
							const type = value as FilterConditionState["type"];
							if (type === condition.type) return;
							onChange(type === "field" ? { type, operator: "equals" } : { type });
						}}
					>
						<SelectTrigger id={`${baseId}-type`} className={selectTriggerClass}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ticket">{t.typeTicket}</SelectItem>
							<SelectItem value="field">{t.typeField}</SelectItem>
							<SelectItem value="time">{t.typeTime}</SelectItem>
						</SelectContent>
					</Select>
				</LabeledControl>
				<Button
					type="button"
					variant="ghost"
					onClick={onRemove}
					aria-label={`${t.deleteCondition} ${index + 1}`}
					title={t.deleteCondition}
					className="size-9 shrink-0 p-0 text-muted-foreground hover:text-destructive"
				>
					<Trash2 className="size-4" />
				</Button>
			</div>

			{condition.type === "ticket" && (
				<LabeledControl id={`${baseId}-ticket`} label={t.selectTicket}>
					<Select value={condition.ticketId || ""} onValueChange={value => onChange({ ...condition, ticketId: value })}>
						<SelectTrigger id={`${baseId}-ticket`} className={selectTriggerClass} aria-invalid={!condition.ticketId ? true : undefined}>
							<SelectValue placeholder={t.selectTicket} />
						</SelectTrigger>
						<SelectContent>
							{eventTickets.map(ticket => (
								<SelectItem key={ticket.id} value={ticket.id}>
									{getLocalizedText(ticket.name, locale)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</LabeledControl>
			)}

			{condition.type === "field" && (
				<>
					<LabeledControl id={`${baseId}-field`} label={t.selectField}>
						<Select value={condition.fieldId || ""} onValueChange={value => onChange({ ...condition, fieldId: value, value: undefined })}>
							<SelectTrigger id={`${baseId}-field`} className={selectTriggerClass} aria-invalid={!referencedField ? true : undefined}>
								<SelectValue placeholder={t.selectField} />
							</SelectTrigger>
							<SelectContent>
								{questions
									.filter(field => field.id !== question.id)
									.map(field => (
										<SelectItem key={field.id} value={field.id}>
											{getQuestionTitle(field, locale, t.untitled)}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					</LabeledControl>
					<div className="grid gap-3 sm:grid-cols-2">
						<LabeledControl id={`${baseId}-operator`} label={t.fieldOperator}>
							<Select value={operator} onValueChange={value => onChange({ ...condition, operator: value as "equals" | "filled" | "notFilled" })}>
								<SelectTrigger id={`${baseId}-operator`} className={selectTriggerClass}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="equals">{t.operatorEquals}</SelectItem>
									<SelectItem value="filled">{t.operatorFilled}</SelectItem>
									<SelectItem value="notFilled">{t.operatorNotFilled}</SelectItem>
								</SelectContent>
							</Select>
						</LabeledControl>
						{operator === "equals" && (
							<LabeledControl id={`${baseId}-value`} label={t.fieldValue}>
								{valueOptions ? (
									<Select value={condition.value || ""} onValueChange={value => onChange({ ...condition, value })}>
										<SelectTrigger id={`${baseId}-value`} className={selectTriggerClass} aria-invalid={!condition.value ? true : undefined}>
											<SelectValue placeholder={t.selectValue} />
										</SelectTrigger>
										<SelectContent>
											{valueOptions.map(option => (
												<SelectItem key={option.id} value={option.en}>
													{option.en}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								) : (
									<Input
										id={`${baseId}-value`}
										type="text"
										value={condition.value || ""}
										placeholder={t.fieldValue}
										aria-invalid={!condition.value?.trim() ? true : undefined}
										onChange={e => onChange({ ...condition, value: e.target.value })}
										className="h-9 text-sm"
									/>
								)}
							</LabeledControl>
						)}
					</div>
				</>
			)}

			{condition.type === "time" && (
				<>
					<div className="grid gap-3 sm:grid-cols-2">
						<LabeledControl id={`${baseId}-start`} label={t.startTime}>
							<Input id={`${baseId}-start`} type="datetime-local" value={condition.startTime || ""} onChange={e => onChange({ ...condition, startTime: e.target.value })} className="h-9 text-sm" />
						</LabeledControl>
						<LabeledControl id={`${baseId}-end`} label={t.endTime}>
							<Input id={`${baseId}-end`} type="datetime-local" value={condition.endTime || ""} onChange={e => onChange({ ...condition, endTime: e.target.value })} className="h-9 text-sm" />
						</LabeledControl>
					</div>
					<p className="text-xs text-muted-foreground">{t.timeHelp}</p>
				</>
			)}
		</li>
	);
}
