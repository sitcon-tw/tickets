import { validationErrorResponse } from "./response";
import type { FastifyRequest, FastifyReply } from "fastify";

export type ValidationRule = (value: any) => true | string;

export interface ValidationSchema {
	[field: string]: ValidationRule[];
}

export interface ValidationErrors {
	[field: string]: string[];
}

export interface FormField {
	id: string;
	type: "text" | "textarea" | "select" | "radio" | "checkbox";
	name?: string | Record<string, string>;
	description: string;
	required: boolean;
	validater?: string;
	values?: string | any[];
	filters?: {
		enabled: boolean;
		operator?: "and" | "or";
		action?: "display" | "hide";
		conditions: FilterCondition[];
	};
}

export interface FilterCondition {
	type: "ticket" | "field" | "time";
	ticketId?: string;
	fieldId?: string;
	operator?: "filled" | "notFilled" | "equals";
	value?: string;
	startTime?: string;
	endTime?: string;
}

export const rules = {
	required: (value: any): true | string => {
		if (value === undefined || value === null || value.toString().trim() === "") {
			return "此欄位為必填";
		}
		return true;
	},

	email: (value: any): true | string => {
		if (!value) return true;
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(value) || "Email 格式不正確";
	},

	phone: (value: any): true | string => {
		if (!value) return true;
		const phoneRegex = /^(\+886|0)?[2-9]\d{8}$/;
		return phoneRegex.test(value.replace(/[-\s]/g, "")) || "電話格式不正確";
	},

	minLength: (min: number) => (value: any): true | string => {
		if (!value) return true;
		return value.toString().length >= min || `最少需要 ${min} 個字元`;
	},

	maxLength: (max: number) => (value: any): true | string => {
		if (!value) return true;
		return value.toString().length <= max || `最多 ${max} 個字元`;
	},

	numeric: (value: any): true | string => {
		if (!value) return true;
		return !isNaN(value) || "必須為數字";
	},

	positiveInteger: (value: any): true | string => {
		if (!value) return true;
		const num = parseInt(value);
		return (Number.isInteger(num) && num > 0) || "必須為正整數";
	}
};

export const validateBody = (schema: ValidationSchema) => {
	return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
		const errors: ValidationErrors = {};

		for (const [field, rules] of Object.entries(schema)) {
			const value = (request.body as any)?.[field];
			const fieldErrors: string[] = [];

			for (const rule of rules) {
				const result = rule(value);
				if (result !== true) {
					fieldErrors.push(result);
				}
			}

			if (fieldErrors.length > 0) {
				errors[field] = fieldErrors;
			}
		}

		if (Object.keys(errors).length > 0) {
			const { response, statusCode } = validationErrorResponse("驗證失敗", errors);
			reply.code(statusCode).send(response);
		}
	};
};

export const validateQuery = (schema: ValidationSchema) => {
	return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
		const errors: ValidationErrors = {};

		for (const [field, rules] of Object.entries(schema)) {
			const value = (request.query as any)?.[field];
			const fieldErrors: string[] = [];

			for (const rule of rules) {
				const result = rule(value);
				if (result !== true) {
					fieldErrors.push(result);
				}
			}

			if (fieldErrors.length > 0) {
				errors[field] = fieldErrors;
			}
		}

		if (Object.keys(errors).length > 0) {
			const { response, statusCode } = validationErrorResponse("驗證失敗", errors);
			reply.code(statusCode).send(response);
		}
	};
};


/**
 * Evaluates if a field should be displayed based on its filters
 * @param field - Form field with potential filters
 * @param ticketId - Selected ticket ID
 * @param formData - Current form data
 * @param allFields - All form fields for field-based conditions
 * @returns True if field should be displayed
 */
const shouldDisplayField = (
	field: FormField,
	ticketId: string,
	formData: Record<string, any>,
	allFields: FormField[]
): boolean => {
	// If no filters or not enabled, always display
	if (!field.filters || !field.filters.enabled) {
		return true;
	}

	const filter = field.filters;
	const now = new Date();

	// Evaluate each condition
	const results = filter.conditions.map(condition => {
		switch (condition.type) {
			case "ticket":
				return condition.ticketId ? ticketId === condition.ticketId : true;

			case "field": {
				if (!condition.fieldId) return true;
				const referencedField = allFields.find(f => f.id === condition.fieldId);
				if (!referencedField) return true;

				const fieldIdKey = referencedField.id;
				const fieldValue = formData[fieldIdKey || condition.fieldId];
				const operator = condition.operator || "equals";

				switch (operator) {
					case "filled":
						return fieldValue !== undefined && fieldValue !== null && fieldValue !== "" && !(Array.isArray(fieldValue) && fieldValue.length === 0);
					case "notFilled":
						return fieldValue === undefined || fieldValue === null || fieldValue === "" || (Array.isArray(fieldValue) && fieldValue.length === 0);
					case "equals":
						return String(fieldValue) === String(condition.value);
					default:
						return true;
				}
			}

			case "time": {
				const nowTime = now.getTime();
				const startTime = condition.startTime ? new Date(condition.startTime).getTime() : -Infinity;
				const endTime = condition.endTime ? new Date(condition.endTime).getTime() : Infinity;
				return nowTime >= startTime && nowTime <= endTime;
			}

			default:
				return true;
		}
	});

	// Apply logical operator (AND/OR)
	const conditionsMet = filter.operator === "and" ? results.every(r => r) : results.some(r => r);

	// Apply action (display/hide)
	return filter.action === "display" ? conditionsMet : !conditionsMet;
};

