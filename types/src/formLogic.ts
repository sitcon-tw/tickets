/**
 * Form logic shared by the frontend and the backend: which fields are visible, whether an answer is empty,
 * and whether the answers are valid. Pure functions only; the clock is injected so both sides can use real instants.
 */

import type { FormFieldType } from "./common.js";
import { FieldFilterSchema, type FieldFilter, type FilterCondition, type FormFieldOption } from "./form.js";

/** The parts of a form field that the logic needs (satisfied by both the public and the admin field shapes). */
export interface FormLogicField {
	id: string;
	type: FormFieldType;
	required: boolean;
	validater?: string | null;
	options?: FormFieldOption[] | null;
	enableOther?: boolean | null;
	filters?: unknown;
}

export type FormAnswers = Record<string, unknown>;

export type FormErrorCode = "required" | "invalid_type" | "invalid_option" | "pattern" | "invalid_config";
export type FormErrors = Record<string, FormErrorCode[]>;

export interface FormLogicContext {
	ticketId: string;
	formData: FormAnswers;
	now: Date;
}

/** True for `undefined`, `null`, blank/whitespace-only strings, empty arrays and `false`. */
export function isEmptyAnswer(value: unknown): boolean {
	if (value === undefined || value === null || value === false) return true;
	if (typeof value === "string") return value.trim() === "";
	if (Array.isArray(value)) return value.length === 0;
	return false;
}

/** The strings a submitted answer may equal for one option (plain string, localized record, or legacy `{ label, value }`). */
export function optionValues(option: FormFieldOption): string[] {
	if (typeof option === "string") return [option];
	if (option === null || typeof option !== "object") return [];
	const legacy = option as { label?: unknown; value?: unknown };
	if (typeof legacy.value === "string") return [legacy.value];
	if (typeof legacy.label === "string") return [legacy.label];
	if (legacy.label && typeof legacy.label === "object") return Object.values(legacy.label as Record<string, unknown>).filter((v): v is string => typeof v === "string");
	return Object.values(option as Record<string, unknown>).filter((v): v is string => typeof v === "string");
}

function allowedValues(field: FormLogicField): string[] {
	return (field.options ?? []).flatMap(optionValues);
}

/** Parses a stored filter; an invalid filter is ignored (the field is always shown), the same as the public form-fields endpoint. */
export function normalizeFilter(raw: unknown): FieldFilter | null {
	if (!raw) return null;
	let value = raw;
	if (typeof value === "string") {
		try {
			value = JSON.parse(value);
		} catch {
			return null;
		}
	}
	const parsed = FieldFilterSchema.safeParse(value);
	return parsed.success && parsed.data.enabled ? parsed.data : null;
}

/** An answer as the text a condition compares against (arrays are joined with commas, like `String(array)`). */
function answerToText(answer: unknown): string {
	if (typeof answer === "string") return answer;
	if (typeof answer === "number" || typeof answer === "boolean" || typeof answer === "bigint") return answer.toString();
	if (Array.isArray(answer)) return answer.map(answerToText).join(",");
	return JSON.stringify(answer) ?? "";
}

function evaluateCondition(condition: FilterCondition, context: FormLogicContext, isVisible: (fieldId: string) => boolean, fieldIds: Set<string>): boolean {
	switch (condition.type) {
		case "ticket":
			return condition.ticketId ? context.ticketId === condition.ticketId : true;

		case "field": {
			if (!condition.fieldId || !fieldIds.has(condition.fieldId)) return true;
			// A hidden field does not have an answer, whatever is still in the form state.
			const answer = isVisible(condition.fieldId) ? context.formData[condition.fieldId] : undefined;
			switch (condition.operator ?? "equals") {
				case "filled":
					return !isEmptyAnswer(answer);
				case "notFilled":
					return isEmptyAnswer(answer);
				case "equals":
					return answer === undefined || answer === null ? false : answerToText(answer) === (condition.value ?? "");
				default:
					return true;
			}
		}

		case "time": {
			const now = context.now.getTime();
			const start = condition.startTime ? new Date(condition.startTime).getTime() : -Infinity;
			const end = condition.endTime ? new Date(condition.endTime).getTime() : Infinity;
			return now >= start && now <= end;
		}

		default:
			return true;
	}
}

