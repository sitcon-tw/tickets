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
 * Dynamic validation for registration form data based on ticket form fields
 * @param {Object} formData - Form data to validate
 * @param {Array} formFields - Array of form field definitions from database
 * @returns {Object|null} - Validation errors or null if valid
 */
export const validateRegistrationFormData = (formData, formFields) => {
	const errors = {};

	// Validate each field
	for (const field of formFields) {
		const value = formData[field.name];
		const fieldErrors = [];

		// Check required fields
		if (field.required && (value === undefined || value === null || value === '')) {
			fieldErrors.push(`${field.description}為必填欄位`);
			errors[field.name] = fieldErrors;
			continue;
		}

		// Skip validation if field is empty and not required
		if (!field.required && (value === undefined || value === null || value === '')) {
			continue;
		}

		// Type-specific validation
		switch (field.type) {
			case 'text':
			case 'textarea':
				if (typeof value !== 'string') {
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
						console.warn(`Invalid regex for field ${field.name}: ${field.validater}`);
					}
				}
				break;

			case 'select':
			case 'radio':
				if (field.values) {
					try {
						const options = JSON.parse(field.values);
						const validValues = options.map(opt =>
							typeof opt === 'object' && opt.value !== undefined ? opt.value : opt
						);
						if (!validValues.includes(value)) {
							fieldErrors.push(`${field.description}選項無效，可選值: ${validValues.join(', ')}`);
						}
					} catch (e) {
						console.warn(`Invalid JSON options for field ${field.name}: ${field.values}`);
						fieldErrors.push(`${field.description}選項配置錯誤`);
					}
				}
				break;
		}

		if (fieldErrors.length > 0) {
			errors[field.name] = fieldErrors;
		}
	}

	return Object.keys(errors).length > 0 ? errors : null;
};
