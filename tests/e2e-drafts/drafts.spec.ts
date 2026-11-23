import { expect, test } from "@playwright/test";

test("the drafts build serves draft posts", async ({ page }) => {
	const response = await page.goto("/ko/blog/dummy-post/");
	expect(response?.status()).toBe(200);
	await expect(page.locator("h1")).toBeVisible();
});
