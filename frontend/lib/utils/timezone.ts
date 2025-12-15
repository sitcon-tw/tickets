import { format, toZonedTime } from 'date-fns-tz';

/**
 * Target timezone for the application (UTC+8)
 */
export const APP_TIMEZONE = 'Asia/Taipei'; // UTC+8

/**
 * Convert a Date or date string to UTC+8 timezone
 */
export function toUTC8(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(dateObj, APP_TIMEZONE);
}

/**
 * Format a date to UTC+8 with specified format
 */
export function formatInUTC8(
  date: Date | string,
  formatString: string = 'yyyy-MM-dd HH:mm:ss'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(toZonedTime(dateObj, APP_TIMEZONE), formatString, {
    timeZone: APP_TIMEZONE,
  });
}

/**
 * Get current time in UTC+8
 */
export function nowInUTC8(): Date {
  return toZonedTime(new Date(), APP_TIMEZONE);
}

/**
 * Format date for display (YYYY/MM/DD HH:mm)
 */
export function formatDateTime(date: Date | string): string {
  return formatInUTC8(date, 'yyyy/MM/dd HH:mm');
}

/**
 * Format date only (YYYY/MM/DD)
 */
export function formatDate(date: Date | string): string {
  return formatInUTC8(date, 'yyyy/MM/dd');
}

/**
 * Format time only (HH:mm)
 */
export function formatTime(date: Date | string): string {
  return formatInUTC8(date, 'HH:mm');
}

/**
 * Format full datetime with timezone indicator
 */
export function formatDateTimeWithTZ(date: Date | string): string {
  return `${formatInUTC8(date, 'yyyy/MM/dd HH:mm')} (UTC+8)`;
}

/**
 * Compare if date is before current UTC+8 time
 */
export function isBeforeNowUTC8(date: Date | string): boolean {
  const compareDate = toUTC8(date);
  const now = nowInUTC8();
  return compareDate < now;
}

/**
 * Compare if date is after current UTC+8 time
 */
export function isAfterNowUTC8(date: Date | string): boolean {
  const compareDate = toUTC8(date);
  const now = nowInUTC8();
  return compareDate > now;
}

/**
 * Check if two dates are on the same day in UTC+8
 */
export function isSameDayUTC8(date1: Date | string, date2: Date | string): boolean {
  const d1 = toUTC8(date1);
  const d2 = toUTC8(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Format event date range
 * If same day: "YYYY/MM/DD HH:mm - HH:mm"
 * If different days: "YYYY/MM/DD HH:mm - YYYY/MM/DD HH:mm"
 */
export function formatEventDateRange(startDate: Date | string, endDate: Date | string): string {
  if (isSameDayUTC8(startDate, endDate)) {
    return `${formatDate(startDate)} ${formatTime(startDate)} - ${formatTime(endDate)}`;
  }
  return `${formatDateTime(startDate)} - ${formatDateTime(endDate)}`;
}

/**
 * Format date for datetime-local input (YYYY-MM-DDTHH:mm) in UTC+8
 * This is used for HTML5 datetime-local input fields
 */
export function toDateTimeLocalString(date: Date | string): string {
  return formatInUTC8(date, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Parse datetime-local input value to UTC ISO string
 * Assumes the input is in UTC+8 timezone
 */
export function fromDateTimeLocalString(dateTimeLocal: string): string {
  if (!dateTimeLocal) return new Date().toISOString();
  // datetime-local format is YYYY-MM-DDTHH:mm
  // Treat this string as UTC+8 time and convert to UTC
  // Simply append the UTC+8 offset and parse
  const dateTimeWithOffset = dateTimeLocal + ':00+08:00';
  return new Date(dateTimeWithOffset).toISOString();
}
