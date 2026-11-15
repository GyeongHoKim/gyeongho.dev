import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://gyeongho.dev",
	output: "static",
	trailingSlash: "always",
	i18n: {
		locales: ["ko", "en"],
		defaultLocale: "en",
		routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
	},
	integrations: [
		sitemap({
			i18n: { defaultLocale: "en", locales: { ko: "ko-KR", en: "en-US" } },
		}),
	],
	markdown: { shikiConfig: { theme: "vitesse-light", wrap: true } },
});
