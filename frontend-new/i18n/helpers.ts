import { routing } from './routing';

type TranslationRecord = Record<string, Record<string, string>>;

/**
 * Helper function to get translations for a given locale
 * Similar to the old i18n.t function but works with any locale string
 *
 * @param locale - Current locale (e.g., "en", "zh-Hant", "zh-Hans")
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
export function getTranslations(
  locale: string,
  data: TranslationRecord
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key in data) {
    result[key] = data[key][locale] || data[key][routing.defaultLocale];
  }

  return result;
}

/**
 * Helper function to build localized links
 * Similar to the old i18n.l function
 *
 * @param currentLocale - Current locale
 * @returns Function that builds localized paths
 *
 * @example
 * const linkBuilder = buildLocalizedLink("en");
 * linkBuilder("/admin/"); // "/en/admin/"
 * linkBuilder("/admin/", "zh-Hant"); // "/zh-Hant/admin/"
 */
export function buildLocalizedLink(currentLocale: string) {
  return (path: string = "/", locale: string = ""): string => {
    const targetLocale = locale || currentLocale;
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${targetLocale}${cleanPath}`;
  };
}
