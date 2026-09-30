import type { InvitationCode } from "@sitcontix/types";

export type InviteStatus = "available" | "scheduled" | "exhausted" | "expired" | "disabled";

export type InviteRow = {
	id: string;
	code: string;
	name: string;
	ticketId: string;
	ticketName: string;
	usedCount: number;
	/** null means unlimited. */
	usageLimit: number | null;
	validFrom: Date | null;
	validUntil: Date | null;
	validUntilTs: number;
	isActive: boolean;
	isExpired: boolean;
	createdAt: Date;
	createdAtTs: number;
	status: InviteStatus;
};

export function toInviteRow(code: InvitationCode, ticketName: string, now: number): InviteRow {
	const validFrom = code.validFrom ? new Date(code.validFrom) : null;
	const validUntil = code.validUntil ? new Date(code.validUntil) : null;
	const usageLimit = code.usageLimit ?? null;
	const isExpired = validUntil !== null && validUntil.getTime() < now;
	const isExhausted = usageLimit !== null && code.usedCount >= usageLimit;
	const isScheduled = validFrom !== null && validFrom.getTime() > now;

	let status: InviteStatus = "available";
	if (!code.isActive) status = "disabled";
	else if (isExpired) status = "expired";
	else if (isExhausted) status = "exhausted";
	else if (isScheduled) status = "scheduled";

	return {
		id: code.id,
		code: code.code,
		name: code.name ?? "",
		ticketId: code.ticketId,
		ticketName,
		usedCount: code.usedCount,
		usageLimit,
		validFrom,
		validUntil,
		validUntilTs: validUntil?.getTime() ?? 0,
		isActive: code.isActive,
		isExpired,
		createdAt: code.createdAt,
		createdAtTs: code.createdAt.getTime(),
		status
	};
}

/** The admin UI shows all dates in UTC+8, so datetime-local inputs are read as UTC+8 too. */
export function parseTaipeiInput(value: string): Date | null {
	if (!value) return null;
	const date = new Date(`${value.length === 16 ? `${value}:00` : value}+08:00`);
	return Number.isNaN(date.getTime()) ? null : date;
}

export async function copyText(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}

function csvCell(value: string | number) {
	const text = String(value);
	return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: (string | number)[][]) {
	return String.fromCharCode(0xfeff) + [header, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
}

export function downloadFile(filename: string, content: string, type: string) {
	const blob = new Blob([content], { type: `${type};charset=utf-8` });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

/** Runs `task` over `items` with a small concurrency limit so bulk operations do not flood the API. */
export async function runInChunks<T, R>(items: T[], task: (item: T) => Promise<R>, chunkSize = 5): Promise<R[]> {
	const results: R[] = [];
	for (let i = 0; i < items.length; i += chunkSize) {
		results.push(...(await Promise.all(items.slice(i, i + chunkSize).map(task))));
	}
	return results;
}
