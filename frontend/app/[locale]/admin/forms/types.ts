import { fromDateTimeLocalString, toDateTimeLocalString } from "@/lib/utils/timezone";
import type { EventFormField, FieldFilter, FormFieldOption, FormFieldType, LocalizedText } from "@sitcontix/types";

export const LANGS = [
	{ key: "en", short: "EN", label: "English" },
	{ key: "zh-Hant", short: "繁", label: "繁體中文" },
	{ key: "zh-Hans", short: "简", label: "简体中文" }
] as const;
export type LangKey = (typeof LANGS)[number]["key"];

export const FIELD_TYPES: FormFieldType[] = ["text", "textarea", "select", "radio", "checkbox"];

export function typeHasOptions(type: FormFieldType) {
	return type === "select" || type === "radio" || type === "checkbox";
}

export type FilterConditionState = {
	type: "ticket" | "field" | "time";
	ticketId?: string;
	fieldId?: string;
	operator?: "equals" | "filled" | "notFilled";
	value?: string;
	startTime?: string;
	endTime?: string;
};

export type FieldFilterState = Omit<FieldFilter, "conditions"> & {
	conditions: FilterConditionState[];
};

export type QuestionOption = {
	id: string;
	en: string;
	"zh-Hant": string;
	"zh-Hans": string;
};

export type Question = {
	id: string;
	labelEn: string;
	labelZhHant: string;
	labelZhHans: string;
	type: FormFieldType;
	required: boolean;
	descriptionEn: string;
	descriptionZhHant: string;
	descriptionZhHans: string;
	placeholder: string;
	validater: string;
	options: QuestionOption[];
	prompts: Record<string, string[]>;
	filters?: FieldFilterState;
	enableOther: boolean;
};

export function newTempId() {
	return "temp-" + crypto.randomUUID();
}

export function isTempId(id: string) {
	return id.startsWith("temp-");
}

export function newOption(partial: Partial<QuestionOption> = {}): QuestionOption {
	return { id: crypto.randomUUID(), en: "", "zh-Hant": "", "zh-Hans": "", ...partial };
}

function toQuestionOption(opt: FormFieldOption): QuestionOption {
	if (typeof opt === "string") return newOption({ en: opt });
	if ("label" in opt && typeof opt.label === "object") {
		const label = opt.label;
		return newOption({ en: label["en"] || (typeof opt.value === "string" ? opt.value : "") || "", "zh-Hant": label["zh-Hant"] || "", "zh-Hans": label["zh-Hans"] || "" });
	}
	const record = opt as LocalizedText;
	return newOption({ en: record["en"] || "", "zh-Hant": record["zh-Hant"] || "", "zh-Hans": record["zh-Hans"] || "" });
}

function parseMaybeJson<T>(raw: unknown): T | undefined {
	if (typeof raw !== "string") return undefined;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return undefined;
	}
}

function parseOptions(field: EventFormField): QuestionOption[] {
	const raw: unknown = field.options || field.values;
	const list = Array.isArray(raw) ? raw : parseMaybeJson<FormFieldOption[]>(raw);
	return Array.isArray(list) ? (list as FormFieldOption[]).map(toQuestionOption) : [];
}

function parsePrompts(field: EventFormField): Record<string, string[]> {
	const raw: unknown = field.prompts;
	const value = typeof raw === "string" ? parseMaybeJson<Record<string, string[]>>(raw) : raw;
	if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, string[]>;
	return {};
}

function toLocalInput(value: Date | string | undefined): string | undefined {
	if (!value) return undefined;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : toDateTimeLocalString(date);
}

/** Converts an API form field into editable state. */
export function fieldToQuestion(field: EventFormField, id: string = field.id): Question {
	const name: LocalizedText = typeof field.name === "object" && field.name !== null ? field.name : { en: String(field.name ?? "") };
	const description: LocalizedText = field.description && typeof field.description === "object" ? field.description : {};
	const fallbackName = name["en"] || Object.values(name).find(Boolean) || "";

	const filters: FieldFilterState | undefined = field.filters
		? {
				enabled: field.filters.enabled,
				action: field.filters.action,
				operator: field.filters.operator,
				conditions: (field.filters.conditions || []).map(condition => ({
					...condition,
					startTime: toLocalInput(condition.startTime),
					endTime: toLocalInput(condition.endTime)
				}))
			}
		: undefined;

	return {
		id,
		labelEn: fallbackName,
		labelZhHant: name["zh-Hant"] || "",
		labelZhHans: name["zh-Hans"] || "",
		type: field.type,
		required: field.required || false,
		descriptionEn: description["en"] || "",
		descriptionZhHant: description["zh-Hant"] || "",
		descriptionZhHans: description["zh-Hans"] || "",
		placeholder: field.placeholder || "",
		validater: field.validater || "",
		options: parseOptions(field),
		prompts: parsePrompts(field),
		filters,
		enableOther: field.enableOther || false
	};
}

