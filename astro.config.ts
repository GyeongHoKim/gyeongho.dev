import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://gyeongho.dev",
	output: "static",
	// `astro preview` has no --outDir flag, so the drafts build is chosen by env.
	outDir: process.env.DRAFTS_BUILD === "1" ? "./dist-drafts" : "./dist",
	trailingSlash: "always",
	i18n: {
		locales: ["ko", "en"],
		defaultLocale: "en",
		routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
	},
	integrations: [
		sitemap({
			// The root page only redirects to a locale and is noindex.
			filter: (page) => new URL(page).pathname !== "/",
			i18n: { defaultLocale: "en", locales: { ko: "ko-KR", en: "en-US" } },
		}),
	],
	markdown: { shikiConfig: { theme: "vitesse-light", wrap: true } },
});
