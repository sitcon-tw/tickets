import { getTranslations } from "@/i18n/helpers";
import { normalizeFormFieldOption } from "@/lib/utils/localization";
import { ApiResponseError } from "@/lib/types/client";
import type { FormErrorCode, FormErrors, FormFieldOption, LocalizedText, TicketFormField } from "@sitcontix/types";

export type RawTicketFormField = Omit<TicketFormField, "eventId" | "options"> &
	Partial<Pick<TicketFormField, "eventId">> & {
		options?: FormFieldOption[] | null;
	};

/** Turns the public form-fields payload into the shape the form components use (legacy JSON-string names/descriptions included). */
export function normalizeTicketFormFields(fields: RawTicketFormField[], eventId: string): TicketFormField[] {
	return fields.map(field => {
		let name: LocalizedText = field.name;
		if (typeof name === "string" && name === "[object Object]") {
			name = { en: typeof field.description === "string" ? field.description : "field" };
		} else if (typeof name === "string") {
			const rawName = name;
			try {
				name = JSON.parse(rawName);
			} catch {
				name = { en: rawName };
			}
		}

		// Legacy data may still store the description as a (JSON) string
		let description = (field.description ?? undefined) as LocalizedText | string | undefined;
		if (typeof description === "string" && description.startsWith("{")) {
			const originalStr = description;
			try {
				description = JSON.parse(description);
			} catch {
				description = { en: originalStr };
			}
		} else if (typeof description === "string") {
			description = { en: description };
		}

		let filters = field.filters;
		if (typeof filters === "string") {
			try {
				filters = JSON.parse(filters);
			} catch {
				filters = undefined;
			}
		}

		return {
			...field,
			eventId,
			name,
			description: description as LocalizedText | undefined,
			options: (field.options || []).map(normalizeFormFieldOption),
			filters
		};
	});
}

const formErrorTranslations = {
	required: { "zh-Hant": "此欄位為必填", "zh-Hans": "此栏位为必填", en: "This field is required" },
	invalid_type: { "zh-Hant": "答案格式不正確", "zh-Hans": "答案格式不正确", en: "This answer has an invalid format" },
	invalid_option: { "zh-Hant": "請選擇有效的選項", "zh-Hans": "请选择有效的选项", en: "Please choose one of the available options" },
	pattern: { "zh-Hant": "格式不正確，請檢查後再試", "zh-Hans": "格式不正确，请检查后再试", en: "The format is not valid, please check it" },
	invalid_config: { "zh-Hant": "此欄位設定有誤，請聯絡主辦單位", "zh-Hans": "此栏位设置有误，请联系主办单位", en: "This field is misconfigured, please contact the organizers" }
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
