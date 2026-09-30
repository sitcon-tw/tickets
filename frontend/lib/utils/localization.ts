import { FormFieldOption, LocalizedText } from "@sitcontix/types";

/**
 * Safely gets localized text from a localized object
 * @param obj - The localized text object (e.g., { "en": "SITCON 2026", "zh-Hant": "學生計算機年會 2026" })
 * @param locale - The desired locale (e.g., "en", "zh-Hant")
 * @param fallback - Fallback text if no localized text is found
 * @returns The localized text or fallback
 */
export function getLocalizedText(obj: LocalizedText | string | undefined | null, locale: string = "en", fallback: string = ""): string {
	// Handle null/undefined
	if (!obj) return fallback;

	// If it's already a string (for backwards compatibility), return it
	if (typeof obj === "string") return obj;

	// If it's not an object, return fallback
	if (typeof obj !== "object") return fallback;

	// Try to get the requested locale
	if (obj[locale]) return obj[locale];

	// Fallback to other languages if available
	const localePriority = ["en", "zh-Hant", "zh-Hans"];
	for (const lang of localePriority) {
		if (obj[lang]) return obj[lang];
	}

	// Final fallback
	return fallback;
}

/**
 * Normalize a form field option (plain string, localized record, or legacy `{ label, value }`) into a localized record
 */
export function normalizeFormFieldOption(opt: FormFieldOption): LocalizedText {
	if (typeof opt === "string") return { en: opt };
	if ("label" in opt) {
		const label = opt.label;
		return { en: typeof label === "object" ? label.en || Object.values(label)[0] || "" : label };
	}
	return opt;
}

/**
 * The value submitted for an option: its English text, falling back deterministically to the first other language
 * (never the viewer's locale, so the same option always submits the same string).
 */
export function getOptionValue(option: LocalizedText | string): string {
	if (typeof option === "string") return option;
	return option["en"] || option["zh-Hant"] || option["zh-Hans"] || Object.values(option).find(Boolean) || "";
}