/** Copies fields from another event: new temp ids, field references remapped, ticket references cleared (tickets belong to the other event). */
export function copyFieldsToQuestions(fields: EventFormField[]): Question[] {
	const sorted = [...fields].sort((a, b) => a.order - b.order);
	const idMap = new Map(sorted.map(field => [field.id, newTempId()]));
	return sorted.map(field => {
		const question = fieldToQuestion(field, idMap.get(field.id)!);
		if (question.filters) {
			question.filters = {
				...question.filters,
				conditions: question.filters.conditions.map(condition => {
					if (condition.type === "ticket") return { ...condition, ticketId: undefined };
					if (condition.type === "field") return { ...condition, fieldId: condition.fieldId ? idMap.get(condition.fieldId) : undefined };
					return condition;
				})
			};
		}
		return question;
	});
}

export function createBlankQuestion(existing: Question[], defaults: { en: string; zhHant: string; zhHans: string }): Question {
	const names = new Set(existing.map(q => q.labelEn.trim().toLowerCase()));
	let n = existing.length + 1;
	while (names.has(`${defaults.en} ${n}`.toLowerCase())) n++;
	return {
		id: newTempId(),
		labelEn: `${defaults.en} ${n}`,
		labelZhHant: `${defaults.zhHant} ${n}`,
		labelZhHans: `${defaults.zhHans} ${n}`,
		type: "text",
		required: false,
		descriptionEn: "",
		descriptionZhHant: "",
		descriptionZhHans: "",
		placeholder: "",
		validater: "",
		options: [],
		prompts: {},
		enableOther: false
	};
}

export function duplicateQuestion(source: Question, existing: Question[], suffix: { en: string; zhHant: string; zhHans: string }): Question {
	const names = new Set(existing.map(q => q.labelEn.trim().toLowerCase()));
	let en = `${source.labelEn} ${suffix.en}`;
	let n = 2;
	while (names.has(en.trim().toLowerCase())) en = `${source.labelEn} ${suffix.en} ${n++}`;
	return {
		...structuredClone(source),
		id: newTempId(),
		labelEn: en,
		labelZhHant: source.labelZhHant ? `${source.labelZhHant} ${suffix.zhHant}` : "",
		labelZhHans: source.labelZhHans ? `${source.labelZhHans} ${suffix.zhHans}` : "",
		options: source.options.map(option => ({ ...option, id: crypto.randomUUID() }))
	};
}

export function getQuestionTitle(q: Question, locale: string, fallback = ""): string {
	return ((locale === "zh-Hant" && q.labelZhHant) || (locale === "zh-Hans" && q.labelZhHans) || q.labelEn || q.labelZhHant || q.labelZhHans || fallback).trim() || fallback;
}

export function serializeFilters(filters: FieldFilterState | undefined): FieldFilter | undefined {
	if (!filters) return undefined;
	return {
		...filters,
		conditions: filters.conditions.map(condition => ({
			...condition,
			startTime: condition.startTime ? fromDateTimeLocalString(condition.startTime) : undefined,
			endTime: condition.endTime ? fromDateTimeLocalString(condition.endTime) : undefined
		}))
	};
}

/** Body shared by create and update requests. */
export function buildFieldData(q: Question) {
	return {
		type: q.type,
		name: { en: q.labelEn, "zh-Hant": q.labelZhHant, "zh-Hans": q.labelZhHans },
		description: { en: q.descriptionEn, "zh-Hant": q.descriptionZhHant, "zh-Hans": q.descriptionZhHans },
		placeholder: q.placeholder,
		required: q.required,
		validater: q.type === "text" || q.type === "textarea" ? q.validater : "",
		values: typeHasOptions(q.type) ? q.options.map(({ id: _id, ...option }) => option) : [],
		prompts: q.type === "text" ? Object.fromEntries(Object.entries(q.prompts).map(([lang, lines]) => [lang, lines.map(line => line.trim()).filter(Boolean)])) : {},
		filters: serializeFilters(q.filters),
		enableOther: q.type === "radio" ? q.enableOther : undefined
	};
}

