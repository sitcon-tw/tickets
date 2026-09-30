import type { EventFormFields } from "#prisma/generated/prisma/client";
import { getVisibleFieldIds, pruneFormData, validateFormData, type FormAnswers, type FormErrors, type FormLogicField } from "@sitcontix/types";
import type { FastifyReply, FastifyRequest } from "fastify";
import { validationErrorResponse } from "./response";
import { toText } from "./text";

export type ValidationRule = (value: unknown) => true | string;

export interface ValidationSchema {
	[field: string]: ValidationRule[];
}

export interface ValidationErrors {
	[field: string]: string[];
}

export const rules = {
	required: (value: unknown): true | string => {
		if (value === undefined || value === null || toText(value).trim() === "") {
			return "此欄位為必填";
		}
		return true;
	},

	email: (value: unknown): true | string => {
		if (!value) return true;
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(toText(value)) || "Email 格式不正確";
	},

	phone: (value: unknown): true | string => {
		if (!value) return true;
		const phoneRegex = /^(\+886|0)?[2-9]\d{8}$/;
		return phoneRegex.test(toText(value).replace(/[-\s]/g, "")) || "電話格式不正確";
	},

	minLength:
		(min: number) =>
		(value: unknown): true | string => {
			if (!value) return true;
			return toText(value).length >= min || `最少需要 ${min} 個字元`;
		},

	maxLength:
		(max: number) =>
		(value: unknown): true | string => {
			if (!value) return true;
			return toText(value).length <= max || `最多 ${max} 個字元`;
		},

	numeric: (value: unknown): true | string => {
		if (!value) return true;
		return !isNaN(Number(value)) || "必須為數字";
	},

	positiveInteger: (value: unknown): true | string => {
		if (!value) return true;
		const num = parseInt(toText(value));
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

/** Parses a JSON column that may have been stored as an array or as a JSON string. */
const parseJsonArray = (value: unknown): unknown[] => {
	if (Array.isArray(value)) return value;
	if (typeof value === "string") {
		try {
			const parsed: unknown = JSON.parse(value);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
};

/** Map a Prisma form field row (with untyped JSON columns) to the shape used by the shared form logic. */
export const toFormLogicField = (row: EventFormFields): FormLogicField => ({
	id: row.id,
	type: row.type as FormLogicField["type"],
	required: row.required,
	validater: row.validater,
	options: parseJsonArray(row.values) as FormLogicField["options"],
	enableOther: row.enableOther,
	filters: row.filters
});

export interface RegistrationAnswers {
	/** Field id -> error codes, or null when the answers are valid. */
	errors: FormErrors | null;
	/** The answers to store. */
	answers: FormAnswers;
}

/**
 * Validates submitted answers against the event's form fields and returns the answers to store.
 *
 * - Creating (`previousAnswers` omitted): only the answers of fields that are visible for the ticket are kept.
 * - Editing: answers of visible fields are replaced by the submitted ones; every other stored answer is left untouched, so
 *   a later edit never deletes data that was valid when it was submitted. Stored answers that are no longer valid options
 *   are accepted as long as they are unchanged.
 */
export const resolveRegistrationAnswers = (rows: EventFormFields[], ticketId: string, submitted: FormAnswers, previousAnswers?: FormAnswers): RegistrationAnswers => {
	const fields = rows.map(toFormLogicField);
	const context = { ticketId, formData: submitted, now: new Date() };
	const errors = validateFormData(fields, context, previousAnswers);
	const visibleIds = getVisibleFieldIds(fields, context);

	let answers: FormAnswers;
	if (previousAnswers) {
		answers = { ...previousAnswers };
		for (const id of visibleIds) {
			if (id in submitted) answers[id] = submitted[id];
			else delete answers[id];
		}
	} else {
		answers = pruneFormData(submitted, visibleIds);
	}

	return { errors: Object.keys(errors).length > 0 ? errors : null, answers };
};
