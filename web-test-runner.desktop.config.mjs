import { puppeteerLauncher } from "@web/test-runner-puppeteer";
import { baseConfig } from "./web-test-runner.base.config.mjs";

export default {
	...baseConfig,
	files: ["test/**/*.shared.test.ts", "test/**/*.desktop.test.ts"],
	browsers: [
		puppeteerLauncher({
			launchOptions: {
				headless: true,
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
			},
			async createPage({ context }) {
				const page = await context.newPage();
				await page.setViewport({ width: 1280, height: 720 });
				return page;
			},
		}),
	],
};
