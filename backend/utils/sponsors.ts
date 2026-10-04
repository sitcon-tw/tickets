import prisma from "#config/database";
import { formatDateOnly } from "#utils/timezone";
import { LocalizedTextSchema, SponsorPlacementSchema, SponsorSectionTitlesSchema, type SponsorPlacement, type SponsorSectionTitles, type SponsorStats } from "@sitcontix/types";
import { z } from "zod/v4";

export const emptySponsorStats = (): SponsorStats => ({ impressions: 0, clicks: 0, linkClicks: 0 });

type SponsorRow = {
	name: unknown;
	description: unknown;
	placements: string[];
};

/** Normalize the JSON / string[] columns of a sponsor row into their typed shapes. */
export function parseSponsorRow<T extends SponsorRow>(row: T) {
	return {
		...row,
		name: LocalizedTextSchema.parse(row.name),
		description: LocalizedTextSchema.nullable().parse(row.description),
		placements: z.array(SponsorPlacementSchema).parse(row.placements)
	};
}

/** Keep only non-empty, trimmed titles per language, and drop placements that end up empty. */
export function cleanSponsorTitles(titles: SponsorSectionTitles): SponsorSectionTitles {
	const result: SponsorSectionTitles = {};
	for (const placement of SponsorPlacementSchema.options) {
		const entries = Object.entries(titles[placement] ?? {})
			.map(([lang, text]) => [lang, text.trim()] as const)
			.filter(([, text]) => text);
		if (entries.length > 0) result[placement] = Object.fromEntries(entries);
	}
	return result;
}

/** Parse the stored section titles. Anything unreadable falls back to "no custom titles". */
export function parseSponsorTitles(value: unknown): SponsorSectionTitles {
	const parsed = SponsorSectionTitlesSchema.safeParse(value);
	return parsed.success ? cleanSponsorTitles(parsed.data) : {};
}

export type SponsorCounter = SponsorStats & { sponsorId: string; placement: SponsorPlacement };

/**
 * Add to the daily counters. Uses an atomic upsert so concurrent requests for the same sponsor / day / placement never lose an increment.
 */
export async function incrementSponsorStats(counters: SponsorCounter[]): Promise<void> {
	if (counters.length === 0) return;

	// Counters are bucketed by day in UTC+8, like the rest of the admin reports.
	const date = formatDateOnly(new Date());

	await prisma.$transaction(
		counters.map(
			counter => prisma.$executeRaw`
				INSERT INTO "sponsor_stat" ("sponsorId", "date", "placement", "impressions", "clicks", "linkClicks")
				VALUES (${counter.sponsorId}, ${date}::date, ${counter.placement}, ${counter.impressions}, ${counter.clicks}, ${counter.linkClicks})
				ON CONFLICT ("sponsorId", "date", "placement") DO UPDATE SET
					"impressions" = "sponsor_stat"."impressions" + EXCLUDED."impressions",
					"clicks" = "sponsor_stat"."clicks" + EXCLUDED."clicks",
					"linkClicks" = "sponsor_stat"."linkClicks" + EXCLUDED."linkClicks"
			`
		)
	);
}

/** Crawlers, link previews and headless browsers should not inflate impressions. */
const BOT_USER_AGENT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|curl|wget|python-requests/i;

export const isBotUserAgent = (userAgent: string | undefined): boolean => !userAgent || BOT_USER_AGENT.test(userAgent);
