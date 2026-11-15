import { expect, test } from "@playwright/test";

const pages = [
	["about", "About"],
	["uses", "Uses"],
	["colophon", "Colophon"],
] as const;
for (const lang of ["ko", "en"] as const) {
	for (const [path, heading] of pages) {
		test(`${lang}/${path} renders its heading`, async ({ page }) => {
			await page.goto(`/${lang}/${path}/`);
			await expect(
				page.getByRole("heading", { level: 1, name: heading }),
			).toBeVisible();
		});
	}
}
test("about has the #now section and twelve interest cards", async ({
	page,
}) => {
	await page.goto("/ko/about/#now");
	await expect(
		page.locator("#now").getByRole("heading", { name: "Now" }),
	).toBeVisible();
	await expect(page.locator("#playground li")).toHaveCount(12);
});
test("about marks About as the current nav item", async ({ page }) => {
	await page.goto("/en/about/");
	// On narrow screens the main menu opens from a fixed button.
	const menu = page.locator("[data-menu-open]");
	if (await menu.isVisible()) await menu.click();
	await expect(
		page.getByRole("link", { name: "About" }).first(),
	).toHaveAttribute("aria-current", "page");
});
