import { expect, test } from "@playwright/test";

test("offers a webmention form that posts source and target", async ({
	page,
}) => {
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(e.message));
	await page.goto("/ko/guestbook/");
	await expect(
		page.getByRole("heading", { level: 1, name: "Guestbook" }),
	).toBeVisible();
	const form = page.locator("form#guestbook-form");
	await expect(form).toHaveAttribute("method", /post/i);
	await expect(form).toHaveAttribute(
		"action",
		"https://webmention.io/gyeongho.dev/webmention",
	);
	await expect(form.locator("input[name=target]")).toHaveValue(
		"https://gyeongho.dev/ko/guestbook/",
	);
	await expect(form.locator("input[name=source]")).toHaveAttribute(
		"type",
		"url",
	);
	await expect(form.locator("gh-input[name=source]")).toHaveAttribute(
		"type",
		"url",
	);
	await expect(page.getByTestId("guestbook-empty")).toBeVisible();
	expect(errors).toEqual([]);
});

test("en page targets the en guestbook URL", async ({ page }) => {
	await page.goto("/en/guestbook/");
	await expect(
		page.locator("form#guestbook-form input[name=target]"),
	).toHaveValue("https://gyeongho.dev/en/guestbook/");
});
