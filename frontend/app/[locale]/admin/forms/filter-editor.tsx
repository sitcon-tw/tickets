"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FieldFilter, FilterCondition, Ticket } from "@sitcontix/types";
import { Plus, X } from "lucide-react";

type FilterConditionState = Omit<FilterCondition, "startTime" | "endTime"> & {
	startTime?: string;
	endTime?: string;
};

type FieldFilterState = Omit<FieldFilter, "conditions"> & {
	conditions: FilterConditionState[];
};

type Question = {
	id: string;
	label: string;
	labelEn?: string;
	labelZhHant?: string;
	labelZhHans?: string;
	type: string;
	required: boolean;
	description?: string;
	descriptionEn?: string;
	descriptionZhHant?: string;
	descriptionZhHans?: string;
	validater?: string;
	options?: Array<{
		id?: string;
		en: string;
		"zh-Hant"?: string;
		"zh-Hans"?: string;
	}>;
	prompts?: Record<string, string[]>;
	filters?: FieldFilterState;
	enableOther?: boolean;
};

type UpdateQuestion = (id: string, updates: Partial<Question>) => void;
type FilterTranslations = Record<string, string>;

type FilterEditorProps = {
	question: Question;
	questions: Question[];
	eventTickets: Ticket[];
	t: FilterTranslations;
	updateQuestion: UpdateQuestion;
};

type FilterConditionEditorProps = FilterEditorProps & {
	condition: FilterConditionState;
	conditionIndex: number;
};

function setQuestionFilter(question: Question, updateQuestion: UpdateQuestion, updates: Partial<FieldFilterState>) {
	if (!question.filters) return;
	updateQuestion(question.id, {
		filters: {
			...question.filters,
			...updates
		}
	});
}

function setFilterCondition(question: Question, updateQuestion: UpdateQuestion, conditionIndex: number, condition: FilterConditionState) {
	const conditions = [...(question.filters?.conditions || [])];
	conditions[conditionIndex] = condition;
	setQuestionFilter(question, updateQuestion, { conditions });
}

export function DisplayFiltersSection({ question, questions, eventTickets, t, updateQuestion }: FilterEditorProps) {
	return (
		<div>
			<div className="text-xs font-semibold text-gray-600 dark:text-gray-500 mb-2 uppercase tracking-wider">{t.displayFilters}</div>
			<div className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 flex flex-col gap-3">
				<label className="flex items-center gap-2 cursor-pointer select-none">
					<Checkbox
						checked={question.filters?.enabled || false}
						onCheckedChange={checked => {
							updateQuestion(question.id, {
								filters: {
									enabled: checked === true,
									action: question.filters?.action || "display",
									operator: question.filters?.operator || "and",
									conditions: question.filters?.conditions || []
								}
							});
						}}
					/>
					<span className="text-[0.85rem] font-medium text-gray-700 dark:text-gray-300">{t.enableFilters}</span>
				</label>

				{question.filters?.enabled && (
					<>
						<FilterControls question={question} t={t} updateQuestion={updateQuestion} />
						<FilterConditionList question={question} questions={questions} eventTickets={eventTickets} t={t} updateQuestion={updateQuestion} />
					</>
				)}
			</div>
		</div>
	);
}

