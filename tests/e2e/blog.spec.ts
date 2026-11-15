import { expect, test } from "@playwright/test";

test("production build hides the draft post", async ({ page }) => {
	await page.goto("/ko/blog/");
	await expect(page.getByTestId("blog-empty")).toBeVisible();
	const response = await page.goto("/ko/blog/dummy-post/");
	expect(response?.status()).toBe(404);
});

test("home keeps the empty Lately state while there are no posts", async ({
	page,
}) => {
	await page.goto("/en/");
	await expect(page.getByTestId("lately-empty")).toBeVisible();
});

test("blog empty state hides the Series note and keeps the RSS card", async ({
	page,
}) => {
	await page.goto("/en/blog/");
	await expect(page.getByTestId("blog-empty")).toHaveText(
		"Nothing published yet.",
	);
	await expect(page.getByRole("heading", { name: "Series" })).toHaveCount(0);
	await expect(page.getByRole("link", { name: "New to RSS?" })).toHaveAttribute(
		"href",
		"/en/rss/",
	);
	await expect(
		page.getByRole("link", { name: "Subscribe via RSS" }),
	).toHaveAttribute("href", "/en/feed.xml");
});
