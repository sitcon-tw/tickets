import { getTranslations } from "@/i18n/helpers";
import { normalizeFormFieldOption } from "@/lib/utils/localization";
import { ApiResponseError } from "@/lib/types/client";
import type { FormDataType } from "@/lib/types/data";
import type { FormErrorCode, FormErrors, PublicEventFormField, TicketFormField } from "@sitcontix/types";

/** Turns the public form-fields payload into the shape the form components use (options normalized to localized records). */
export function normalizeTicketFormFields(fields: PublicEventFormField[], eventId: string): TicketFormField[] {
	return fields.map(field => ({
		...field,
		eventId,
		options: field.options.map(normalizeFormFieldOption)
	}));
}

/**
 * Stored answers as form state: strings, booleans and string lists are kept, numbers become strings,
 * and anything else (objects, null, mixed lists) is dropped instead of being rendered as-is.
 */
export function toFormData(raw: unknown): FormDataType {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
	const formData: FormDataType = {};
	for (const [key, value] of Object.entries(raw)) {
		if (typeof value === "string" || typeof value === "boolean") formData[key] = value;
		else if (typeof value === "number" && Number.isFinite(value)) formData[key] = String(value);
		else if (Array.isArray(value)) formData[key] = value.filter((item): item is string => typeof item === "string");
	}
	return formData;
}

const formErrorTranslations = {
	required: { "zh-Hant": "此欄位為必填", en: "This field is required" },
	invalid_type: { "zh-Hant": "答案格式不正確", en: "This answer has an invalid format" },
	invalid_option: { "zh-Hant": "請選擇有效的選項", en: "Please choose one of the available options" },
	pattern: { "zh-Hant": "格式不正確，請檢查後再試", en: "The format is not valid, please check it" },
	invalid_config: { "zh-Hant": "此欄位設定有誤，請聯絡主辦單位", en: "This field is misconfigured, please contact the organizers" }
};

const formErrorCodes = new Set<string>(Object.keys(formErrorTranslations));

/** The first error of each field as a message in the given locale. */
export function getFormErrorMessages(errors: FormErrors, locale: string): Record<string, string> {
	const t = getTranslations(locale, formErrorTranslations);
	const messages: Record<string, string> = {};
	for (const [fieldId, codes] of Object.entries(errors)) {
		if (codes[0]) messages[fieldId] = t[codes[0]];
	}
	return messages;
}

/** Extracts per-field error codes from a rejected API call, or null if the error carries none. */
export function getFormErrorsFromApiError(error: unknown): FormErrors | null {
	if (!(error instanceof ApiResponseError) || !error.details || typeof error.details !== "object") return null;

	const errors: FormErrors = {};
	for (const [fieldId, value] of Object.entries(error.details)) {
		const codes = (Array.isArray(value) ? value : []).filter((code): code is FormErrorCode => typeof code === "string" && formErrorCodes.has(code));
		if (codes.length > 0) errors[fieldId] = codes;
	}
	return Object.keys(errors).length > 0 ? errors : null;
}

/** Moves focus to the first control of a form field (by field id) and scrolls it into view. */
export function focusFormField(fieldId: string) {
	requestAnimationFrame(() => {
		const container = document.querySelector<HTMLElement>(`[data-field-id="${CSS.escape(fieldId)}"]`);
		if (!container) return;
		container.scrollIntoView({ block: "center", behavior: "smooth" });
		container.querySelector<HTMLElement>("input:not([type=hidden]), textarea, button, [role=combobox]")?.focus({ preventScroll: true });
	});
}
