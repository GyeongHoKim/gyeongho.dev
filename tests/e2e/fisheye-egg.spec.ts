import { expect, test } from "@playwright/test";

test("five logo clicks bend the page, Escape restores it", async ({ page }) => {
	await page.goto("/ko/about/");
	const logo = page.getByRole("link", { name: /gyeongho\.dev/ }).first();
	for (let i = 0; i < 5; i++)
		await logo.click({ modifiers: [], noWaitAfter: true });
	await expect(page).toHaveURL(/\/ko\/about\/$/);
	await expect(page.locator("html")).toHaveAttribute("data-fisheye", "");
	await page.keyboard.press("Escape");
	await expect(page.locator("html")).not.toHaveAttribute("data-fisheye", "");
});
test("does nothing with reduced motion", async ({ browser }) => {
	const context = await browser.newContext({ reducedMotion: "reduce" });
	const page = await context.newPage();
	await page.goto("/ko/about/");
	const logo = page.getByRole("link", { name: /gyeongho\.dev/ }).first();
	for (let i = 0; i < 5; i++) await logo.click({ noWaitAfter: true });
	await expect(page.locator("html")).not.toHaveAttribute("data-fisheye", "");
	await context.close();
});
test("a single logo click still goes home", async ({ page }) => {
	await page.goto("/ko/about/");
	await page
		.getByRole("link", { name: /gyeongho\.dev/ })
		.first()
		.click();
	await expect(page).toHaveURL(/\/ko\/$/);
});
