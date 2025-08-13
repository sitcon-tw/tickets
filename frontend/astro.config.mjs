// @ts-check
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import { filterSitemapByDefaultLocale, i18n } from "astro-i18n-aut/integration";
import { defineConfig } from "astro/config";
import { defaultLocale, locales } from "./src/i18n/config.js";
const isCFWorker = process.env.DEPLOY_ENV === "cloudflare";

export default defineConfig({
	site: "https://example.com",
	trailingSlash: "always",
	build: {
		format: "directory"
	},
	adapter: isCFWorker ? cloudflare() : node({ mode: "standalone" }),
	output: "server",
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
