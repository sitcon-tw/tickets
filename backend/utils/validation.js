import { errorResponse } from "./response.js";

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
			const { response, statusCode } = errorResponse("VALIDATION_ERROR", "驗證失敗", errors, 422);
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
			const { response, statusCode } = errorResponse("VALIDATION_ERROR", "驗證失敗", errors, 422);
			reply.code(statusCode).send(response);
		}
	};
};

export const validateFormData = (data, formFields) => {
	const errors = {};

	for (const field of formFields) {
		const value = data[field.name];
		const fieldErrors = [];

		if (field.isRequired && !rules.required(value)) {
			fieldErrors.push(`${field.label}為必填欄位`);
			continue;
		}

		if (rules.required(value) !== true) continue;

		switch (field.type) {
			case "email":
				const emailResult = rules.email(value);
				if (emailResult !== true) {
					fieldErrors.push(`${field.label}格式不正確`);
				}
				break;
			case "phone":
				const phoneResult = rules.phone(value);
				if (phoneResult !== true) {
					fieldErrors.push(`${field.label}格式不正確`);
				}
				break;
			case "text":
			case "textarea":
				if (field.validation) {
					const validation = JSON.parse(field.validation);
					if (validation.minLength) {
						const minResult = rules.minLength(validation.minLength)(value);
						if (minResult !== true) {
							fieldErrors.push(`${field.label}長度不符合要求`);
						}
					}
					if (validation.maxLength) {
						const maxResult = rules.maxLength(validation.maxLength)(value);
						if (maxResult !== true) {
							fieldErrors.push(`${field.label}長度不符合要求`);
						}
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
