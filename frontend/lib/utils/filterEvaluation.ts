import type { EventFormField, FieldFilter, FilterCondition } from "@/lib/types/api";

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
		formData: Record<string, any>;
		currentTime?: Date;
	},
	allFields?: EventFormField[]
): boolean {
	// If no filters or filters not enabled, always display
	if (!field.filters || !field.filters.enabled) {
		return true;
	}

	const filter = field.filters;
	const currentTime = context.currentTime || new Date();

	// Evaluate each condition
	const results = filter.conditions.map(condition =>
		evaluateCondition(condition, context, currentTime, allFields)
	);

	// Apply logical operator (AND/OR)
	const conditionsMet = filter.operator === "and"
		? results.every(r => r)
		: results.some(r => r);

	// Apply action (display/hide)
	// If action is "display": show when conditions met
	// If action is "hide": show when conditions NOT met
	return filter.action === "display" ? conditionsMet : !conditionsMet;
}

/**
 * Evaluates a single filter condition
 */
function evaluateCondition(
	condition: FilterCondition,
	context: {
		selectedTicketId: string;
		formData: Record<string, any>;
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
function evaluateTicketCondition(
	condition: FilterCondition,
	context: { selectedTicketId: string }
): boolean {
	if (!condition.ticketId) {
		return true;
	}
	return context.selectedTicketId === condition.ticketId;
}

/**
 * Gets the localized field name that's used as the key in formData
 */
function getFieldNameKey(field: EventFormField, locale: string = "en"): string {
	if (typeof field.name === "string") {
		return field.name;
	}

	if (typeof field.name === "object" && field.name !== null) {
		// Try the current locale first, then fallback to 'en', then any available locale
		return field.name[locale] || field.name["en"] || Object.values(field.name)[0] || field.id;
	}

	return field.id;
}

/**
 * Evaluates a field-based condition
 */
function evaluateFieldCondition(
	condition: FilterCondition,
	context: { formData: Record<string, any> },
	allFields?: EventFormField[]
): boolean {
	if (!condition.fieldId || !allFields) {
		return true;
	}

	// Find the referenced field
	const referencedField = allFields.find(f => f.id === condition.fieldId);
	if (!referencedField) {
		return true;
	}

	// The formData is keyed by localized field names, not IDs
	// We need to get all possible keys for this field
	const possibleKeys = [
		condition.fieldId,
		referencedField.id
	];

	// Add localized names as possible keys
	if (typeof referencedField.name === "object" && referencedField.name !== null) {
		Object.values(referencedField.name).forEach(name => {
			if (name) possibleKeys.push(String(name));
		});
	} else if (typeof referencedField.name === "string") {
		possibleKeys.push(referencedField.name);
	}

	// Try to find the value using any of the possible keys
	let fieldValue: any = undefined;
	let foundKey: string | undefined;
	for (const key of possibleKeys) {
		if (key in context.formData) {
			fieldValue = context.formData[key];
			foundKey = key;
			break;
		}
	}

	const operator = condition.operator || "equals";

	// Debug logging
	console.log('Field condition evaluation:', {
		referencedFieldName: typeof referencedField.name === 'object' ? referencedField.name.en : referencedField.name,
		possibleKeys,
		foundKey,
		fieldValue,
		operator,
		expectedValue: condition.value,
		formData: context.formData
	});

	switch (operator) {
		case "filled":
			return isFilled(fieldValue);

		case "notFilled":
			return !isFilled(fieldValue);

		case "equals":
			const result = String(fieldValue) === String(condition.value);
			console.log('Equals comparison:', { fieldValue, expectedValue: condition.value, result });
			return result;

		default:
			return true;
	}
}

/**
 * Checks if a field value is considered "filled"
 */
function isFilled(value: any): boolean {
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
function evaluateTimeCondition(
	condition: FilterCondition,
	currentTime: Date
): boolean {
	const now = currentTime.getTime();

	// Parse start and end times
	const startTime = condition.startTime
		? new Date(condition.startTime).getTime()
		: -Infinity;

	const endTime = condition.endTime
		? new Date(condition.endTime).getTime()
		: Infinity;

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
		formData: Record<string, any>;
		currentTime?: Date;
	}
): EventFormField[] {
	return fields.filter(field => shouldDisplayField(field, context, fields));
}
