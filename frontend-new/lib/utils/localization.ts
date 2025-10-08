import { LocalizedText } from '@/lib/types/api';

/**
 * Safely gets localized text from a localized object
 * @param obj - The localized text object (e.g., { "en": "SITCON 2026", "zh-Hant": "學生計算機年會 2026" })
 * @param locale - The desired locale (e.g., "en", "zh-Hant")
 * @param fallback - Fallback text if no localized text is found
 * @returns The localized text or fallback
 */
export function getLocalizedText(
  obj: LocalizedText | string | undefined | null,
  locale: string = 'en',
  fallback: string = ''
): string {
  // Handle null/undefined
  if (!obj) return fallback;

  // If it's already a string (for backwards compatibility), return it
  if (typeof obj === 'string') return obj;

  // If it's not an object, return fallback
  if (typeof obj !== 'object') return fallback;

  // Try to get the requested locale
  if (obj[locale]) return obj[locale];

  // Fallback to English
  if (obj['en']) return obj['en'];

  // Fallback to first available locale
  const firstValue = Object.values(obj)[0];
  if (firstValue) return firstValue;

  // Final fallback
  return fallback;
}
