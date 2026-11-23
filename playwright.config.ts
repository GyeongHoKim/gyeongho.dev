import { defineConfig } from "@playwright/test";

// Far from 4321: a production preview that finds 4321 busy moves up one port,
// and it must never be taken for the drafts server.
const DRAFTS_PORT = 4400;
const DRAFTS_URL = `http://localhost:${DRAFTS_PORT}`;
const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };

export default defineConfig({
	webServer: [
		{
			command: "pnpm preview --port 4321 --ignore-lock",
			url: "http://localhost:4321/en/",
			reuseExistingServer: !process.env.CI,
		},
		{
			// Serves dist-drafts/, the build that shows draft posts.
			command: `pnpm preview --port ${DRAFTS_PORT} --ignore-lock`,
			env: { DRAFTS_BUILD: "1" },
			url: `${DRAFTS_URL}/en/`,
			reuseExistingServer: !process.env.CI,
		},
	],
	use: { baseURL: "http://localhost:4321" },
	projects: [
		{
			name: "desktop",
			testDir: "tests/e2e",
			use: { browserName: "chromium", viewport: desktop },
		},
		{
			name: "mobile",
			testDir: "tests/e2e",
			use: { browserName: "chromium", viewport: mobile },
		},
		{
			name: "drafts-desktop",
			testDir: "tests/e2e-drafts",
			use: {
				browserName: "chromium",
				viewport: desktop,
				baseURL: DRAFTS_URL,
			},
		},
		{
			name: "drafts-mobile",
			testDir: "tests/e2e-drafts",
			use: {
				browserName: "chromium",
				viewport: mobile,
				baseURL: DRAFTS_URL,
			},
		},
	],
});
