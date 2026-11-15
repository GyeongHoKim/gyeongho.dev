import { expect, test } from "@playwright/test";

test("slide button shows the review toast and downloads nothing", async ({
	page,
}) => {
	await page.goto("/ko/talks/");
	let downloaded = false;
	page.on("download", () => {
		downloaded = true;
	});
	await page.getByRole("button", { name: "슬라이드 받기 (PDF)" }).click();
	await expect(
		page.getByText(
			"대외비로 인해 검수 중입니다. me@gyeongho.dev로 문의해 주세요.",
		),
	).toBeVisible();
	expect(downloaded).toBe(false);
});
test("initial filter state presses only all", async ({ page }) => {
	await page.goto("/ko/talks/");
	await expect(page.getByRole("button", { name: "전체" })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	await expect(page.getByRole("button", { name: "세미나" })).toHaveAttribute(
		"aria-pressed",
		"false",
	);
	await expect(page.getByRole("button", { name: "수상" })).toHaveAttribute(
		"aria-pressed",
		"false",
	);
});

test("filter narrows the list", async ({ page }) => {
	await page.goto("/ko/talks/");
	await expect(page.getByRole("article")).toHaveCount(3);
	await page.getByRole("button", { name: "수상" }).click();
	await expect(page.getByRole("article")).toHaveCount(1);
	await expect(page.getByRole("button", { name: "수상" })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
});

test("returning to all restores the full list", async ({ page }) => {
	await page.goto("/ko/talks/");
	await page.getByRole("button", { name: "수상" }).click();
	await page.getByRole("button", { name: "전체" }).click();
	await expect(page.getByRole("article")).toHaveCount(3);
	await expect(page.getByRole("button", { name: "전체" })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
});
test("card link raises the review toast", async ({ page }) => {
	await page.goto("/ko/talks/");
	await page.getByRole("article").first().getByRole("link").first().click();
	await expect(page.getByText("대외비로 인해 검수 중입니다.")).toBeVisible();
});
test("en toast copy", async ({ page }) => {
	await page.goto("/en/talks/");
	await page
		.getByRole("button", { name: /slides/i })
		.first()
		.click();
	await expect(page.getByText(/under confidentiality review/i)).toBeVisible();
});