function FilterControls({ question, t, updateQuestion }: Pick<FilterEditorProps, "question" | "t" | "updateQuestion">) {
	const filter = question.filters;
	if (!filter) return null;

	return (
		<div className="flex gap-2.5 flex-wrap">
			<div className="flex-1 min-w-[200px]">
				<Label className="block text-[0.7rem] text-gray-600 dark:text-gray-500 mb-1.5 font-medium">{t.filterAction}</Label>
				<Select value={filter.action} onValueChange={value => setQuestionFilter(question, updateQuestion, { action: value as "display" | "hide" })}>
					<SelectTrigger className="w-full text-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="display">{t.actionDisplay}</SelectItem>
						<SelectItem value="hide">{t.actionHide}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex-1 min-w-[200px]">
				<Label className="block text-[0.7rem] text-gray-600 dark:text-gray-500 mb-1.5 font-medium">{t.filterOperator}</Label>
				<Select value={filter.operator} onValueChange={value => setQuestionFilter(question, updateQuestion, { operator: value as "and" | "or" })}>
					<SelectTrigger className="w-full text-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="and">{t.operatorAnd}</SelectItem>
						<SelectItem value="or">{t.operatorOr}</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}

function FilterConditionList({ question, questions, eventTickets, t, updateQuestion }: FilterEditorProps) {
	return (
		<div className="flex flex-col gap-2.5">
			{(question.filters?.conditions || []).map((condition, conditionIndex) => (
				<FilterConditionEditor
					key={conditionIndex}
					question={question}
					questions={questions}
					eventTickets={eventTickets}
					t={t}
					updateQuestion={updateQuestion}
					condition={condition}
					conditionIndex={conditionIndex}
				/>
			))}

			<Button
				type="button"
				onClick={() => {
					const conditions = [...(question.filters?.conditions || []), { type: "ticket" as const }];
					setQuestionFilter(question, updateQuestion, { conditions });
				}}
				className="text-xs py-2 px-3 bg-white dark:bg-gray-800 border border-dashed border-gray-400 dark:border-gray-700 text-gray-600 dark:text-gray-400 w-full flex justify-center items-center gap-1.5"
			>
				<span className="text-base">
					<Plus />
				</span>{" "}
				{t.addCondition}
			</Button>
		</div>
	);
}

function FilterConditionEditor({ question, questions, eventTickets, t, updateQuestion, condition, conditionIndex }: FilterConditionEditorProps) {
	const removeCondition = () => {
		const conditions = [...(question.filters?.conditions || [])];
		conditions.splice(conditionIndex, 1);
		setQuestionFilter(question, updateQuestion, { conditions });
	};

	return (
		<div className="p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md flex flex-col gap-2">
			<div className="flex gap-2 items-start">
				<ConditionTypeSelect question={question} t={t} updateQuestion={updateQuestion} condition={condition} conditionIndex={conditionIndex} />
				<Button
					type="button"
					onClick={removeCondition}
					className="text-xs py-[0.45rem] px-2.5 bg-gray-100 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 text-red-600 dark:text-red-400 shrink-0 mt-[1.4rem]"
					title={t.deleteCondition}
				>
					<X size={14} />
				</Button>
			</div>

			{condition.type === "ticket" && (
				<TicketConditionFields question={question} eventTickets={eventTickets} t={t} updateQuestion={updateQuestion} condition={condition} conditionIndex={conditionIndex} />
			)}
			{condition.type === "field" && <FieldConditionFields question={question} questions={questions} t={t} updateQuestion={updateQuestion} condition={condition} conditionIndex={conditionIndex} />}
			{condition.type === "time" && <TimeConditionFields question={question} t={t} updateQuestion={updateQuestion} condition={condition} conditionIndex={conditionIndex} />}
		</div>
	);
}

function ConditionTypeSelect({ question, t, updateQuestion, condition, conditionIndex }: Omit<FilterConditionEditorProps, "questions" | "eventTickets">) {
	return (
		<div className="flex-1">
			<Label className="block text-[0.7rem] text-gray-600 dark:text-gray-500 mb-1.5 font-medium">{t.conditionType}</Label>
			<Select
				value={condition.type}
				onValueChange={value => {
					setFilterCondition(question, updateQuestion, conditionIndex, { type: value as "ticket" | "field" | "time" });
				}}
			>
				<SelectTrigger className="w-full text-xs">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="ticket">{t.typeTicket}</SelectItem>
					<SelectItem value="field">{t.typeField}</SelectItem>
					<SelectItem value="time">{t.typeTime}</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}

function TicketConditionFields({ question, eventTickets, t, updateQuestion, condition, conditionIndex }: Omit<FilterConditionEditorProps, "questions">) {
	return (
		<div>
			<Label className="block text-[0.7rem] text-gray-600 dark:text-gray-500 mb-1.5 font-medium">{t.selectTicket}</Label>
			<Select
				value={condition.ticketId || ""}
				onValueChange={value => {
					setFilterCondition(question, updateQuestion, conditionIndex, { ...condition, ticketId: value });
				}}
			>
				<SelectTrigger className="w-full text-xs">
					<SelectValue placeholder={`${t.selectTicket}...`} />
				</SelectTrigger>
				<SelectContent>
					{eventTickets.map(ticket => (
						<SelectItem key={ticket.id} value={ticket.id}>
							{ticket.name && typeof ticket.name === "object" ? ticket.name["en"] || Object.values(ticket.name)[0] : ticket.name || ""}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

function FieldConditionFields({ question, questions, t, updateQuestion, condition, conditionIndex }: Omit<FilterConditionEditorProps, "eventTickets">) {
	return (
		<>
			<div>
				<Label className="block text-[0.7rem] text-gray-600 dark:text-gray-500 mb-1.5 font-medium">{t.selectField}</Label>
				<Select
					value={condition.fieldId || ""}
					onValueChange={value => {
						setFilterCondition(question, updateQuestion, conditionIndex, { ...condition, fieldId: value });
					}}
				>
					<SelectTrigger className="w-full text-xs">
						<SelectValue placeholder={`${t.selectField}...`} />
					</SelectTrigger>
					<SelectContent>
						{questions.flatMap(field =>
							field.id === question.id
								? []
								: [
										<SelectItem key={field.id} value={field.id}>
											{field.labelEn || field.label}
										</SelectItem>
									]
						)}
					</SelectContent>
				</Select>
			</div>

			<div className="flex gap-2">
				<div className="flex-1">
					<Label className="block text-[0.7rem] text-gray-600 dark:text-gray-500 mb-1.5 font-medium">{t.fieldOperator}</Label>
					<Select
						value={condition.operator || "equals"}
						onValueChange={value => {
							setFilterCondition(question, updateQuestion, conditionIndex, { ...condition, operator: value as "equals" | "filled" | "notFilled" });
						}}
					>
						<SelectTrigger className="w-full text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="equals">{t.operatorEquals}</SelectItem>
							<SelectItem value="filled">{t.operatorFilled}</SelectItem>
							<SelectItem value="notFilled">{t.operatorNotFilled}</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{condition.operator === "equals" && (
					<div className="flex-1">
						<Label className="block text-[0.7rem] text-gray-600 dark:text-gray-500 mb-1.5 font-medium">{t.fieldValue}</Label>
						<Input
							type="text"
							value={condition.value || ""}
							placeholder={t.fieldValue}
							onChange={e => {
								setFilterCondition(question, updateQuestion, conditionIndex, { ...condition, value: e.target.value });
							}}
							className="w-full text-xs"
						/>
					</div>
				)}
			</div>
		</>
	);
}

function TimeConditionFields({ question, t, updateQuestion, condition, conditionIndex }: Omit<FilterConditionEditorProps, "questions" | "eventTickets">) {
	return (
		<>
			<div>
				<Label className="block text-[0.7rem] text-gray-600 dark:text-gray-500 mb-1.5 font-medium">{t.startTime}</Label>
				<Input
					type="datetime-local"
					value={condition.startTime || ""}
					onChange={e => {
						setFilterCondition(question, updateQuestion, conditionIndex, { ...condition, startTime: e.target.value });
					}}
					className="w-full text-xs"
				/>
			</div>

			<div>
				<Label className="block text-[0.7rem] text-gray-600 dark:text-gray-500 mb-1.5 font-medium">{t.endTime}</Label>
				<Input
					type="datetime-local"
					value={condition.endTime || ""}
					onChange={e => {
						setFilterCondition(question, updateQuestion, conditionIndex, { ...condition, endTime: e.target.value });
					}}
					className="w-full text-xs"
				/>
			</div>
		</>
	);
}
