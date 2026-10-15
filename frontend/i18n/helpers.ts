import { routing } from "./routing";

type TranslationRecord = Record<string, Record<string, string>>;

/** The translated strings of a translation record, keyed by its keys (so a misspelled key is a type error). */
export type Translations<T extends TranslationRecord> = { [K in keyof T]: string };

/**
 * Helper function to get translations for a given locale
 * Similar to the old i18n.t function but works with any locale string
 *
 * @param locale - Current locale (e.g., "en", "zh-Hant")
 * @param data - Translation object with keys mapping to locale-specific values
 * @returns Object with translation keys as properties
 *
 * @example
 * const t = getTranslations("en", {
 *   title: { "zh-Hant": "標題", "en": "Title" },
 *   description: { "zh-Hant": "描述", "en": "Description" }
 * });
 * console.log(t.title); // "Title"
 */
export function getTranslations<T extends TranslationRecord>(locale: string, data: T): Translations<T> {
	const result = {} as Translations<T>;

	for (const key in data) {
		result[key] = data[key][locale] || data[key][routing.defaultLocale];
	}

	return result;
}
