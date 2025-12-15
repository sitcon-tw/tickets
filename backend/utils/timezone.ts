import { format, toZonedTime } from "date-fns-tz";

/**
 * Target timezone for the application (UTC+8)
 */
export const APP_TIMEZONE = "Asia/Taipei"; // UTC+8

/**
 * Convert a Date or date string to UTC+8 timezone
 */
export function toUTC8(date: Date | string): Date {
	const dateObj = typeof date === "string" ? new Date(date) : date;
	return toZonedTime(dateObj, APP_TIMEZONE);
}

/**
 * Format a date to UTC+8 with specified format
 */
export function formatInUTC8(date: Date | string, formatString: string = "yyyy-MM-dd HH:mm:ss"): string {
	const dateObj = typeof date === "string" ? new Date(date) : date;
	return format(toZonedTime(dateObj, APP_TIMEZONE), formatString, {
		timeZone: APP_TIMEZONE
	});
}

/**
 * Get current time in UTC+8
 */
export function nowInUTC8(): Date {
	return toZonedTime(new Date(), APP_TIMEZONE);
}

/**
 * Format date as YYYY-MM-DD in UTC+8 (for grouping by day)
 */
export function formatDateOnly(date: Date | string): string {
	return formatInUTC8(date, "yyyy-MM-dd");
}

/**
 * Format date as YYYY-MM in UTC+8 (for grouping by month)
 */
export function formatMonthOnly(date: Date | string): string {
	return formatInUTC8(date, "yyyy-MM");
}

/**
 * Get the start of week in UTC+8
 */
export function getWeekStartInUTC8(date: Date | string): Date {
	const utc8Date = toUTC8(date);
	const dayOfWeek = utc8Date.getDay();
	const diff = utc8Date.getDate() - dayOfWeek;
	const weekStart = new Date(utc8Date);
	weekStart.setDate(diff);
	weekStart.setHours(0, 0, 0, 0);
	return weekStart;
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
