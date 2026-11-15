import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "tests/e2e",
	webServer: {
		command: "pnpm preview --port 4321 --ignore-lock",
		url: "http://localhost:4321/en/",
		reuseExistingServer: !process.env.CI,
	},
	use: { baseURL: "http://localhost:4321" },
	projects: [
		{
			name: "desktop",
			use: { browserName: "chromium", viewport: { width: 1440, height: 900 } },
		},
		{
			name: "mobile",
			use: { browserName: "chromium", viewport: { width: 390, height: 844 } },
		},
	],
});
