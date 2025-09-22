// @ts-check
import sitemap from "@astrojs/sitemap";
import { filterSitemapByDefaultLocale, i18n } from "astro-i18n-aut/integration";
import { defineConfig } from "astro/config";
import { defaultLocale, locales } from "./src/i18n/config.js";

export default defineConfig({
	site: "https://tickets.sitcon.org",
	trailingSlash: "always",
	build: {
		format: "directory"
	},
	redirects: {
		// "/zh": {
		// 	status: 301,
		// 	destination: "/zh-Hant/"
		// }
	},
	integrations: [
		i18n({
			locales,
			defaultLocale,
			redirectDefaultLocale: true
		}),
		sitemap({
			i18n: {
				locales,
				defaultLocale
			},
			filter: filterSitemapByDefaultLocale({ defaultLocale })
		})
	]
});
