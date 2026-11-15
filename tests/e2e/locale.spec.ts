import { expect, test } from "@playwright/test";

for (const [locale, expected] of [
	["ko-KR", "/ko/"],
	["en-US", "/en/"],
	["ja-JP", "/en/"],
] as const) {
	test(`/ redirects ${locale} to ${expected}`, async ({ browser }) => {
		const context = await browser.newContext({ locale });
		const page = await context.newPage();
		await page.goto("/");
		await page.waitForURL(`**${expected}`);
	});
}

test("/ shows both links without JavaScript", async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	await page.goto("/");
	await expect(page.getByRole("link", { name: "한국어" })).toHaveAttribute(
		"href",
		"/ko/",
	);
	await expect(page.getByRole("link", { name: "English" })).toHaveAttribute(
		"href",
		"/en/",
	);
});
