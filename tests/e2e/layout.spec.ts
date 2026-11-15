import { expect, test } from "@playwright/test";

for (const lang of ["ko", "en"] as const) {
	test(`${lang}: html lang, light theme and nav`, async ({ page }) => {
		await page.goto(`/${lang}/`);
		await expect(page.locator("html")).toHaveAttribute("lang", lang);
		await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
		// On narrow screens the main menu opens from a fixed button.
		const menu = page.locator("[data-menu-open]");
		const mobile = await menu.isVisible();
		if (mobile) await menu.click();
		const nav = page.locator(mobile ? "#site-menu nav" : ".desk-nav");
		for (const name of ["About", "Portfolio", "Talks", "Resume", "Blog"]) {
			await expect(nav.getByRole("link", { name })).toHaveAttribute(
				"href",
				`/${lang}/${name.toLowerCase()}/`,
			);
		}
	});
}

test("stays light when the OS prefers dark", async ({ browser }) => {
	const context = await browser.newContext({ colorScheme: "dark" });
	const page = await context.newPage();
	await page.goto("/ko/");
	const bg = await page.evaluate(
		() => getComputedStyle(document.body).backgroundColor,
	);
	expect(bg).toBe("rgb(250, 249, 247)");
});

test("footer language switch keeps the page", async ({ page }) => {
	await page.goto("/ko/");
	const footer = page.getByRole("contentinfo");
	await expect(footer.getByRole("link", { name: "English" })).toHaveAttribute(
		"href",
		"/en/",
	);
	await expect(footer.getByText("한국어")).toHaveAttribute(
		"aria-current",
		"true",
	);
});

test("gh-badge is upgraded", async ({ page }) => {
	await page.goto("/ko/");
	await page.waitForFunction(
		() => customElements.get("gh-badge") !== undefined,
	);
	await page.waitForFunction(
		() => document.querySelector("header gh-badge")?.shadowRoot != null,
	);
});
