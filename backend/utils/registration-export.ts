import prisma from "#config/database";
import type { Prisma } from "#prisma/generated/prisma/client";
import { parseFormFieldOptions } from "#utils/form-fields";
import { parseJsonObject } from "#utils/json";
import { toText } from "#utils/text";
import { LocalizedTextSchema, optionValues, type FormFieldOption, type LocalizedText } from "@sitcontix/types";

type FieldInfo = { name: string; type: string; values: Prisma.JsonValue };

export type ExportCell = string | number;
export interface ExportTable {
	headers: string[];
	rows: ExportCell[][];
}

const LOCALE = "zh-Hant";

const pickLocale = (text: LocalizedText): string | undefined => text[LOCALE] || text["en"] || Object.values(text)[0];

function getLocalizedName(json: Prisma.JsonValue | undefined, fallback = ""): string {
	if (typeof json === "string") return json;
	const parsed = LocalizedTextSchema.safeParse(json);
	return (parsed.success && pickLocale(parsed.data)) || fallback;
}

/** Display label of an option: plain string, localized record, or legacy `{ label, value }` */
function optionLabel(option: FormFieldOption): string | undefined {
	if (typeof option === "string") return option;
	if ("label" in option && option.label !== undefined) return typeof option.label === "string" ? option.label : pickLocale(option.label);
	const localized = LocalizedTextSchema.safeParse(option);
	return localized.success ? pickLocale(localized.data) : undefined;
}

function localizeOption(options: FormFieldOption[], value: unknown): string {
	if (value === null || value === undefined) return "";
	const option = typeof value === "string" ? options.find(opt => optionValues(opt).includes(value)) : undefined;
	return (option && optionLabel(option)) || toText(value);
}

function formatFieldValue(field: FieldInfo | undefined, value: unknown): string {
	if (value === null || value === undefined) return "";

	if (field?.values && ["checkbox", "select", "radio"].includes(field.type)) {
		const options = parseFormFieldOptions(field.values);
		if (Array.isArray(value)) return value.map(v => localizeOption(options, v)).join(", ");
		return localizeOption(options, value);
	}

	if (Array.isArray(value)) return value.map(v => (v === null || v === undefined ? "" : toText(v))).join(", ");
	return toText(value);
}

/**
 * Build the registrations table shared by the CSV export and the Google Sheets sync.
 * Form columns follow the event's form order, then any leftover keys (e.g. from deleted fields) alphabetically.
 */
export async function buildRegistrationExportTable(where: Prisma.RegistrationWhereInput): Promise<ExportTable> {
	const registrations = await prisma.registration.findMany({
		where,
		select: {
			id: true,
			eventId: true,
			email: true,
			status: true,
			formData: true,
			createdAt: true,
			checkedIn: true,
			checkedInAt: true,
			event: { select: { name: true } },
			ticket: { select: { name: true, price: true } },
			referralUsage: { select: { referral: { select: { registration: { select: { email: true } } } } } }
		},
		orderBy: { createdAt: "desc" }
	});

	const eventIds = [...new Set(registrations.map(r => r.eventId))];
	const formFields = eventIds.length
		? await prisma.eventFormFields.findMany({
				where: { eventId: { in: eventIds } },
				orderBy: [{ eventId: "asc" }, { order: "asc" }],
				select: { id: true, name: true, type: true, values: true }
			})
		: [];

	const fieldMap = new Map<string, FieldInfo>(formFields.map(field => [field.id, { name: getLocalizedName(field.name, field.id), type: field.type, values: field.values }]));

	const parsed = registrations.map(reg => ({ reg, formData: parseJsonObject(reg.formData, `export ${reg.id}`) }));

	const usedKeys = new Set<string>();
	for (const { formData } of parsed) for (const key of Object.keys(formData)) usedKeys.add(key);
	const formKeys = [...formFields.map(f => f.id).filter(id => usedKeys.has(id)), ...[...usedKeys].filter(key => !fieldMap.has(key)).sort()];

	const headers = ["ID", "Email", "Event", "Ticket", "Price", "Status", "Referred By", "Created At", "Checked In At", ...formKeys.map(key => `Form: ${fieldMap.get(key)?.name ?? key}`)];

	const rows = parsed.map(({ reg, formData }) => [
		reg.id,
		reg.email,
		getLocalizedName(reg.event?.name),
		getLocalizedName(reg.ticket?.name),
		reg.ticket?.price ?? 0,
		reg.status,
		reg.referralUsage[0]?.referral.registration.email ?? "",
		reg.createdAt.toISOString(),
		reg.checkedIn && reg.checkedInAt ? reg.checkedInAt.toISOString() : "",
		...formKeys.map(key => formatFieldValue(fieldMap.get(key), formData[key]))
	]);

	return { headers, rows };
}
