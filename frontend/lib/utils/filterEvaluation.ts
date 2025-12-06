import type { EventFormField, FilterCondition } from "@/lib/types/api";
import type { FormDataType } from "@/lib/types/data";

/**
 * Evaluates whether a form field should be displayed based on its filter conditions
 *
 * @param field - The form field with potential filters
 * @param context - The evaluation context containing current state
 * @param allFields - All form fields (needed for field-based conditions)
 * @returns true if the field should be displayed, false otherwise
 */
export function shouldDisplayField(
	field: EventFormField,
	context: {
		selectedTicketId: string;
		formData: FormDataType;
		currentTime?: Date;
	},
	allFields?: EventFormField[]
): boolean {
	if (!field.filters || !field.filters.enabled) {
		return true;
	}

	const filter = field.filters;
	const currentTime = context.currentTime || new Date();

	const results = filter.conditions.map(condition => evaluateCondition(condition, context, currentTime, allFields));

	const conditionsMet = filter.operator === "and" ? results.every(r => r) : results.some(r => r);

	return filter.action === "display" ? conditionsMet : !conditionsMet;
}

/**
 * Evaluates a single filter condition
 */
function evaluateCondition(
	condition: FilterCondition,
	context: {
		selectedTicketId: string;
		formData: FormDataType;
	},
	currentTime: Date,
	allFields?: EventFormField[]
): boolean {
	switch (condition.type) {
		case "ticket":
			return evaluateTicketCondition(condition, context);

		case "field":
			return evaluateFieldCondition(condition, context, allFields);

		case "time":
			return evaluateTimeCondition(condition, currentTime);

		default:
			return true; // Unknown condition types default to true
	}
}

/**
 * Evaluates a ticket-based condition
 */
function evaluateTicketCondition(condition: FilterCondition, context: { selectedTicketId: string }): boolean {
	if (!condition.ticketId) {
		return true;
	}
	return context.selectedTicketId === condition.ticketId;
}

function evaluateFieldCondition(condition: FilterCondition, context: { formData: FormDataType }, allFields?: EventFormField[]): boolean {
	if (!condition.fieldId || !allFields) {
		return true;
	}

	const referencedField = allFields.find(f => f.id === condition.fieldId);
	if (!referencedField) {
		return true;
	}

	const possibleKeys = [condition.fieldId, referencedField.id];

	if (typeof referencedField.name === "object" && referencedField.name !== null) {
		Object.values(referencedField.name).forEach(name => {
			if (name) possibleKeys.push(String(name));
		});
	} else if (typeof referencedField.name === "string") {
		possibleKeys.push(referencedField.name);
	}

	let fieldValue: unknown = undefined;
	let foundKey: string | undefined;
	for (const key of possibleKeys) {
		if (key in context.formData) {
			fieldValue = context.formData[key];
			foundKey = key;
			break;
		}
	}

	const operator = condition.operator || "equals";

	switch (operator) {
		case "filled":
			return isFilled(fieldValue);

		case "notFilled":
			return !isFilled(fieldValue);

		case "equals":
			const result = String(fieldValue) === String(condition.value);
			return result;

		default:
			return true;
	}
}

/**
 * Checks if a field value is considered "filled"
 */
function isFilled(value: unknown): boolean {
	if (value === undefined || value === null || value === "") {
		return false;
	}

	// For arrays (checkbox/multi-select), check if it has items
	if (Array.isArray(value)) {
		return value.length > 0;
	}

	// For boolean values, consider them filled if true
	if (typeof value === "boolean") {
		return value;
	}

	return true;
}

/**
 * Evaluates a time-based condition
 */
function evaluateTimeCondition(condition: FilterCondition, currentTime: Date): boolean {
	const now = currentTime.getTime();

	// Parse start and end times
	const startTime = condition.startTime ? new Date(condition.startTime).getTime() : -Infinity;

	const endTime = condition.endTime ? new Date(condition.endTime).getTime() : Infinity;

	// Check if current time is within the range
	return now >= startTime && now <= endTime;
}

/**
 * Filters an array of form fields based on their display conditions
 *
 * @param fields - Array of form fields to filter
 * @param context - The evaluation context
 * @returns Filtered array of fields that should be displayed
 */
export function filterVisibleFields(
	fields: EventFormField[],
	context: {
		selectedTicketId: string;
		formData: FormDataType;
		currentTime?: Date;
	}
): EventFormField[] {
	return fields.filter(field => shouldDisplayField(field, context, fields));
}
