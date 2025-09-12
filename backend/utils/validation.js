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
 * Hard-coded validation for registration form data
 * @param {Object} formData - Form data to validate
 * @returns {Object|null} - Validation errors or null if valid
 */
export const validateRegistrationFormData = (formData) => {
	const errors = {};

	// Define hard-coded form fields
	const requiredFields = {
		acceptTerms: {
			label: '接受條款',
			type: 'boolean',
			required: true
		},
		nickname: {
			label: '暱稱',
			type: 'string',
			required: true,
			minLength: 2,
			maxLength: 20
		},
		phoneNumber: {
			label: '電話號碼',
			type: 'phone',
			required: true
		},
		sex: {
			label: '性別',
			type: 'enum',
			required: true,
			options: ['male', 'female', 'other']
		},
		foodHabits: {
			label: '飲食習慣',
			type: 'enum',
			required: true,
			options: ['normal', 'no-beef', 'no-pork', 'vegetarian']
		},
		livingArea: {
			label: '居住地區',
			type: 'enum',
			required: true,
			options: ['north', 'middle', 'south', 'east']
		},
		workingAt: {
			label: '工作地點',
			type: 'string',
			required: true,
			maxLength: 100
		},
		jobTitle: {
			label: '職位',
			type: 'string',
			required: true,
			maxLength: 50
		},
		grade: {
			label: '年級',
			type: 'string',
			required: true,
			maxLength: 20
		},
		haveEverBeenHere: {
			label: '是否曾經來過',
			type: 'boolean',
			required: true
		},
		whereYouGotThis: {
			label: '從哪裡得知此活動',
			type: 'enum',
			required: true,
			options: ['google', 'social_media', 'friend', 'family']
		}
	};

	// Validate each field
	for (const [fieldName, fieldConfig] of Object.entries(requiredFields)) {
		const value = formData[fieldName];
		const fieldErrors = [];

		// Check required fields
		if (fieldConfig.required && (value === undefined || value === null || value === '')) {
			fieldErrors.push(`${fieldConfig.label}為必填欄位`);
			errors[fieldName] = fieldErrors;
			continue;
		}

		// Skip validation if field is empty and not required
		if (!fieldConfig.required && (value === undefined || value === null || value === '')) {
			continue;
		}

		// Type-specific validation
		switch (fieldConfig.type) {
			case 'boolean':
				if (typeof value !== 'boolean') {
					fieldErrors.push(`${fieldConfig.label}必須為 true 或 false`);
				}
				break;

			case 'string':
				if (typeof value !== 'string') {
					fieldErrors.push(`${fieldConfig.label}必須為文字`);
					break;
				}
				if (fieldConfig.minLength && value.length < fieldConfig.minLength) {
					fieldErrors.push(`${fieldConfig.label}最少需要 ${fieldConfig.minLength} 個字元`);
				}
				if (fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
					fieldErrors.push(`${fieldConfig.label}最多 ${fieldConfig.maxLength} 個字元`);
				}
				break;

			case 'phone':
				const phoneResult = rules.phone(value);
				if (phoneResult !== true) {
					fieldErrors.push(`${fieldConfig.label}格式不正確`);
				}
				break;

			case 'enum':
				if (!fieldConfig.options.includes(value)) {
					fieldErrors.push(`${fieldConfig.label}選項無效，可選值: ${fieldConfig.options.join(', ')}`);
				}
				break;
		}

		if (fieldErrors.length > 0) {
			errors[fieldName] = fieldErrors;
		}
	}

	return Object.keys(errors).length > 0 ? errors : null;
};
