import prisma from "#config/database";
import { defaultSiteSettings, SiteSettingsSchema, type SiteSettings, type SiteSettingsUpdateRequest } from "@sitcontix/types";
import { safeJsonParse } from "./json";

export async function getSiteSettings(): Promise<SiteSettings> {
	const rows = await prisma.siteSetting.findMany();
	const stored = Object.fromEntries(rows.map(row => [row.key, safeJsonParse<unknown>(row.value, undefined, `site setting ${row.key}`)]).filter(([, value]) => value !== undefined));
	const parsed = SiteSettingsSchema.safeParse({ ...defaultSiteSettings, ...stored });
	return parsed.success ? parsed.data : defaultSiteSettings;
}

export async function updateSiteSettings(update: SiteSettingsUpdateRequest): Promise<SiteSettings> {
	const entries = Object.entries(update).filter(([, value]) => value !== undefined);

	await prisma.$transaction(
		entries.map(([key, value]) =>
			prisma.siteSetting.upsert({
				where: { key },
				create: { key, value: JSON.stringify(value) },
				update: { value: JSON.stringify(value) }
			})
		)
	);

	return getSiteSettings();
}
