/**
 * @typedef {import('../types/validation.js').ValidationRule} ValidationRule
 * @typedef {import('../types/validation.js').ValidationSchema} ValidationSchema
 * @typedef {import('../types/validation.js').ValidationResult} ValidationResult
 */

import { validationErrorResponse } from "./response.js";

export const rules = {
	required: value => {
		if (value === undefined || value === null || value.toString().trim() === "") {
			return "此欄位為必填";
		}
		return true;
	},

	email: value => {
		if (!value) return true;
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(value) || "Email 格式不正確";
	},

	phone: value => {
		if (!value) return true;
		const phoneRegex = /^(\+886|0)?[2-9]\d{8}$/;
		return phoneRegex.test(value.replace(/[-\s]/g, "")) || "電話格式不正確";
	},

	minLength: min => value => {
		if (!value) return true;
		return value.toString().length >= min || `最少需要 ${min} 個字元`;
	},

	maxLength: max => value => {
		if (!value) return true;
		return value.toString().length <= max || `最多 ${max} 個字元`;
	},

	numeric: value => {
		if (!value) return true;
		return !isNaN(value) || "必須為數字";
	},

	positiveInteger: value => {
		if (!value) return true;
		const num = parseInt(value);
		return (Number.isInteger(num) && num > 0) || "必須為正整數";
	}
};

export const validateBody = schema => {
	return async (request, reply) => {
		const errors = {};

		for (const [field, rules] of Object.entries(schema)) {
			const value = request.body[field];
			const fieldErrors = [];

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

export const validateQuery = schema => {
	return async (request, reply) => {
		const errors = {};

		for (const [field, rules] of Object.entries(schema)) {
			const value = request.query[field];
			const fieldErrors = [];

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
 * Helper function to get field name key from formData
 * Handles both string field names and localized field name objects
 * @param {string|Object} fieldName - Field name (can be string or object with locales)
 * @param {Object} formData - Form data to search for matching keys
 * @returns {string|null} - The matching key from formData, or null if not found
 */
const getFieldNameKey = (fieldName, formData) => {
	// If fieldName is a simple string, use it directly
	if (typeof fieldName === "string") {
		return fieldName;
	}

	// If fieldName is an object (localized), find which locale key exists in formData
	if (typeof fieldName === "object" && fieldName !== null) {
		// Try each locale value to see if it exists in formData
		for (const locale in fieldName) {
			const localizedName = fieldName[locale];
			if (localizedName && formData.hasOwnProperty(localizedName)) {
				return localizedName;
			}
		}

		// If no match found, return the first available localized name
		// This helps with error reporting even if the field is missing
		const firstLocale = Object.keys(fieldName)[0];
		return fieldName[firstLocale] || null;
	}

	return null;
};

/**
 * Evaluates if a field should be displayed based on its filters
 * @param {Object} field - Form field with potential filters
 * @param {string} ticketId - Selected ticket ID
 * @param {Object} formData - Current form data
 * @param {Array} allFields - All form fields for field-based conditions
 * @returns {boolean} - True if field should be displayed
 */
const shouldDisplayField = (field, ticketId, formData, allFields) => {
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
 * @param {Object} formData - Form data to validate
 * @param {Array} formFields - Array of form field definitions from database
 * @param {string} ticketId - Selected ticket ID (for filter evaluation)
 * @returns {Object|null} - Validation errors or null if valid
 */
export const validateRegistrationFormData = (formData, formFields, ticketId = null) => {
	const errors = {};

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
		const fieldErrors = [];

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
							.map(opt => {
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
							.map(opt => {
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
						const invalidValues = value.filter(v => !validValues.includes(v));
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
			errors[fieldNameKey] = fieldErrors;
		}
	}

	return Object.keys(errors).length > 0 ? errors : null;
};
