import { expect, test } from "@playwright/test";

const POST = "/ko/blog/dummy-post/";

test("a tab in a code block is two columns wide", async ({ page }) => {
	const response = await page.goto(POST);
	expect(response?.status()).toBe(200);
	// Whatever the post holds: a code block put into its body.
	const tabSize = await page.evaluate(() => {
		const pre = document.createElement("pre");
		document.querySelector(".prose")?.append(pre);
		return getComputedStyle(pre).tabSize;
	});
	expect(tabSize).toBe("2");
});
