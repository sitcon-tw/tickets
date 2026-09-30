import { getLocalizedText } from "@/lib/utils/localization";
import { toText } from "@/lib/utils/text";
import type { EventFormField, Registration } from "@sitcontix/types";
import type { RegistrationsT } from "./translations";

/** Admin list rows also include the referrer's email */
export type AdminRegistration = Registration & { referrer?: { email: string } | null };

export type RegistrationStatus = "pending" | "confirmed" | "cancelled";

export const registrationStatuses: RegistrationStatus[] = ["confirmed", "pending", "cancelled"];

export function statusTone(status: string) {
	if (status === "confirmed") return "success" as const;
	if (status === "pending") return "warning" as const;
	if (status === "cancelled") return "danger" as const;
	return "neutral" as const;
}

/** Referrer shown in the admin list is the referrer's email (the backend puts it in `referredBy`). */
export function getReferrer(registration: AdminRegistration): string {
	return registration.referrer?.email || registration.referredBy || "";
}

export type FormDataEntry = { key: string; label: string; value: unknown; field?: EventFormField };

function localizeOption(field: EventFormField | undefined, value: unknown, locale: string): string {
	if (typeof value !== "string") return toText(value);
	const options = field?.options ?? field?.values ?? [];
	for (const option of options) {
		if (option && typeof option === "object" && Object.values(option).includes(value)) {
			return getLocalizedText(option, locale, value);
		}
	}
	return value;
}

/** Human readable version of a stored form answer (options are shown in the admin's locale). */
export function formatFormValue(field: EventFormField | undefined, value: unknown, locale: string): string {
	if (value === null || value === undefined || value === "") return "";
	const hasOptions = field?.type === "select" || field?.type === "radio" || field?.type === "checkbox";
	if (Array.isArray(value)) return value.map(item => (hasOptions ? localizeOption(field, item, locale) : toText(item))).join(", ");
	if (typeof value === "object") return JSON.stringify(value);
	return hasOptions ? localizeOption(field, value, locale) : toText(value);
}

/** Form answers in the order of the event's form fields, followed by answers whose field no longer exists. */
export function getFormDataEntries(formData: Record<string, unknown> | undefined, fields: EventFormField[], locale: string): FormDataEntry[] {
	if (!formData) return [];
	const entries: FormDataEntry[] = [];
	const seen = new Set<string>();
	for (const field of [...fields].sort((a, b) => a.order - b.order)) {
		if (!(field.id in formData)) continue;
		seen.add(field.id);
		entries.push({ key: field.id, label: getLocalizedText(field.name, locale, field.id), value: formData[field.id], field });
	}
	for (const key of Object.keys(formData)) {
		if (!seen.has(key)) entries.push({ key, label: key, value: formData[key] });
	}
	return entries;
}

// Excel treats cells starting with these characters as formulas
function neutralizeFormula(value: string): string {
	return /^[=@]|^[+-](?![\d\s.])/.test(value) ? `'${value}` : value;
}

function toCsv(rows: string[][]): string {
	return rows.map(row => row.map(cell => `"${neutralizeFormula(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

/** CSV for the given registrations, including one column per form field. Prefixed with a UTF-8 BOM so Excel detects the encoding. */
export function buildRegistrationsCsv(registrations: AdminRegistration[], fields: EventFormField[], locale: string, t: RegistrationsT): string {
	const usedKeys = new Set<string>();
	for (const registration of registrations) {
		for (const [key, value] of Object.entries(registration.formData ?? {})) {
			if (value !== null && value !== undefined && value !== "") usedKeys.add(key);
		}
	}
	const fieldById = new Map(fields.map(field => [field.id, field]));
	const orderedKeys = [...fields]
		.sort((a, b) => a.order - b.order)
		.map(field => field.id)
		.filter(key => usedKeys.has(key));
	for (const key of usedKeys) {
		if (!fieldById.has(key)) orderedKeys.push(key);
	}

	const header = [t.csvId, t.csvEmail, t.csvTicket, t.csvPrice, t.csvStatus, t.csvReferredBy, t.csvCreatedAt, ...orderedKeys.map(key => getLocalizedText(fieldById.get(key)?.name, locale, key))];
	const rows = registrations.map(registration => [
		registration.id,
		registration.email,
		getLocalizedText(registration.ticket?.name, locale) || registration.ticketId,
		String(registration.ticket?.price ?? ""),
		registration.status,
		getReferrer(registration),
		new Date(registration.createdAt).toISOString(),
		...orderedKeys.map(key => formatFormValue(fieldById.get(key), registration.formData?.[key], locale))
	]);

	return "﻿" + toCsv([header, ...rows]);
}

export function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function timestampForFilename(date = new Date()): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

export function errorMessage(error: unknown, fallback: string): string {
	return error instanceof Error && error.message ? error.message : fallback;
}