/**
 * Ids of the fields that are shown. A field whose display conditions depend on itself (directly or not) counts as hidden.
 */
export function getVisibleFieldIds(fields: FormLogicField[], context: FormLogicContext): Set<string> {
	const byId = new Map(fields.map(field => [field.id, field]));
	const fieldIds = new Set(byId.keys());
	const resolved = new Map<string, boolean>();
	const visiting = new Set<string>();

	const isVisible = (fieldId: string): boolean => {
		const cached = resolved.get(fieldId);
		if (cached !== undefined) return cached;
		const field = byId.get(fieldId);
		if (!field) return true;
		if (visiting.has(fieldId)) return false;

		visiting.add(fieldId);
		const filter = normalizeFilter(field.filters);
		let visible = true;
		if (filter) {
			const results = filter.conditions.map(condition => evaluateCondition(condition, context, isVisible, fieldIds));
			const conditionsMet = filter.operator === "and" ? results.every(Boolean) : results.some(Boolean);
			visible = filter.action === "display" ? conditionsMet : !conditionsMet;
		}
		visiting.delete(fieldId);
		resolved.set(fieldId, visible);
		return visible;
	};

	return new Set(fields.filter(field => isVisible(field.id)).map(field => field.id));
}

/** Keeps only the answers of visible fields. */
export function pruneFormData(formData: FormAnswers, visibleIds: Set<string>): FormAnswers {
	return Object.fromEntries(Object.entries(formData).filter(([key]) => visibleIds.has(key)));
}

function matchesPattern(pattern: string, value: string): "ok" | "mismatch" | "broken" {
	try {
		return new RegExp(pattern).test(value) ? "ok" : "mismatch";
	} catch {
		return "broken";
	}
}

function validateAnswer(field: FormLogicField, value: unknown, previous: unknown): FormErrorCode[] {
	const errors: FormErrorCode[] = [];
	const allowed = allowedValues(field);

	switch (field.type) {
		case "text":
		case "textarea": {
			if (typeof value !== "string") return ["invalid_type"];
			// A broken pattern is a configuration problem the attendee cannot fix, so it is not enforced.
			if (field.validater && matchesPattern(field.validater, value) === "mismatch") errors.push("pattern");
			return errors;
		}

		case "select":
		case "radio": {
			if (typeof value !== "string") return ["invalid_type"];
			if (allowed.length === 0 || allowed.includes(value)) return errors;
			if (field.type === "radio" && field.enableOther) {
				if (field.validater) {
					const result = matchesPattern(field.validater, value);
					if (result === "mismatch") errors.push("pattern");
					if (result === "broken") errors.push("invalid_config");
				}
				return errors;
			}
			// An answer that was already stored stays valid even if the option has since been renamed or removed.
			if (value === previous) return errors;
			return ["invalid_option"];
		}

		case "checkbox": {
			if (allowed.length === 0) return typeof value === "boolean" ? errors : ["invalid_type"];
			if (!Array.isArray(value) || value.some(item => typeof item !== "string")) return ["invalid_type"];
			const stored = Array.isArray(previous) ? previous : [];
			if ((value as string[]).some(item => !allowed.includes(item) && !stored.includes(item))) return ["invalid_option"];
			return errors;
		}
	}
}

/**
 * Validates the answers of the visible fields.
 *
 * @param previousAnswers - The answers already stored for the registration (edits only); unchanged answers are not
 *   rejected for no longer being an available option.
 */
export function validateFormData(fields: FormLogicField[], context: FormLogicContext, previousAnswers: FormAnswers = {}): FormErrors {
	const visibleIds = getVisibleFieldIds(fields, context);
	const errors: FormErrors = {};

	for (const field of fields) {
		if (!visibleIds.has(field.id)) continue;

		const value = context.formData[field.id];
		if (isEmptyAnswer(value)) {
			if (field.required) {
				errors[field.id] = ["required"];
				continue;
			}
			// An optional whitespace-only string is still checked against the field's pattern/options.
			if (typeof value !== "string" || value === "") continue;
		}

		const fieldErrors = validateAnswer(field, value, previousAnswers[field.id]);
		if (fieldErrors.length > 0) errors[field.id] = fieldErrors;
	}

	return errors;
}
