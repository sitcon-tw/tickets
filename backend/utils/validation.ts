import type { FastifyReply, FastifyRequest } from "fastify";
import { validationErrorResponse } from "./response";
import { nowInUTC8 } from "./timezone";

export type ValidationRule = (value: unknown) => true | string;

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
	values?: string | Array<string | Record<string, string>>;
	filters?: {
		enabled: boolean;
		operator?: "and" | "or";
		action?: "display" | "hide";
		conditions: FilterCondition[];
	};
	enableOther?: boolean;
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
	required: (value: unknown): true | string => {
		if (value === undefined || value === null || String(value).trim() === "") {
			return "此欄位為必填";
		}
		return true;
	},

	email: (value: unknown): true | string => {
		if (!value) return true;
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(String(value)) || "Email 格式不正確";
	},

	phone: (value: unknown): true | string => {
		if (!value) return true;
		const phoneRegex = /^(\+886|0)?[2-9]\d{8}$/;
		return phoneRegex.test(String(value).replace(/[-\s]/g, "")) || "電話格式不正確";
	},

	minLength:
		(min: number) =>
		(value: unknown): true | string => {
			if (!value) return true;
			return String(value).length >= min || `最少需要 ${min} 個字元`;
		},

	maxLength:
		(max: number) =>
		(value: unknown): true | string => {
			if (!value) return true;
			return String(value).length <= max || `最多 ${max} 個字元`;
		},

	numeric: (value: unknown): true | string => {
		if (!value) return true;
		return !isNaN(Number(value)) || "必須為數字";
	},

	positiveInteger: (value: unknown): true | string => {
		if (!value) return true;
		const num = parseInt(String(value));
		return (Number.isInteger(num) && num > 0) || "必須為正整數";
	}
};

export const validateBody = (schema: ValidationSchema) => {
	return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
		const errors: ValidationErrors = {};

		for (const [field, rules] of Object.entries(schema)) {
			const value = (request.body as Record<string, unknown>)?.[field];
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
			const value = (request.query as Record<string, unknown>)?.[field];
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

const shouldDisplayField = (field: FormField, ticketId: string, formData: Record<string, unknown>, allFields: FormField[]): boolean => {
	if (!field.filters || !field.filters.enabled) {
		return true;
	}

	const filter = field.filters;
	const now = nowInUTC8();

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

	const conditionsMet = filter.operator === "and" ? results.every(r => r) : results.some(r => r);
	return filter.action === "display" ? conditionsMet : !conditionsMet;
};

export const validateRegistrationFormData = (formData: Record<string, unknown>, formFields: FormField[], ticketId: string | null = null): ValidationErrors | null => {
	const errors: ValidationErrors = {};

	for (const field of formFields) {
		if (ticketId && !shouldDisplayField(field, ticketId, formData, formFields)) {
			continue;
		}

		const fieldIdKey = field.id;

		if (!fieldIdKey) {
			continue;
		}

		const value = formData[fieldIdKey];
		const fieldErrors: string[] = [];

		if (field.required && (value === undefined || value === null || value === "")) {
			fieldErrors.push(`為必填欄位`);
			errors[fieldIdKey] = fieldErrors;
			continue;
		}

		if (!field.required && (value === undefined || value === null || value === "")) {
			continue;
		}

		switch (field.type) {
			case "text":
			case "textarea":
				if (typeof value !== "string") {
					fieldErrors.push(`${field.description}必須為文字`);
					break;
				}
				if (field.validater) {
					try {
						const regex = new RegExp(field.validater);
						if (!regex.test(value)) {
							fieldErrors.push(`${field.description}格式不正確`);
						}
					} catch (e) {}
				}
				break;

			case "select":
			case "radio":
				if (field.values) {
					try {
						const options = typeof field.values === "string" ? JSON.parse(field.values) : field.values;

						const validValues = options
							.map((opt: string | Record<string, string>) => {
								if (typeof opt === "object" && opt !== null) {
									// If it has a 'value' property, use that
									if ("value" in opt && opt.value !== undefined) {
										return opt.value;
									}
									// Otherwise, collect all locale values
									return Object.values(opt);
								}
								return opt;
							})
							.flat();

						// For radio fields with enableOther, allow custom values
						const isOtherValue = field.type === "radio" && field.enableOther && !validValues.includes(value);

						if (!validValues.includes(value)) {
							if (isOtherValue) {
								// If "Other" is enabled, validate custom value with regex if provided
								if (field.validater && typeof value === "string") {
									try {
										const regex = new RegExp(field.validater);
										if (!regex.test(value)) {
											fieldErrors.push(`${field.description}格式不正確`);
										}
									} catch (e) {
										fieldErrors.push(`${field.description}驗證規則配置錯誤`);
									}
								}
							} else {
								fieldErrors.push(`${field.description}選項無效，可選值：${validValues.join(", ")}`);
							}
						}
					} catch (e) {
						fieldErrors.push(`${field.description}選項配置錯誤`);
					}
				}
				break;

			case "checkbox":
				if (field.values) {
					try {
						if (!Array.isArray(value)) {
							fieldErrors.push(`${field.description}必須為陣列`);
							break;
						}

						const options = typeof field.values === "string" ? JSON.parse(field.values) : field.values;

						const validValues = options
							.map((opt: string | Record<string, string>) => {
								if (typeof opt === "object" && opt !== null) {
									// If it has a 'value' property, use that
									if ("value" in opt && opt.value !== undefined) {
										return opt.value;
									}
									// Otherwise, collect all locale values
									return Object.values(opt);
								}
								return opt;
							})
							.flat();

						const invalidValues = (value as string[]).filter((v: string) => !validValues.includes(v));
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
