import { validationErrorResponse } from "../utils/response.js";

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
			const { response, statusCode } = validationErrorResponse(errors);
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
			const { response, statusCode } = validationErrorResponse(errors);
			reply.code(statusCode).send(response);
		}
	};
};

// Common validation rules
export const rules = {
	required: value => {
		if (value === undefined || value === null || value.toString().trim() === "") {
			return "此欄位為必填";
		}
		return true;
	},

	email: value => {
		if (!value) return true; // Let required rule handle empty values
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(value) || "Email 格式不正確";
	},

	minLength: min => value => {
		if (!value) return true; // Let required rule handle empty values
		return value.toString().length >= min || `最少需要 ${min} 個字元`;
	},

	maxLength: max => value => {
		if (!value) return true; // Let required rule handle empty values
		return value.toString().length <= max || `最多 ${max} 個字元`;
	},

	numeric: value => {
		if (!value) return true; // Let required rule handle empty values
		return !isNaN(value) || "必須為數字";
	},

	positiveInteger: value => {
		if (!value) return true; // Let required rule handle empty values
		const num = parseInt(value);
		return (Number.isInteger(num) && num > 0) || "必須為正整數";
	}
};