export function questionToEventFormField(q: Question, eventId: string, order: number): EventFormField {
	const data = buildFieldData(q);
	return {
		id: q.id,
		eventId,
		order,
		type: data.type,
		name: data.name,
		description: data.description,
		placeholder: data.placeholder || null,
		required: data.required,
		validater: data.validater || null,
		values: data.values,
		options: data.values,
		filters: data.filters ?? null,
		prompts: data.prompts,
		enableOther: data.enableOther ?? false
	};
}

export type IssueSection = "content" | "answer" | "conditions";
export type FieldIssue = { fieldId: string; section: IssueSection; message: string };

type IssueMessages = {
	nameRequired: string;
	nameDuplicate: string;
	optionsRequired: string;
	optionNameRequired: string;
	optionDuplicate: string;
	regexInvalid: string;
	filterNoConditions: string;
	conditionNoTicket: string;
	conditionNoField: string;
	conditionMissingField: string;
	conditionNoValue: string;
	conditionNoTime: string;
	conditionTimeOrder: string;
	conditionCircular: string;
};

export function validateQuestions(questions: Question[], m: IssueMessages): FieldIssue[] {
	const issues: FieldIssue[] = [];
	const ids = new Set(questions.map(q => q.id));
	const nameCounts = new Map<string, number>();
	for (const q of questions) {
		const key = q.labelEn.trim().toLowerCase();
		nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
	}

	const dependencies = new Map<string, string[]>();
	for (const q of questions) {
		const add = (section: IssueSection, message: string) => issues.push({ fieldId: q.id, section, message });

		if (!q.labelEn.trim()) add("content", m.nameRequired);
		else if ((nameCounts.get(q.labelEn.trim().toLowerCase()) || 0) > 1) add("content", m.nameDuplicate);

		if (typeHasOptions(q.type)) {
			if (q.options.length === 0 && q.type !== "checkbox") add("answer", m.optionsRequired);
			if (q.options.some(option => !option.en.trim())) add("answer", m.optionNameRequired);
			const seen = new Set<string>();
			let duplicated = false;
			for (const option of q.options) {
				const key = option.en.trim().toLowerCase();
				if (!key) continue;
				if (seen.has(key)) duplicated = true;
				seen.add(key);
			}
			if (duplicated) add("answer", m.optionDuplicate);
		}

		if ((q.type === "text" || q.type === "textarea") && q.validater.trim()) {
			try {
				RegExp(q.validater);
			} catch {
				add("answer", m.regexInvalid);
			}
		}

		if (q.filters?.enabled) {
			if (q.filters.conditions.length === 0) add("conditions", m.filterNoConditions);
			const refs: string[] = [];
			for (const condition of q.filters.conditions) {
				if (condition.type === "ticket" && !condition.ticketId) add("conditions", m.conditionNoTicket);
				if (condition.type === "field") {
					if (!condition.fieldId) add("conditions", m.conditionNoField);
					else if (condition.fieldId === q.id || !ids.has(condition.fieldId)) add("conditions", m.conditionMissingField);
					else refs.push(condition.fieldId);
					if ((condition.operator || "equals") === "equals" && !condition.value?.trim()) add("conditions", m.conditionNoValue);
				}
				if (condition.type === "time") {
					if (!condition.startTime && !condition.endTime) add("conditions", m.conditionNoTime);
					else if (condition.startTime && condition.endTime && condition.startTime > condition.endTime) add("conditions", m.conditionTimeOrder);
				}
			}
			dependencies.set(q.id, refs);
		}
	}

	// A field whose visibility depends (directly or not) on itself can never be resolved.
	for (const id of dependencies.keys()) {
		const seen = new Set<string>();
		const stack = [...(dependencies.get(id) || [])];
		let cyclic = false;
		while (stack.length > 0 && !cyclic) {
			const next = stack.pop()!;
			if (next === id) cyclic = true;
			else if (!seen.has(next)) {
				seen.add(next);
				stack.push(...(dependencies.get(next) || []));
			}
		}
		if (cyclic) issues.push({ fieldId: id, section: "conditions", message: m.conditionCircular });
	}

	return issues;
}