/**
 * Dynamic validation for registration form data based on ticket form fields
 * @param formData - Form data to validate
 * @param formFields - Array of form field definitions from database
 * @param ticketId - Selected ticket ID (for filter evaluation)
 * @returns Validation errors or null if valid
 */
export const validateRegistrationFormData = (
	formData: Record<string, any>,
	formFields: FormField[],
	ticketId: string | null = null
): ValidationErrors | null => {
	const errors: ValidationErrors = {};

	// Validate each field
	for (const field of formFields) {
		// Check if field should be displayed based on filters
		if (ticketId && !shouldDisplayField(field, ticketId, formData, formFields)) {
			// Skip validation for hidden fields
			continue;
		}

		// Get the actual field id that exists in formData
		const fieldIdKey = field.id;

		if (!fieldIdKey) {
			// Skip field if id cannot be determined
			continue;
		}

		const value = formData[fieldIdKey];
		const fieldErrors: string[] = [];

		// Check required fields (only for visible fields)
		if (field.required && (value === undefined || value === null || value === "")) {
			fieldErrors.push(`為必填欄位`);
			errors[fieldIdKey] = fieldErrors;
			continue;
		}

		// Skip validation if field is empty and not required
		if (!field.required && (value === undefined || value === null || value === "")) {
			continue;
		}

		// Type-specific validation
		switch (field.type) {
			case "text":
			case "textarea":
				if (typeof value !== "string") {
					fieldErrors.push(`${field.description}必須為文字`);
					break;
				}
				// Apply regex validation if provided
				if (field.validater) {
					try {
						const regex = new RegExp(field.validater);
						if (!regex.test(value)) {
							fieldErrors.push(`${field.description}格式不正確`);
						}
					} catch (e) {
						// Invalid regex pattern, skip validation
					}
				}
				break;

			case "select":
			case "radio":
				if (field.values) {
					try {
						// Handle both JSON object (from Prisma) and JSON string
						const options = typeof field.values === "string" ? JSON.parse(field.values) : field.values;

						// Extract valid values from options array
						// Options can be localized objects like {"en": "Yes", "zh": "是"} or simple strings
						const validValues = options
							.map((opt: any) => {
								if (typeof opt === "object" && opt !== null) {
									// If it has a 'value' property, use that
									if (opt.value !== undefined) {
										return opt.value;
									}
									// Otherwise, collect all locale values
									return Object.values(opt);
								}
								return opt;
							})
							.flat();

						if (!validValues.includes(value)) {
							fieldErrors.push(`${field.description}選項無效，可選值：${validValues.join(", ")}`);
						}
					} catch (e) {
						fieldErrors.push(`${field.description}選項配置錯誤`);
					}
				}
				break;

			case "checkbox":
				if (field.values) {
					try {
						// Checkbox values should be an array
						if (!Array.isArray(value)) {
							fieldErrors.push(`${field.description}必須為陣列`);
							break;
						}

						// Handle both JSON object (from Prisma) and JSON string
						const options = typeof field.values === "string" ? JSON.parse(field.values) : field.values;

						// Extract valid values from options array
						const validValues = options
							.map((opt: any) => {
								if (typeof opt === "object" && opt !== null) {
									// If it has a 'value' property, use that
									if (opt.value !== undefined) {
										return opt.value;
									}
									// Otherwise, collect all locale values
									return Object.values(opt);
								}
								return opt;
							})
							.flat();

						// Check each selected value is valid
						const invalidValues = value.filter((v: any) => !validValues.includes(v));
						if (invalidValues.length > 0) {
							fieldErrors.push(`${field.description}包含無效選項：${invalidValues.join(", ")}`);
						}
					} catch (e) {
						fieldErrors.push(`${field.description}選項配置錯誤`);
					}
				}
				break;
		}

		if (fieldErrors.length > 0) {
			errors[fieldIdKey] = fieldErrors;
		}
	}

	return Object.keys(errors).length > 0 ? errors : null;
};
