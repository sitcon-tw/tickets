/**
 * Site-wide settings managed from the admin panel
 */

import { z } from "zod/v4";

export const SiteSettingsSchema = z.object({
	/** When enabled, the homepage redirects straight to the first event's page. */
	redirectHomeToFirstEvent: z.boolean()
});
export type SiteSettings = z.infer<typeof SiteSettingsSchema>;

export const SiteSettingsUpdateRequestSchema = SiteSettingsSchema.partial();
export type SiteSettingsUpdateRequest = z.infer<typeof SiteSettingsUpdateRequestSchema>;

export const defaultSiteSettings: SiteSettings = {
	redirectHomeToFirstEvent: false
};
